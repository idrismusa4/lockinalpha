"use server";

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { storage } from '../supabase';
import axios from 'axios';
import { updateJobStatus, updateJobProgress } from './jobService';
import { convertScriptToSpeech } from './awsPollyService';
import { exec } from 'child_process';
import { promisify } from 'util';

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Define paths for temporary files
const TMP_DIR = os.tmpdir();

interface VideoRenderParams {
  script: string;
  jobId: string;
  voiceId?: string;
  onProgress?: (progress: number) => void;
}

/**
 * A fallback video rendering service that creates a simple MP4 file
 */
export async function renderVideoFallback({
  script,
  jobId,
  voiceId,
  onProgress = () => {}
}: VideoRenderParams): Promise<string> {
  try {
    console.log(`Starting video generation for job: ${jobId}`);
    
    // Update job status to processing immediately
    await updateJobStatus(jobId, { status: 'processing', progress: 5 });
    
    // Create temporary directory for outputs
    const outputDir = path.join(TMP_DIR, `remotion-${jobId}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Path to output video file
    let outputFile = path.join(outputDir, `${jobId}.mp4`);
    const audioFile = path.join(outputDir, `${jobId}.mp3`);
    const finalVideoFile = path.join(outputDir, `final-${jobId}.mp4`);
    
    // Update progress and ensure it's saved
    await updateJobProgress(jobId, 10);
    onProgress(10);
    
    // Generate audio from script using AWS Polly
    console.log('Generating speech from text using AWS Polly...');
    try {
      await convertScriptToSpeech(script, jobId, voiceId)
        .then(audioPath => {
          // Copy the audio file to the expected location if needed
          if (audioPath !== audioFile && fs.existsSync(audioPath)) {
            fs.copyFileSync(audioPath, audioFile);
          }
        });
      
      await updateJobProgress(jobId, 50);
      onProgress(50);
      
      console.log('Audio generation completed');
    } catch (audioError) {
      console.error('Error generating audio:', audioError);
      throw new Error(`Failed to generate audio: ${audioError instanceof Error ? audioError.message : String(audioError)}`);
    }
    
    // Create a valid but simple MP4 file
    console.log('Creating video file...');
    try {
      await createSlideshowFromScript(outputFile, script, audioFile);
      await updateJobProgress(jobId, 70);
      onProgress(70);
    } catch (videoError) {
      console.error('Error creating video:', videoError);
      throw new Error(`Failed to create video: ${videoError instanceof Error ? videoError.message : String(videoError)}`);
    }
    
    // Skip the separate combining step since we're now creating the video with audio included
    
    // Update progress
    await updateJobProgress(jobId, 80);
    onProgress(80);
    
    // Upload the rendered video to Supabase Storage
    console.log('Uploading video to storage...');
    let videoUrl;
    try {
      videoUrl = await uploadVideoToSupabase(outputFile, jobId);
      await updateJobProgress(jobId, 100);
      onProgress(100);
    } catch (uploadError) {
      console.error('Error uploading video:', uploadError);
      throw new Error(`Failed to upload video: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
    }
    
    // Clean up temporary files
    try {
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
      if (fs.existsSync(finalVideoFile)) fs.unlinkSync(finalVideoFile);
      if (fs.existsSync(outputDir)) fs.rmdirSync(outputDir, { recursive: true });
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary files:', cleanupError);
      // Don't fail the process for cleanup errors
    }
    
    console.log(`Video generation completed for job: ${jobId}`);
    return videoUrl;
  } catch (error) {
    console.error('Error rendering video fallback:', error);
    // Make sure to update job status to failed
    await updateJobStatus(jobId, { 
      status: 'failed',
      error: `Video generation failed: ${error instanceof Error ? error.message : String(error)}`
    });
    throw new Error(`Failed to render video: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a simple PNG image with text
 */
async function createSimpleImage(outputPath: string, title: string): Promise<void> {
  try {
    // Create a simple color image without text - avoiding font config issues
    const ffmpegCmd = `ffmpeg -f lavfi -i color=c=blue:s=1280x720 -frames:v 1 "${outputPath}"`;
    
    console.log(`Creating image with command: ${ffmpegCmd}`);
    await execAsync(ffmpegCmd);
    
    if (!fs.existsSync(outputPath)) {
      throw new Error('Failed to create image file');
    }
    
    console.log(`Created image at: ${outputPath}`);
  } catch (error) {
    console.error('Error creating image:', error);
    throw error;
  }
}

/**
 * Creates a slideshow video from the script content using FFmpeg
 */
async function createSlideshowFromScript(outputPath: string, script: string, audioPath: string): Promise<void> {
  // Create a temporary image for the video
  const tmpDir = path.dirname(outputPath);
  const imagePath = path.join(tmpDir, 'slide.png');
  
  try {
    // Create a simple image file
    await createSimpleImage(imagePath, getTitle(script));
    
    // Now use FFmpeg to create a video with the audio
    console.log('Creating video with FFmpeg...');
    
    // First, check if the audio file exists and has content
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file does not exist at path: ${audioPath}`);
    }
    
    const audioStats = fs.statSync(audioPath);
    if (audioStats.size < 100) {
      throw new Error(`Audio file is too small (${audioStats.size} bytes) and may be corrupted`);
    }
    
    console.log(`Found valid audio file: ${audioPath} (${audioStats.size} bytes)`);
    
    // Calculate a default duration if we can't get it from the audio
    let duration = 10; // default 10 seconds
    
    try {
      // Get audio duration - use a simpler, more direct approach
      const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`);
      if (stdout.trim()) {
        duration = parseFloat(stdout.trim());
        console.log(`Audio duration from ffprobe: ${duration} seconds`);
      }
    } catch (durationError) {
      console.warn('Error getting audio duration, using default:', durationError);
    }
    
    // Create video from image and audio using a simpler command
    const ffmpegCmd = `ffmpeg -loop 1 -i "${imagePath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest -pix_fmt yuv420p "${outputPath}"`;
    
    console.log(`Executing FFmpeg command: ${ffmpegCmd}`);
    const { stdout, stderr } = await execAsync(ffmpegCmd);
    
    if (stderr) {
      console.log('FFmpeg stderr output:', stderr);
    }
    
    // Check if the output file exists and has a reasonable size
    if (!fs.existsSync(outputPath)) {
      throw new Error('FFmpeg did not produce an output file');
    }
    
    const fileStats = fs.statSync(outputPath);
    if (fileStats.size < 1000) { // Less than 1KB is suspicious
      throw new Error(`Output file is too small (${fileStats.size} bytes) and may be corrupted`);
    }
    
    console.log(`Successfully created video at: ${outputPath} (${fileStats.size} bytes)`);
    
    // Clean up the temporary image
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
  } catch (error) {
    console.error('Error creating slideshow video:', error);
    throw error;
  }
}

/**
 * Extract a title from the script
 */
function getTitle(script: string): string {
  // Try to extract a title from the first line
  const firstLine = script.split('\n')[0].trim();
  if (firstLine.length > 0) {
    // Remove any markdown headers
    return firstLine.replace(/^#+\s*/, '');
  }
  return "LockIn Video Lecture";
}

/**
 * Uploads a rendered video file to Supabase Storage
 */
async function uploadVideoToSupabase(filePath: string, jobId: string): Promise<string> {
  try {
    const fileName = `${jobId}.mp4`;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Video file not found at path: ${filePath}`);
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    if (fileBuffer.length < 100) {
      throw new Error(`Video file is too small (${fileBuffer.length} bytes) and may be corrupted`);
    }
    
    console.log(`Uploading video to Supabase: ${fileName}, size: ${fileBuffer.length} bytes`);
    
    // Check if storage is initialized
    if (!storage) {
      throw new Error('Supabase storage is not initialized');
    }
    
    // Upload the file to the pre-created 'videos' bucket
    const { error: uploadError } = await storage
      .from('videos')
      .upload(fileName, fileBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw uploadError;
    }
    
    // Get the public URL
    const { data: urlData } = storage
      .from('videos')
      .getPublicUrl(fileName);
      
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for the uploaded video');
    }
    
    console.log(`Video uploaded successfully, public URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading video to Supabase:', error);
    throw error; // Let the caller handle this error
  }
} 
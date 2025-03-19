"use server";

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { storage } from '../supabase';
import { updateJobStatus, updateJobProgress } from './jobService';
import { convertScriptToSpeech } from './awsPollyService';
import { exec } from 'child_process';
import { promisify } from 'util';

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Define paths for temporary files - use /tmp for Vercel
const TMP_DIR = process.env.NODE_ENV === 'production' 
  ? '/tmp' 
  : os.tmpdir();

// Flag for checking if we're in a serverless environment
const IS_SERVERLESS = process.env.VERCEL === '1';

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
    
    // In a serverless environment, we might not have FFmpeg available
    // In that case, just use the audio file as is and set a flag for the frontend
    let isAudioOnly = false;
    
    // Create a video file if not in a serverless environment or if FFmpeg is available
    if (IS_SERVERLESS) {
      console.log('Running in serverless environment, checking for FFmpeg...');
      try {
        await execAsync('ffmpeg -version');
        console.log('FFmpeg is available in serverless environment');
      } catch (ffmpegError) {
        console.log('FFmpeg not available in serverless environment, using audio-only mode');
        isAudioOnly = true;
      }
    }
    
    if (!isAudioOnly) {
      console.log('Creating video file...');
      try {
        await createSlideshowFromScript(outputFile, script, audioFile);
        await updateJobProgress(jobId, 70);
        onProgress(70);
      } catch (videoError) {
        console.error('Error creating video:', videoError);
        console.log('Falling back to audio-only mode');
        isAudioOnly = true;
      }
    }
    
    // If we're in audio-only mode, use the audio file instead
    const fileToUpload = isAudioOnly ? audioFile : outputFile;
    const contentType = isAudioOnly ? 'audio/mpeg' : 'video/mp4';
    const fileExtension = isAudioOnly ? '.mp3' : '.mp4';
    
    // Update progress
    await updateJobProgress(jobId, 80);
    onProgress(80);
    
    // Upload the rendered file to Supabase Storage
    console.log(`Uploading ${isAudioOnly ? 'audio' : 'video'} to storage...`);
    let mediaUrl;
    try {
      mediaUrl = await uploadToSupabase(fileToUpload, jobId, fileExtension, contentType, isAudioOnly);
      await updateJobProgress(jobId, 100);
      onProgress(100);
    } catch (uploadError) {
      console.error('Error uploading media:', uploadError);
      throw new Error(`Failed to upload media: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
    }
    
    // Clean up temporary files
    try {
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
      if (fs.existsSync(outputDir)) fs.rmdirSync(outputDir, { recursive: true });
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary files:', cleanupError);
      // Don't fail the process for cleanup errors
    }
    
    console.log(`Media generation completed for job: ${jobId}`);
    return mediaUrl;
  } catch (error) {
    console.error('Error rendering media:', error);
    // Make sure to update job status to failed
    await updateJobStatus(jobId, { 
      status: 'failed',
      error: `Media generation failed: ${error instanceof Error ? error.message : String(error)}`
    });
    throw new Error(`Failed to render media: ${error instanceof Error ? error.message : String(error)}`);
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
    
    // Use a simpler FFmpeg command for better compatibility
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
 * Uploads a file to Supabase Storage
 */
async function uploadToSupabase(
  filePath: string, 
  jobId: string, 
  fileExtension: string = '.mp4',
  contentType: string = 'video/mp4',
  isAudioOnly: boolean = false
): Promise<string> {
  try {
    const bucketName = isAudioOnly ? 'audios' : 'videos';
    const fileName = `${jobId}${fileExtension}`;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    if (fileBuffer.length < 100) {
      throw new Error(`File is too small (${fileBuffer.length} bytes) and may be corrupted`);
    }
    
    console.log(`Uploading to Supabase: ${fileName}, size: ${fileBuffer.length} bytes`);
    
    // Check if storage is initialized
    if (!storage) {
      throw new Error('Supabase storage is not initialized');
    }
    
    // Upload the file to the appropriate bucket
    const { error: uploadError } = await storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw uploadError;
    }
    
    // Get the public URL
    const { data: urlData } = storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    if (!urlData || !urlData.publicUrl) {
      throw new Error(`Failed to get public URL for the uploaded ${isAudioOnly ? 'audio' : 'video'}`);
    }
    
    console.log(`${isAudioOnly ? 'Audio' : 'Video'} uploaded successfully, public URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`Error uploading ${isAudioOnly ? 'audio' : 'video'} to Supabase:`, error);
    throw error; // Let the caller handle this error
  }
} 
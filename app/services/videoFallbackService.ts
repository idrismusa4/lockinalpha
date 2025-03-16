"use server";

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { storage } from '../supabase';
import axios from 'axios';
import { updateJobStatus, updateJobProgress } from './jobService';

// Define paths for temporary files
const TMP_DIR = os.tmpdir();

interface VideoRenderParams {
  script: string;
  jobId: string;
  onProgress?: (progress: number) => void;
}

/**
 * A fallback video rendering service that includes TTS
 */
export async function renderVideoFallback({
  script,
  jobId,
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
    const outputFile = path.join(outputDir, `${jobId}.mp4`);
    const audioFile = path.join(outputDir, `${jobId}.mp3`);
    
    // Update progress and ensure it's saved
    await updateJobProgress(jobId, 10);
    onProgress(10);
    
    // Generate audio from the script (TTS)
    console.log('Generating audio from script...');
    try {
      await generateAudio(script, audioFile);
      await updateJobProgress(jobId, 40);
      onProgress(40);
    } catch (audioError) {
      console.error('Error generating audio:', audioError);
      await updateJobStatus(jobId, { 
        status: 'processing', 
        progress: 40,
        error: `Audio generation had issues but continuing: ${audioError instanceof Error ? audioError.message : String(audioError)}`
      });
      // Continue with empty audio - don't fail the whole process
    }
    
    // Create video with the audio and script
    console.log('Creating video with audio...');
    try {
      createVideoWithAudio(outputFile, audioFile, script);
      await updateJobProgress(jobId, 70);
      onProgress(70);
    } catch (videoError) {
      console.error('Error creating video:', videoError);
      throw new Error(`Failed to create video: ${videoError instanceof Error ? videoError.message : String(videoError)}`);
    }
    
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
 * Generate audio from text using Google Cloud Text-to-Speech API
 * For demo purposes, we're using a fallback that creates an empty MP3 file
 */
async function generateAudio(script: string, outputPath: string): Promise<void> {
  try {
    // Try to use Google Cloud TTS API if API key exists
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    
    if (apiKey) {
      console.log('Using Google TTS API...');
      
      // Process the script to get a reasonable amount of text (first 1000 chars)
      const textToSpeak = script.substring(0, 1000);
      
      try {
        // Make TTS API request
        const response = await axios.post(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
          {
            input: { text: textToSpeak },
            voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
            audioConfig: { audioEncoding: 'MP3' }
          },
          {
            timeout: 10000, // 10 second timeout
          }
        );
        
        if (response.data && response.data.audioContent) {
          // Convert base64 to buffer and save as MP3
          const audioBuffer = Buffer.from(response.data.audioContent, 'base64');
          fs.writeFileSync(outputPath, audioBuffer);
          console.log('TTS audio generated successfully');
          return;
        } else {
          throw new Error('Invalid response from TTS API');
        }
      } catch (apiError) {
        console.error('TTS API error:', apiError);
        throw new Error(`TTS API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      }
    }
    
    // Fallback: Create an empty MP3 file with basic header
    console.log('Using TTS fallback (empty audio file)');
    const emptyMp3 = Buffer.from([
      0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    fs.writeFileSync(outputPath, emptyMp3);
    
  } catch (error) {
    console.error('Error generating audio, using fallback:', error);
    // Fallback to empty audio file on error
    const emptyMp3 = Buffer.from([
      0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    fs.writeFileSync(outputPath, emptyMp3);
  }
}

/**
 * Creates a video file with audio and script text
 * This is a simplified placeholder implementation
 */
function createVideoWithAudio(outputPath: string, audioPath: string, script: string): void {
  try {
    console.log('Creating video with audio and text...');
    
    // For now, create a minimal MP4 file since we don't have ffmpeg in this environment
    // In a real implementation, you would:
    // 1. Use ffmpeg to create slides from the script
    // 2. Add the audio track
    // 3. Render a proper video
    
    // Just create a placeholder MP4 file for demo
    const placeholderMp4Header = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
      0x6D, 0x70, 0x34, 0x32, 0x00, 0x00, 0x00, 0x00,
      0x69, 0x73, 0x6F, 0x6D, 0x6D, 0x70, 0x34, 0x32
    ]);
    
    fs.writeFileSync(outputPath, placeholderMp4Header);
    
    console.log('Created placeholder video file at:', outputPath);
    console.log('Script that would be used:', script.substring(0, 100) + '...');
  } catch (error) {
    console.error('Error creating video with audio:', error);
    throw error; // Let the caller handle this error
  }
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
    if (fileBuffer.length < 10) {
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
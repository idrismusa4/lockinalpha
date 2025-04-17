"use server";

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { storage } from '../supabase';
import { DEFAULT_VOICE_ID } from './voiceOptions';
import { FetchedMedia } from './mediaFetchService';
import { renderVideoWithLambda } from './renderWithLambda';
import { generateSpeech } from './speechService';

// Define paths for temporary files
const TMP_DIR = os.tmpdir();

interface VideoRenderParams {
  script: string;
  jobId: string;
  voiceId?: string;
  media?: FetchedMedia[][];
}

export async function renderVideoWithRemotion({
  script,
  jobId,
  voiceId,
  media
}: VideoRenderParams): Promise<string> {
  try {
    console.log(`Starting video generation process with job ID: ${jobId}`);
    
    // Generate the audio for the script
    const audioUrl = await generateSpeech(script, voiceId);
    console.log(`Audio generated: ${audioUrl}`);
    
    // Render the video with the generated audio
    const url = await renderVideoWithLambda({
      script,
      jobId,
      voiceId,
      media,
      onProgress: (progress) => {
        console.log(`Render progress: ${progress}%`);
      }
    });
    
    return url;
  } catch (error) {
    console.error('Error in video rendering process:', error);
    throw new Error(`Failed to render video: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a simple placeholder video file for demonstration purposes
 * In a real application, you would use a more robust video generation method
 */
function createPlaceholderVideoFile(outputPath: string, script: string, voiceId: string = DEFAULT_VOICE_ID): void {
  // This is just a placeholder function - in a real implementation you would:
  // 1. Use ffmpeg or another library to generate a video
  // 2. Write the script text as frames in the video
  // 3. Add some basic animations
  // 4. Use the voiceId to generate the appropriate voice narration
  
  // For now, just create an empty file to demonstrate the flow
  fs.writeFileSync(outputPath, Buffer.from([0, 0, 0, 32, 102, 116, 121, 112, 109, 112, 52, 50]));
  
  console.log('Created placeholder video file at:', outputPath);
  console.log('Script that would be used:', script.substring(0, 100) + '...');
  console.log('Voice that would be used:', voiceId);
}

/**
 * Uploads a rendered video file to Supabase Storage
 */
async function uploadVideoToSupabase(filePath: string, jobId: string): Promise<string> {
  try {
    const fileName = `${jobId}.mp4`;
    const fileBuffer = fs.readFileSync(filePath);
    
    // Upload the file to the pre-created 'videos' bucket
    const { error: uploadError } = await storage
      .from('videos')
      .upload(fileName, fileBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL
    const { data: urlData } = storage
      .from('videos')
      .getPublicUrl(fileName);
      
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for the uploaded video');
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading video to Supabase:', error);
    throw new Error(`Failed to upload video to storage: ${error instanceof Error ? error.message : String(error)}`);
  }
} 
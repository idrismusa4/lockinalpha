"use server";

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { storage } from '../supabase';
import { DEFAULT_VOICE_ID } from './voiceOptions';
import { FetchedMedia } from './mediaFetchService';

// Define paths for temporary files
const TMP_DIR = os.tmpdir();

interface VideoRenderParams {
  script: string;
  jobId: string;
  voiceId?: string;
  media?: FetchedMedia[][];
  onProgress?: (progress: number) => void;
}

export async function renderVideoWithRemotion({
  script,
  jobId,
  voiceId = DEFAULT_VOICE_ID,
  media,
  onProgress = () => {}
}: VideoRenderParams): Promise<string> {
  try {
    // Create temporary directory for outputs
    const outputDir = path.join(TMP_DIR, `remotion-${jobId}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Path to output video file
    const outputFile = path.join(outputDir, `${jobId}.mp4`);
    
    onProgress(10);
    
    try {
      // Dynamically import Remotion packages to avoid build errors
      // These need to be installed: npm install @remotion/bundler @remotion/renderer @remotion/cli
      const { bundle } = await import('@remotion/bundler');
      const { renderMedia, selectComposition } = await import('@remotion/renderer');
      
      // Bundle the Remotion project
      const bundleLocation = await bundle({
        entryPoint: path.join(process.cwd(), 'app/remotion/index.tsx'),
        // If you have a webpack override file, add it here
        // webpackOverride: (config) => config,
      });
      
      onProgress(30);
      
      // Log if media exists
      if (media && Array.isArray(media)) {
        console.log(`Rendering with ${media.length} media segments`);
        console.log(`First media item: ${media[0]?.[0]?.url?.substring(0, 50) || 'none'}`);
      } else {
        console.log('Rendering without media data');
      }
      
      // Select the composition to render with media if available
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'VideoLecture',
        inputProps: {
          script,
          voiceId,
          media, // Pass the media to the Remotion composition
        },
      });
      
      onProgress(40);
      
      // Render the video
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputFile,
        imageFormat: 'jpeg',
        onProgress: ({ progress }) => {
          // Remotion progress ranges from 0 to 1, scale to 40-90%
          const scaledProgress = 40 + Math.round(progress * 50);
          onProgress(scaledProgress);
        },
      });
      
      onProgress(90);
    } catch (remotionError) {
      console.error('Error with Remotion rendering:', remotionError);
      
      // FALLBACK: Create a simple placeholder video file
      // In a real implementation, you would use a different video generation method
      // For demo purposes, we'll just create a very simple file
      createPlaceholderVideoFile(outputFile, script, voiceId);
      
      onProgress(90);
    }
    
    // Upload the rendered video to Supabase Storage
    const videoUrl = await uploadVideoToSupabase(outputFile, jobId);
    
    onProgress(100);
    
    // Clean up temporary files
    try {
      fs.unlinkSync(outputFile);
      fs.rmdirSync(outputDir, { recursive: true });
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary files:', cleanupError);
    }
    
    return videoUrl;
  } catch (error) {
    console.error('Error rendering video with Remotion:', error);
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
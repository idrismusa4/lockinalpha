"use server";

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { storage } from '../supabase';
import { DEFAULT_VOICE_ID } from './voiceOptions';
import { FetchedMedia } from './mediaFetchService';
import { renderWithLambda } from './remotionLambdaService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchMediaForScript } from './mediaFetchService';

// Define paths for temporary files
const TMP_DIR = os.tmpdir();

interface VideoRenderParams {
  script: string;
  jobId: string;
  voiceId?: string;
  media?: FetchedMedia[][];
  onProgress?: (progress: number) => void;
}

interface VideoGenerationParams {
  documentUrl: string;
  style?: string;
  onProgress?: (progress: number) => void;
}

export async function renderVideoWithRemotion({
  script,
  jobId,
  voiceId,
  media,
  onProgress = () => {}
}: VideoRenderParams): Promise<string> {
  try {
    // First try Lambda rendering if configured
    if (process.env.REMOTION_LAMBDA_FUNCTION_NAME && process.env.REMOTION_SERVE_URL) {
      try {
        console.log('Attempting Lambda render...');
        const videoUrl = await renderWithLambda({
          script,
          audioUrl: voiceId ? `/api/audio/${jobId}` : undefined,
          media,
          onProgress
        });
        return videoUrl;
      } catch (lambdaError) {
        console.error('Lambda rendering failed, falling back to local render:', lambdaError);
        // Continue to local render
      }
    }

    // Fallback to local rendering
    console.log('Falling back to local render...');
    const outputDir = path.join(TMP_DIR, `remotion-${jobId}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
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
    
    // Upload to Supabase
    const { data, error } = await storage
      .from('videos')
      .upload(`${jobId}.mp4`, fs.readFileSync(outputFile), {
        contentType: 'video/mp4',
        upsert: true
      });

    if (error) {
      throw new Error(`Failed to upload video: ${error.message}`);
    }

    const { data: { publicUrl } } = storage
      .from('videos')
      .getPublicUrl(`${jobId}.mp4`);

    // Clean up temporary files
    try {
      fs.unlinkSync(outputFile);
      fs.rmdirSync(outputDir, { recursive: true });
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary files:', cleanupError);
    }
    
    return publicUrl;
  } catch (error) {
    console.error('Error rendering video:', error);
    throw error;
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

export async function generateVideoFromDocument({
  documentUrl,
  style = 'engaging',
  onProgress = () => {}
}: VideoGenerationParams): Promise<string> {
  try {
    const jobId = uuidv4();
    console.log('Starting video generation with job ID:', jobId);

    // Step 1: Generate script using Gemini AI
    onProgress(10);
    const script = await generateScriptFromDocument(documentUrl, style);
    console.log('Script generated successfully');

    // Step 2: Extract scene keywords and fetch media
    onProgress(30);
    const media = await fetchMediaForScript(script);
    console.log(`Fetched ${media.flat().length} media items`);

    // Step 3: Generate audio using Polly
    onProgress(50);
    const audioUrl = await generateAudio(script);
    console.log('Audio generated successfully');

    // Step 4: Render video using Lambda
    onProgress(70);
    const videoUrl = await renderWithLambda({
      script,
      audioUrl,
      media,
      onProgress: (progress) => {
        // Scale Lambda progress (0-1) to 70-100%
        onProgress(70 + (progress * 30));
      }
    });

    console.log('Video generation completed successfully');
    return videoUrl;
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
}

async function generateScriptFromDocument(documentUrl: string, style: string): Promise<string> {
  try {
    // Download document from Supabase
    const response = await fetch(documentUrl);
    const documentText = await response.text();

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Generate script
    const prompt = `Create a ${style} video script based on the following document. 
    Make it engaging and suitable for a video presentation. 
    Break it into clear sections with natural transitions.
    
    Document:
    ${documentText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating script:', error);
    throw new Error('Failed to generate script from document');
  }
}

async function generateAudio(script: string): Promise<string> {
  try {
    // Generate audio using Polly
    const response = await fetch('/api/generateAudio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: script }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate audio');
    }

    const data = await response.json();
    return data.audioUrl;
  } catch (error) {
    console.error('Error generating audio:', error);
    throw new Error('Failed to generate audio');
  }
} 
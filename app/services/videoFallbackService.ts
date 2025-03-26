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
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Define paths for temporary files - use /tmp for serverless
const TMP_DIR = process.env.NODE_ENV === 'production' 
  ? '/tmp' 
  : os.tmpdir();

// Flag for checking if we're in a serverless environment
const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.NETLIFY === '1';

// Flag to check if we're in a Docker environment (which means we have system FFmpeg)
const HAS_SYSTEM_FFMPEG = process.env.NODE_ENV === 'production' && !IS_SERVERLESS;

// Check if system FFmpeg is available
async function isSystemFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    console.log('System FFmpeg is available');
    return true;
  } catch (error) {
    console.log('System FFmpeg is not available:', error);
    return false;
  }
}

// Define proper types for the module
interface VideoRenderParams {
  script: string;
  jobId: string;
  voiceId?: string;
  onProgress?: (progress: number) => void;
}

// Define upload parameters type
interface UploadParams {
  filePath: string;
  jobId: string;
  fileExtension: string;
  contentType: string;
  isAudioOnly: boolean;
  bucketName: string;
}

// Define result from exec to avoid any types
interface ExecResult {
  stdout: string;
  stderr: string;
}

// Type for RemotionBundler
type RemotionBundlerType = {
  bundle: (options: {
    entryPoint: string;
    webpackOverride?: (config: any) => any;
  }) => Promise<string>;
};

// Type for RemotionRenderer
type RemotionRendererType = {
  renderMedia: (options: {
    composition: { 
      id: string; 
      defaultProps?: any; 
      width: number; 
      height: number; 
      fps: number; 
      durationInFrames: number;
    };
    serveUrl: string;
    codec?: string;
    outputLocation: string;
    imageFormat?: string;
    onProgress?: (progress: any) => void;
    durationInFrames?: number;
    fps?: number;
    chromiumOptions?: any;
    pixelFormat?: string;
    props?: Record<string, unknown>;
  }) => Promise<void>;
  selectComposition: (options: {
    serveUrl: string;
    id: string;
    inputProps: Record<string, unknown>;
  }) => Promise<{
    id: string;
    defaultProps?: any;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
  }>;
};

// Initialize FFmpeg instance
let ffmpegInstance: FFmpeg | null = null;

/**
 * Creates and loads an FFmpeg instance with proper configuration
 */
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  try {
    ffmpegInstance = new FFmpeg();
    
    // Load FFmpeg core and codecs
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    console.log('FFmpeg WASM loaded successfully');
    return ffmpegInstance;
  } catch (error) {
    console.error('Error loading FFmpeg:', error);
    throw new Error('Failed to load FFmpeg WASM');
  }
}

/**
 * A fallback video rendering service that creates a video using
 * enhanced visual elements, animations and the LockIn branding
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
    onProgress(5);
    
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
    
    // Generate audio from script using AWS Polly
    console.log('Generating speech from text using AWS Polly...');
    try {
      const audioPath = await convertScriptToSpeech(script, jobId, voiceId);
      // Copy the audio file to the expected location if needed
      if (audioPath !== audioFile && fs.existsSync(audioPath)) {
        fs.copyFileSync(audioPath, audioFile);
      }
      
      await updateJobProgress(jobId, 30);
      onProgress(30);
      
      console.log('Audio generation completed');
    } catch (audioError) {
      console.error('Error generating audio:', audioError);
      throw new Error(`Failed to generate audio: ${audioError instanceof Error ? audioError.message : String(audioError)}`);
    }
    
    // Always attempt to create a video
    let isAudioOnly = false;
    
    console.log('Creating enhanced video with animations...');
    try {
      // First try to use the Remotion renderer
      console.log('Attempting to render with Remotion...');
      await updateJobProgress(jobId, 40);
      onProgress(40);
      
      const useRemotionRenderer = await tryRemotionRender(outputFile, script, audioFile);
      
      if (!useRemotionRenderer) {
        // Fallback to simple slideshow if Remotion fails
        console.log('Remotion rendering failed, falling back to slideshow generation...');
        await updateJobProgress(jobId, 50);
        onProgress(50);
        
        // For serverless environments, we'll use a simpler approach
        // that doesn't require FFmpeg installation
        console.log('Generating slides for fallback video...');
        
        try {
          // In serverless, we won't attempt to create a video - just use audio
          if (IS_SERVERLESS) {
            console.log('Running in serverless environment, falling back to audio-only mode');
            isAudioOnly = true;
          } else {
            // Only try to create a video in non-serverless environments
            await createSimpleSlideshowFromScript(outputFile, script, audioFile);
          }
        } catch (slideshowError) {
          console.error('Error creating simple slideshow:', slideshowError);
          isAudioOnly = true;
        }
        
        // Update progress after slideshow creation attempt
        await updateJobProgress(jobId, 60);
        onProgress(60);
      }
      
      // After either method, verify the video file exists and has sufficient size
      if (fs.existsSync(outputFile)) {
        const videoStats = fs.statSync(outputFile);
        console.log(`Video file exists with size: ${videoStats.size} bytes`);
        
        if (videoStats.size < 10000) { // Less than 10KB is suspicious for a video
          console.log('Video file is too small, may be corrupted. Using audio-only mode.');
          isAudioOnly = true;
        } else {
          isAudioOnly = false;
        }
      } else {
        console.log('Video file was not created, falling back to audio only.');
        isAudioOnly = true;
      }
      
      await updateJobProgress(jobId, 70);
      onProgress(70);
    } catch (videoError) {
      console.error('Error creating video:', videoError);
      console.log('Falling back to audio-only mode');
      isAudioOnly = true;
      await updateJobProgress(jobId, 70);
      onProgress(70);
    }
    
    // If we're in audio-only mode, use the audio file instead
    const fileToUpload = isAudioOnly ? audioFile : outputFile;
    const contentType = isAudioOnly ? 'audio/mpeg' : 'video/mp4';
    const fileExtension = isAudioOnly ? '.mp3' : '.mp4';
    const bucketName = isAudioOnly ? 'audios' : 'videos'; // Use the correct bucket
    
    // Update progress
    await updateJobProgress(jobId, 80);
    onProgress(80);
    
    // Upload the rendered file to Supabase Storage
    console.log(`Uploading ${isAudioOnly ? 'audio' : 'video'} to storage in ${bucketName} bucket...`);
    let mediaUrl: string;
    try {
      // Use the correct bucket name and file extension
      mediaUrl = await uploadToSupabase(fileToUpload, jobId, fileExtension, contentType, isAudioOnly, bucketName);
      
      // Verify the URL is valid
      if (!mediaUrl || !mediaUrl.startsWith('http')) {
        throw new Error(`Invalid media URL returned: ${mediaUrl}`);
      }
      
      console.log(`Media URL: ${mediaUrl}`);
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
      console.log('Cleaned up temporary files');
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
 * Try to render the video using Remotion
 */
async function tryRemotionRender(outputPath: string, script: string, audioPath: string): Promise<boolean> {
  try {
    console.log('Attempting to render video using Remotion...');
    
    // Try to dynamically import Remotion packages
    let RemotionBundler: RemotionBundlerType | null = null;
    let RemotionRenderer: RemotionRendererType | null = null;
    
    try {
      // Using dynamic import with catch to handle missing packages
      const bundlerModule = await import('@remotion/bundler').catch(err => {
        console.log('Could not import @remotion/bundler:', err.message);
        return null;
      });
      
      const rendererModule = await import('@remotion/renderer').catch(err => {
        console.log('Could not import @remotion/renderer:', err.message);
        return null;
      });
      
      RemotionBundler = bundlerModule as RemotionBundlerType;
      RemotionRenderer = rendererModule as RemotionRendererType;
    } catch (importError) {
      console.log('Could not import Remotion packages. This is expected in some environments.', importError);
      return false;
    }

    if (!RemotionBundler || !RemotionRenderer) {
      console.log('Could not import Remotion packages. Falling back to basic video creation.');
      return false;
    }
    
    const { bundle } = RemotionBundler;
    const { renderMedia, selectComposition } = RemotionRenderer;
    
    // Get the absolute path to the Remotion entry point
    const entryPoint = path.join(process.cwd(), 'app/remotion/index.tsx');
    
    if (!fs.existsSync(entryPoint)) {
      console.error(`Remotion entry point not found at: ${entryPoint}`);
      return false;
    }
    
    // Verify we have the audio file
    if (!fs.existsSync(audioPath)) {
      console.error(`Audio file not found at: ${audioPath}`);
      return false;
    }
    
    // Create a simplified temporary copy of the audio file with a predictable name
    const tmpDir = path.dirname(outputPath);
    const tmpAudioPath = path.join(tmpDir, `audio-${path.basename(audioPath)}`);
    fs.copyFileSync(audioPath, tmpAudioPath);
    
    // Bundle the Remotion project
    console.log(`Bundling Remotion project from: ${entryPoint}`);
    const bundleLocation = await bundle({
      entryPoint,
      webpackOverride: (config) => {
        return {
          ...config,
          resolve: {
            ...config.resolve,
            fallback: {
              ...config.resolve?.fallback,
              fs: false,
              path: false,
              os: false,
            },
          },
        };
      },
    });
    
    // Parse script into paragraphs to calculate duration
    const paragraphs = script.split('\n\n').filter(p => p.trim().length > 0);
    const numSlides = Math.max(1, paragraphs.length);
    
    // Use our constants from the VideoLecture component
    const logoFrames = 90; // 3 seconds
    const titleFrames = 120; // 4 seconds
    const slideFrames = numSlides * 300; // 10 seconds per slide
    const endLogoFrames = 60; // 2 seconds
    const totalFrames = logoFrames + titleFrames + slideFrames + endLogoFrames;
    
    // Ensure reasonable duration (between 10s and 3min)
    const fps = 30;
    const durationInFrames = Math.max(300, Math.min(5400, totalFrames));
    
    console.log(`Rendering video with ${durationInFrames} frames at ${fps} fps for ${numSlides} slides...`);
    
    // Select the composition to render
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'VideoLecture',
      inputProps: {
        script,
        audioUrl: tmpAudioPath,
      },
    });
    
    // Render the video with serverless-compatible settings
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      props: {
        script,
        audioUrl: tmpAudioPath,
      },
      durationInFrames,
      fps,
      imageFormat: 'jpeg',
      chromiumOptions: {
        disableWebSecurity: true,
        headless: true,
        args: [
          '--disable-web-security',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ],
      },
      pixelFormat: 'yuv420p',
    });
    
    // Clean up the temporary audio file
    try {
      if (fs.existsSync(tmpAudioPath)) {
        fs.unlinkSync(tmpAudioPath);
      }
    } catch (cleanupErr) {
      console.warn('Failed to clean up temporary audio file:', cleanupErr);
    }
    
    // Check if the file was created
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`Remotion successfully rendered video to: ${outputPath} (${stats.size} bytes)`);
      if (stats.size < 10000) {
        console.error('Remotion output file is too small, may be corrupted.');
        return false;
      }
      return true;
    } else {
      console.error('Remotion did not produce an output file');
      return false;
    }
  } catch (error) {
    console.error('Error rendering with Remotion:', error);
    return false;
  }
}

/**
 * A simple approach that doesn't use FFmpeg
 * This won't work in serverless, but we'll attempt it in non-serverless environments
 */
async function createSimpleSlideshowFromScript(outputPath: string, script: string, audioPath: string): Promise<void> {
  if (await isSystemFFmpegAvailable()) {
    try {
      console.log('Using system FFmpeg to create slideshow');
      // Create a simple colored background with text
      const tmpDir = path.dirname(outputPath);
      const slidePath = path.join(tmpDir, 'slide.png');
      
      // Use FFmpeg to create a blue background
      await execAsync(`ffmpeg -f lavfi -i color=c=blue:s=1280x720 -frames:v 1 ${slidePath}`);
      
      // Use FFmpeg to create video from image and audio
      await execAsync(`ffmpeg -loop 1 -i ${slidePath} -i ${audioPath} -c:v libx264 -c:a aac -b:a 192k -shortest -pix_fmt yuv420p ${outputPath}`);
      
      console.log('Slideshow created successfully with system FFmpeg');
      return;
    } catch (error) {
      console.error('Error using system FFmpeg:', error);
      throw new Error(`System FFmpeg error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // If we get here, we don't have system FFmpeg
  throw new Error('Not implemented in serverless environments without Docker');
}

/**
 * Uploads a file to Supabase Storage
 */
async function uploadToSupabase(
  filePath: string, 
  jobId: string, 
  fileExtension: string,
  contentType: string,
  isAudioOnly: boolean,
  bucketName: string
): Promise<string> {
  console.log(`Uploading to Supabase: ${filePath} to bucket ${bucketName}`);
  
  try {
    // Read the file data
    const data = fs.readFileSync(filePath);
    const uniqueFileName = `${jobId}${fileExtension}`;
    
    // Upload to the specified bucket
    const { data: fileData, error } = await storage
      .from(bucketName)
      .upload(uniqueFileName, data, {
        contentType,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
        upsert: true
      });
    
    if (error) {
      console.error(`Error uploading to bucket '${bucketName}':`, error);
      throw new Error(`Supabase storage upload error: ${error.message}`);
    }
    
    if (!fileData?.path) {
      throw new Error(`No file path returned from Supabase upload to bucket '${bucketName}'`);
    }
    
    console.log(`Successfully uploaded to Supabase at: ${fileData.path}`);
    
    // Create a public URL for the file
    const { data: publicURL } = storage
      .from(bucketName)
      .getPublicUrl(uniqueFileName);
    
    if (!publicURL?.publicUrl) {
      throw new Error(`Couldn't get public URL for file in '${bucketName}'`);
    }
    
    console.log(`Public URL generated: ${publicURL.publicUrl}`);
    return publicURL.publicUrl;
  } catch (err) {
    console.error('Error in uploadToSupabase:', err);
    throw err;
  }
}

// Add this function to handle audio file combination with system FFmpeg
export async function combineAudioFilesWithSystemFFmpeg(
  audioChunkPaths: string[], 
  outputPath: string
): Promise<void> {
  if (await isSystemFFmpegAvailable()) {
    try {
      console.log('Using system FFmpeg to combine audio files');
      
      // Create a text file listing all input files
      const tmpDir = path.dirname(outputPath);
      const inputListPath = path.join(tmpDir, 'audio_files.txt');
      
      const fileList = audioChunkPaths
        .map(filePath => `file '${filePath.replace(/'/g, "\\'")}'`)
        .join('\n');
      
      fs.writeFileSync(inputListPath, fileList);
      
      // Use FFmpeg to concatenate the files
      await execAsync(`ffmpeg -f concat -safe 0 -i ${inputListPath} -c copy ${outputPath}`);
      
      console.log('Audio files combined successfully with system FFmpeg');
      return;
    } catch (error) {
      console.error('Error combining audio files with system FFmpeg:', error);
      throw new Error(`Failed to combine audio files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  throw new Error('FFmpeg is not available for audio file combination');
}
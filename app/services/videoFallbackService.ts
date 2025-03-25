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
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import ffprobe from '@ffmpeg-installer/ffprobe';

// No direct import of Remotion packages at the top level
// These will be dynamically imported in the tryRemotionRender function

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Define paths for temporary files - use /tmp for Vercel
const TMP_DIR = process.env.NODE_ENV === 'production' 
  ? '/tmp' 
  : os.tmpdir();

// Flag for checking if we're in a serverless environment
const IS_SERVERLESS = process.env.VERCEL === '1';

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
    
    // In a serverless environment, we might not have FFmpeg available
    // But we'll still try to create a video using Remotion
    let isAudioOnly = false;
    
    // ALWAYS attempt to create a video file, even if FFmpeg isn't available
    // We'll use our Remotion renderer which doesn't require FFmpeg
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
        
        // Creating slides phase
        console.log('Generating slides for fallback video...');
        await createEnhancedSlideshowFromScript(outputFile, script, audioFile);
        
        // Update progress after slideshow creation
        await updateJobProgress(jobId, 60);
        onProgress(60);
      }
      
      // After either method, verify the video file exists and has sufficient size
      if (fs.existsSync(outputFile)) {
        const videoStats = fs.statSync(outputFile);
        console.log(`Video file exists with size: ${videoStats.size} bytes`);
        
        if (videoStats.size < 10000) { // Less than 10KB is suspicious for a video
          console.log('Video file is too small, may be corrupted. Creating a new one.');
          await createEnhancedSlideshowFromScript(outputFile, script, audioFile);
        }
      } else {
        console.log('Video file was not created, creating a new one.');
        await createEnhancedSlideshowFromScript(outputFile, script, audioFile);
      }
      
      // Final check - if all video generation methods failed, we'll fall back to audio only
      if (!fs.existsSync(outputFile) || fs.statSync(outputFile).size < 10000) {
        console.log('All video generation methods failed, falling back to audio only.');
        isAudioOnly = true;
      } else {
        console.log('Successfully created video file with size:', fs.statSync(outputFile).size, 'bytes');
        isAudioOnly = false;
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
 * Creates an enhanced slideshow video from script with visual elements
 */
async function createEnhancedSlideshowFromScript(outputPath: string, script: string, audioPath: string): Promise<void> {
  // Create a temporary directory for the slides
  const tmpDir = path.dirname(outputPath);
  const slidesDir = path.join(tmpDir, 'slides');
  
  if (!fs.existsSync(slidesDir)) {
    fs.mkdirSync(slidesDir, { recursive: true });
  }
  
  try {
    console.log('Starting enhanced slideshow creation...');
    
    // Create a title screen
    const title = script.split('\n')[0].replace(/^#+\s*/, '');
    const titlePath = path.join(slidesDir, 'title.png');
    await createTitleImage(titlePath, title);
    
    // Split script into logical chunks
    const paragraphs = script
      .split('\n\n')
      .filter(p => p.trim().length > 0);
    
    // Create images for each paragraph
    const slideImages = [titlePath];
    
    // Create each slide - reporting progress as we go
    const totalSlides = paragraphs.length;
    console.log(`Creating ${totalSlides} slides...`);
    
    for (let i = 0; i < paragraphs.length; i++) {
      const slidePath = path.join(slidesDir, `slide-${i + 1}.png`);
      await createSlideImage(slidePath, paragraphs[i], i + 1);
      slideImages.push(slidePath);
    }
    
    // Use FFmpeg to create a slideshow video with the audio
    console.log('Creating improved slideshow video with FFmpeg...');
    
    // Check if audio file exists and has content
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file does not exist at path: ${audioPath}`);
    }
    
    // Get audio duration using ffprobe
    const { stdout: durationOutput } = await execAsync(`"${ffprobe.path}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`);
    const audioDuration = parseFloat(durationOutput);
    console.log(`Audio duration: ${audioDuration} seconds`);
    
    if (isNaN(audioDuration) || audioDuration <= 0) {
      throw new Error('Invalid audio duration detected. Cannot create video.');
    }
    
    // Create a file with the list of images and their durations
    const imageListPath = path.join(tmpDir, 'images.txt');
    
    // Calculate slide duration - ensure it's reasonable based on audio length
    const slideCount = slideImages.length;
    const slideDuration = Math.max(3, Math.min(10, audioDuration / slideCount));
    
    console.log(`Using ${slideDuration.toFixed(2)} seconds per slide for ${slideCount} slides`);
    
    // Create the image list with proper durations
    const imageListContent = slideImages
      .map((img, index) => {
        // Last slide needs special handling
        if (index === slideImages.length - 1) {
          return `file '${img.replace(/'/g, "'\\''")}'\nduration ${slideDuration}`;
        }
        return `file '${img.replace(/'/g, "'\\''")}'\nduration ${slideDuration}`;
      })
      .join('\n');
    
    fs.writeFileSync(imageListPath, imageListContent);
    console.log('Created image list file for FFmpeg');
    
    // Create a more robust FFmpeg command with explicit audio mapping
    const ffmpegCmd = `"${ffmpeg.path}" -f concat -safe 0 -i "${imageListPath}" -i "${audioPath}" -map 0:v -map 1:a -vf "fps=24,format=yuv420p" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest -pix_fmt yuv420p -t ${audioDuration} "${outputPath}"`;
    
    console.log(`Executing FFmpeg command: ${ffmpegCmd}`);
    const { stdout, stderr } = await execAsync(ffmpegCmd);
    
    if (stderr) {
      console.log('FFmpeg stderr output:', stderr);
    }
    
    // Verify the output file
    if (!fs.existsSync(outputPath)) {
      throw new Error('FFmpeg did not produce an output file');
    }
    
    const fileStats = fs.statSync(outputPath);
    console.log(`Video file created: ${outputPath} (${fileStats.size} bytes)`);
    
    if (fileStats.size < 10000) { // Less than 10KB is suspicious
      throw new Error(`Output file is too small (${fileStats.size} bytes) and may be corrupted`);
    }
    
    console.log(`Successfully created enhanced slideshow video at: ${outputPath} (${fileStats.size} bytes)`);
    
    // Clean up the temporary files
    try {
      slideImages.forEach(img => {
        if (fs.existsSync(img)) {
          fs.unlinkSync(img);
        }
      });
      
      if (fs.existsSync(imageListPath)) {
        fs.unlinkSync(imageListPath);
      }
      
      if (fs.existsSync(slidesDir)) {
        fs.rmdirSync(slidesDir, { recursive: true });
      }
      console.log('Cleaned up temporary files');
    } catch (cleanupError) {
      console.warn('Warning: Failed to clean up some temporary files:', cleanupError);
    }
    
  } catch (error) {
    console.error('Error creating enhanced slideshow:', error);
    throw error;
  }
}

/**
 * Creates a title image with nice visual design
 */
async function createTitleImage(outputPath: string, title: string): Promise<void> {
  try {
    // More thorough sanitization for ffmpeg
    const sanitizedTitle = title
      .replace(/['"\\*:]/g, '')  // Remove problematic characters
      .replace(/[^a-zA-Z0-9\s.,?!()-]/g, '')  // Keep only safe characters
      .trim()
      .substr(0, 80); // Limit length to avoid command issues
    
    // Create a visually appealing gradient background
    const bgColor = '#1a2a6c';
    const gradientColor = '#2a4a9c';
    
    // Create a gradient effect with boxes instead of text
    const ffmpegCmd = `"${ffmpeg.path}" -f lavfi -i "color=c=${bgColor}:s=1280x720" -vf "drawbox=x=0:y=0:w=1280:h=720:color=${gradientColor}@0.5:t=fill,drawbox=x=40:y=40:w=1200:h=150:color=${bgColor}@0.7:t=fill,drawbox=x=40:y=250:w=1200:h=100:color=${bgColor}@0.9:t=fill" -frames:v 1 "${outputPath}"`;
    
    console.log('Executing title image command');
    await execAsync(ffmpegCmd);
    
    if (!fs.existsSync(outputPath)) {
      throw new Error('Failed to create title image');
    }
    
    console.log(`Title image created successfully at: ${outputPath}`);
  } catch (error) {
    console.error('Error creating title image:', error);
    
    // Fallback method - Create a simpler image if the first method fails
    try {
      // Create a very simple title image with minimal commands
      const simpleCmd = `"${ffmpeg.path}" -f lavfi -i color=c=blue:s=1280x720 -frames:v 1 "${outputPath}"`;
      await execAsync(simpleCmd);
      
      if (!fs.existsSync(outputPath)) {
        throw new Error('Failed to create even a simple title image');
      }
      
      console.log(`Simple fallback title image created at: ${outputPath}`);
    } catch (fallbackError) {
      console.error('Even fallback title image creation failed:', fallbackError);
      throw error; // Throw the original error
    }
  }
}

/**
 * Creates a slide image for a paragraph of text
 */
async function createSlideImage(outputPath: string, text: string, slideNumber: number): Promise<void> {
  try {
    // More thorough sanitization for text used in ffmpeg command
    const sanitizedText = text
      .substr(0, 150)  // Limit length further to avoid command issues
      .replace(/['"\\*]/g, '')  // Remove problematic characters
      .replace(/[\n\r:]/g, ' ')  // Replace newlines and colons with spaces
      .replace(/[^a-zA-Z0-9\s.,?!()-]/g, '')  // Keep only safe characters
      .trim();
    
    // Use different colors for different slides to add visual interest
    const colorSchemes = [
      { bg: '#1a2a6c', accent: '#2a3a8c' },  // Blue
      { bg: '#2c3e50', accent: '#34495e' },  // Dark blue
      { bg: '#27ae60', accent: '#2ecc71' },  // Green
      { bg: '#c0392b', accent: '#e74c3c' },  // Red
      { bg: '#8e44ad', accent: '#9b59b6' }   // Purple
    ];
    
    // Select a color scheme based on slideNumber
    const scheme = colorSchemes[slideNumber % colorSchemes.length];
    
    // Create a visually interesting slide with visual elements instead of text
    const ffmpegCmd = `"${ffmpeg.path}" -f lavfi -i "color=c=${scheme.bg}:s=1280x720" -vf "drawbox=x=0:y=0:w=1280:h=720:color=${scheme.accent}@0.3:t=fill,drawbox=x=0:y=0:w=1280:h=100:color=${scheme.bg}@0.8:t=fill,drawbox=x=0:y=620:w=1280:h=100:color=${scheme.bg}@0.8:t=fill,drawbox=x=${(slideNumber % 4) * 250 + 100}:y=${200 + (slideNumber % 3) * 100}:w=200:h=200:color=${scheme.accent}@0.6:t=fill" -frames:v 1 "${outputPath}"`;
    
    await execAsync(ffmpegCmd);
    
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Failed to create slide image #${slideNumber}`);
    }
    
    console.log(`Slide image #${slideNumber} created successfully at: ${outputPath}`);
  } catch (error) {
    console.error(`Error creating slide image #${slideNumber}:`, error);
    
    // Fallback method - Create a simpler image if the first method fails
    try {
      // Create a very simple slide image with minimal commands
      const simpleCmd = `"${ffmpeg.path}" -f lavfi -i color=c=blue:s=1280x720 -frames:v 1 "${outputPath}"`;
      await execAsync(simpleCmd);
      
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Failed to create even a simple slide image #${slideNumber}`);
      }
      
      console.log(`Simple fallback slide image #${slideNumber} created at: ${outputPath}`);
    } catch (fallbackError) {
      console.error(`Even fallback slide creation failed for #${slideNumber}:`, fallbackError);
      throw error; // Throw the original error
    }
  }
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
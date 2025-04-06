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
import { fetchMediaForScript, FetchedMedia } from './mediaFetchService';

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
const IS_NETLIFY = process.env.NETLIFY === 'true';

// System FFmpeg detection improved for Docker environments
async function isSystemFFmpegAvailable(): Promise<boolean> {
  try {
    // Check if NETLIFY_FFMPEG_PATH is set in the environment
    const ffmpegEnvPath = process.env.NETLIFY_FFMPEG_PATH;
    if (ffmpegEnvPath) {
      try {
        console.log(`Checking FFmpeg at env path: ${ffmpegEnvPath}`);
        const { stdout } = await execAsync(`${ffmpegEnvPath} -version`);
        console.log(`FFmpeg found at ${ffmpegEnvPath}: ${stdout.split('\n')[0]}`);
        return true;
      } catch (envPathError) {
        console.error(`Error checking FFmpeg at ${ffmpegEnvPath}:`, envPathError);
        // Continue to try system FFmpeg
      }
    }

    // Try the system FFmpeg
    console.log('Checking system FFmpeg...');
    const { stdout } = await execAsync('ffmpeg -version');
    console.log(`System FFmpeg found: ${stdout.split('\n')[0]}`);
    return true;
  } catch (error) {
    console.error('System FFmpeg not available:', error);
    return false;
  }
}

// Determine if we're in a Netlify Docker environment
const isNetlify = process.env.NETLIFY === 'true';
const isDockerEnvironment = isNetlify; // Assuming we're using Docker for Netlify
const isServerlessEnvironment = process.env.VERCEL === '1' || (isNetlify && !isDockerEnvironment);

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
      
      console.log(`Audio generated successfully at ${audioFile}`);
    } catch (audioError: any) {
      console.error('Error generating audio:', audioError);
      await updateJobStatus(jobId, { status: 'failed', error: `Audio generation failed: ${audioError.message}` });
      throw new Error(`Audio generation failed: ${audioError.message}`);
    }
    
    // Fetch media for the script paragraphs
    console.log('Fetching media assets for script...');
    await updateJobProgress(jobId, 35);
    onProgress(35);
    
    let scriptMedia: FetchedMedia[][] = [];
    try {
      // Fetch multiple media items per slide for richer presentations
      scriptMedia = await fetchMediaForScript(script, 2); // Fetch up to 2 media items per slide
      console.log(`Fetched ${scriptMedia.flat().length} media assets for the script`);
      
      // Log more detailed info about media for debugging
      const mediaDetails = scriptMedia.map((slidesMedia, i) => ({
        slideIndex: i,
        hasMedia: slidesMedia && slidesMedia.length > 0,
        mediaCount: slidesMedia ? slidesMedia.length : 0,
        firstMediaUrl: slidesMedia && slidesMedia[0] ? slidesMedia[0].url : 'none',
        mediaSizes: slidesMedia ? slidesMedia.map((m: FetchedMedia) => ({ 
          width: m?.width, 
          height: m?.height,
          aspectRatio: m?.width && m?.height ? (m.width / m.height).toFixed(2) : 'unknown'
        })) : []
      }));
      
      console.log('Media details by slide:', mediaDetails);
      
      // Verify that media items have reasonable sizes for video rendering
      const checkMediaSizes = () => {
        let oversizedMedia = 0;
        
        scriptMedia.forEach((slideMedia, index) => {
          if (!slideMedia) return;
          
          slideMedia.forEach((media: FetchedMedia, mediaIndex: number) => {
            if (!media || !media.width || !media.height) return;
            
            const MAX_DIMENSION = 1200; // Maximum reasonable dimension for video
            
            if (media.width > MAX_DIMENSION || media.height > MAX_DIMENSION) {
              oversizedMedia++;
              
              // Calculate new dimensions preserving aspect ratio
              const aspectRatio = media.width / media.height;
              if (media.width > media.height) {
                media.width = MAX_DIMENSION;
                media.height = Math.round(MAX_DIMENSION / aspectRatio);
              } else {
                media.height = MAX_DIMENSION;
                media.width = Math.round(MAX_DIMENSION * aspectRatio);
              }
              
              console.log(`Resized oversized media on slide ${index}, item ${mediaIndex} to ${media.width}x${media.height}`);
            }
          });
        });
        
        if (oversizedMedia > 0) {
          console.log(`Resized ${oversizedMedia} oversized media items for better performance`);
        }
      };
      
      // Check and resize oversized media
      checkMediaSizes();
      
      await updateJobProgress(jobId, 40);
      onProgress(40);
    } catch (mediaError) {
      console.error('Error fetching media assets:', mediaError);
      // Continue without media - it's not critical, we can still generate the video
      console.log('Continuing with video generation without media assets...');
    }
    
    // Try to use Remotion for rendering first
    console.log('Attempting to render video using Remotion...');
    try {
      const success = await tryRemotionRender(outputFile, script, audioFile, scriptMedia);
      if (success) {
        console.log(`Remotion render successful at ${outputFile}`);
        
        await updateJobProgress(jobId, 90);
        onProgress(90);
        
        // Upload the video to Supabase
        const videoUrl = await uploadToSupabase(
          outputFile, 
          jobId, 
          'mp4', 
          'video/mp4', 
          false, 
          'videos'
        );
        
        await updateJobProgress(jobId, 100);
        onProgress(100);
        
        return videoUrl;
      }
    } catch (remotionError) {
      console.error('Remotion render failed:', remotionError);
    }
    
    // Always attempt to create a video
    let isAudioOnly = false;
    
    console.log('Creating enhanced video with animations...');
    try {
      // First try to use the Remotion renderer
      console.log('Attempting to render with Remotion...');
      await updateJobProgress(jobId, 50);
      onProgress(50);
      
      const useRemotionRenderer = await tryRemotionRender(outputFile, script, audioFile, scriptMedia);
      
      if (!useRemotionRenderer) {
        // Fallback to simple slideshow if Remotion fails
        console.log('Remotion rendering failed, falling back to slideshow generation...');
        await updateJobProgress(jobId, 60);
        onProgress(60);
        
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
        await updateJobProgress(jobId, 70);
        onProgress(70);
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
      
      await updateJobProgress(jobId, 80);
      onProgress(80);
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
async function tryRemotionRender(
  outputPath: string, 
  script: string, 
  audioPath: string | undefined,
  media?: FetchedMedia[][]
): Promise<boolean> {
  try {
    console.log('Attempting to render video using Remotion...');
    
    // Helper function to safely get basename
    const safeBasename = (filePath: string | undefined): string => {
      return filePath ? path.basename(filePath) : 'unknown.mp3';
    };
    
    // Import required modules dynamically
    let bundleImport;
    let renderImport;
    try {
      bundleImport = await import('@remotion/bundler');
      renderImport = await import('@remotion/renderer');
    } catch (error) {
      console.error('Error importing Remotion modules:', error);
      return false;
    }
    
    const bundle = bundleImport.bundle;
    const renderMedia = renderImport.renderMedia;
    const selectComposition = renderImport.selectComposition;
    
    // Create temp dir for temporary files
    const tmpDir = fs.mkdirSync(path.join(os.tmpdir(), `remotion-${Date.now()}`), { recursive: true });
    
    // Set the entry point to the root.tsx file that contains registerRoot
    // This is the key fix for the Remotion error
    const entryPoint = path.join(process.cwd(), 'app', 'remotion', 'root.tsx');
    
    // If the file doesn't exist, create it by copying the existing index.tsx
    if (!fs.existsSync(entryPoint)) {
      console.log('Remotion root file not found, creating one...');
      try {
        // Check if index.tsx exists
        const indexPath = path.join(process.cwd(), 'app', 'remotion', 'index.tsx');
        if (fs.existsSync(indexPath)) {
          // Create a simple root file that imports from index.tsx
          const rootContent = `
            import { registerRoot } from 'remotion';
            import { VideoLecture } from './VideoLecture';
            import { Composition } from 'remotion';
            
            const Root = () => {
              return (
                <Composition
                  id="VideoLecture"
                  component={VideoLecture}
                  width={1920}
                  height={1080}
                  fps={60}
                  durationInFrames={600}
                  defaultProps={{
                    script: "Default script content",
                    audioUrl: ""
                  }}
                />
              );
            };
            
            registerRoot(Root);
          `;
          fs.writeFileSync(entryPoint, rootContent);
          console.log('Created Remotion root file');
        } else {
          console.error('Remotion index.tsx file not found');
          return false;
        }
      } catch (createError) {
        console.error('Error creating Remotion root file:', createError);
        return false;
      }
    }
    
    // Check for a custom intro video in the public folder
    let introVideoDataUrl = "";
    const publicIntroPath = path.join(process.cwd(), 'public', 'intro.mp4');
    const hasCustomIntro = fs.existsSync(publicIntroPath);
    
    if (hasCustomIntro) {
      console.log(`Found custom intro video at ${publicIntroPath}`);
      try {
        // Convert intro video to base64 data URL
        const videoBuffer = fs.readFileSync(publicIntroPath);
        const videoBase64 = videoBuffer.toString('base64');
        introVideoDataUrl = `data:video/mp4;base64,${videoBase64}`;
        console.log('Converted intro video to base64 data URL');
      } catch (videoError) {
        console.error('Error converting intro video to base64:', videoError);
        // Continue without intro video if there's an error
        introVideoDataUrl = "";
      }
    } else {
      console.log(`No custom intro video found at ${publicIntroPath}, using default intro`);
    }
    
    // Copy the audio file to the temp directory if it exists
    let audioDataUrl = "";
    if (audioPath && typeof audioPath === 'string') {
      try {
        if (fs.existsSync(audioPath)) {
          // Read the audio file directly
          const audioBuffer = fs.readFileSync(audioPath);
          audioDataUrl = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
          console.log('Converted audio to base64 data URL');
        } else {
          console.warn(`Audio file not found at ${audioPath}, continuing without audio`);
        }
      } catch (audioError) {
        console.error('Error processing audio file:', audioError);
      }
    } else {
      console.warn('No audio path provided, continuing without audio');
    }
    
    // Bundle the Remotion project with extra options
    console.log(`Bundling Remotion project from: ${entryPoint}`);
    const bundleOptions = {
      entryPoint,
      // Use a type assertion to handle the TypeScript error
      webpackOverride: (config: any) => {
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
    };
    
    // Add ignoreRegisterRootWarning property using type assertion
    const bundleOptionsWithIgnore = {
      ...bundleOptions,
      ignoreRegisterRootWarning: true,
    } as any;
    
    const bundleLocation = await bundle(bundleOptionsWithIgnore);
    
    // Parse script into paragraphs to calculate duration
    const paragraphs = script.split('\n\n').filter(p => p.trim().length > 0);
    const numSlides = Math.max(1, paragraphs.length);
    
    // Use our constants from the VideoLecture component
    // Note: These values reflect 30fps
    const logoFrames = 90; // 3 seconds at 30fps
    const customIntroFrames = 390; // 13 seconds at 30fps
    const titleFrames = 120; // 4 seconds at 30fps
    const slideFrames = numSlides * 300; // 10 seconds per slide at 30fps
    const endLogoFrames = 90; // 3 seconds at 30fps
    
    // Calculate total frames based on intro type
    const introFrames = hasCustomIntro ? customIntroFrames : logoFrames;
    const totalFrames = introFrames + titleFrames + slideFrames + endLogoFrames;
    
    // Ensure reasonable duration (between 10s and 5min)
    const fps = 30;
    const durationInFrames = Math.max(300, Math.min(9000, totalFrames));
    
    console.log(`Rendering video with ${durationInFrames} frames at ${fps} fps for ${numSlides} slides...`);
    console.log(`Video timing: intro=${introFrames/fps}s, title=${titleFrames/fps}s, content=${slideFrames/fps}s, outro=${endLogoFrames/fps}s`);
    console.log(`Video will start main audio at: ${(introFrames + titleFrames)/fps}s`);
    
    // Select the composition to render
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'VideoLecture',
      inputProps: {
        script,
        audioUrl: audioDataUrl, // Use the data URL instead of file path
        media,
        customIntroPath: introVideoDataUrl // Pass the intro video as data URL instead of file path
      },
    });
    
    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Render the video with additional properties
    console.log(`Rendering video to ${outputPath} at ${fps}fps (1280x720)...`);
    
    // Create render options with proper type assertions for durationInFrames and fps
    const renderOptions = {
      composition: {
        ...composition,
        width: 1280,
        height: 720,
        fps: 30, // Changed from 60fps to 30fps for faster rendering
        durationInFrames
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      imageFormat: 'jpeg',
      pixelFormat: 'yuv420p',
      // Enhanced video quality settings - use only CRF, not both CRF and videoBitrate
      crf: 22,
      // videoBitrate: '8M',
      audioBitrate: '320k',
    } as any; // Use type assertion to avoid TypeScript errors
    
    await renderMedia(renderOptions);
    
    console.log('Remotion video rendering completed successfully');
    return true;
  } catch (error) {
    console.error('Error rendering with Remotion:', error);
    return false;
  }
}

// Enhancement for createSimpleSlideshowFromScript with improved Docker support
async function createSimpleSlideshowFromScript(outputPath: string, script: string, audioPath: string): Promise<void> {
  try {
    // Check for system FFmpeg first
    const hasSystemFFmpeg = await isSystemFFmpegAvailable();
    
    if (hasSystemFFmpeg) {
      console.log('Using system FFmpeg to create slideshow');
      
      // Get FFmpeg path - use NETLIFY_FFMPEG_PATH if available, otherwise just 'ffmpeg'
      const ffmpegPath = process.env.NETLIFY_FFMPEG_PATH || 'ffmpeg';

      // Create a temporary image with blue background and text
      const tempImgPath = path.join(os.tmpdir(), `slide-${Date.now()}.png`);
      
      // Use the -frames:v 1 and -update flags to create a single image
      // Also make sure we're using the correct font path from environment variable
      const fontPath = process.env.FFMPEG_FONT_PATH || process.env.FONT_PATH || (process.platform === 'win32' 
        ? 'C:/Windows/Fonts/arial.ttf' 
        : '/usr/share/fonts/dejavu/DejaVuSans.ttf');
      console.log(`Using font path: ${fontPath}`);
      
      // Generate a blue background with text using FFmpeg with the correct arguments
      // Simplify the text and properly escape special characters
      const safeText = "LockIn AI Video"; // Use a simple, safe text to avoid escaping issues
      
      // Windows has issues with quotes in commands, so use a simpler command format
      // The key is to ensure the output file is correctly specified
      const escapedTempImgPath = process.platform === 'win32' 
        ? tempImgPath.replace(/\\/g, '/') 
        : tempImgPath;
      
      const createImageCmd = `${ffmpegPath} -f lavfi -i color=c=blue:s=1920x1080:d=1 -vf "drawtext=fontfile=${fontPath}:text=${safeText}:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2" -y "${escapedTempImgPath}"`;
      
      console.log('Creating background image with text...');
      console.log(`Executing command: ${createImageCmd}`);
      await execAsync(createImageCmd);
      
      // Make sure the file was created
      if (!fs.existsSync(tempImgPath)) {
        console.error(`Image was not created at ${tempImgPath}`);
        throw new Error(`Failed to create image at ${tempImgPath}`);
      } else {
        console.log(`Successfully created image at ${tempImgPath} (${fs.statSync(tempImgPath).size} bytes)`);
      }
      
      // Combine image and audio to create video
      console.log('Combining image and audio to create video...');
      const escapedOutputPath = process.platform === 'win32' 
        ? outputPath.replace(/\\/g, '/') 
        : outputPath;
      const escapedAudioPath = process.platform === 'win32' 
        ? audioPath.replace(/\\/g, '/') 
        : audioPath;
      
      const createVideoCmd = `${ffmpegPath} -loop 1 -i "${escapedTempImgPath}" -i "${escapedAudioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -y "${escapedOutputPath}"`;
      console.log(`Executing command: ${createVideoCmd}`);
      await execAsync(createVideoCmd);
      
      // Clean up temporary files
      if (fs.existsSync(tempImgPath)) {
        fs.unlinkSync(tempImgPath);
      }
      
      console.log(`Video slideshow created successfully at ${outputPath}`);
    } else {
      throw new Error('FFmpeg not available for video creation');
    }
  } catch (error) {
    console.error('Error creating slideshow:', error);
    throw new Error(`Failed to create video slideshow: ${error instanceof Error ? error.message : String(error)}`);
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
  try {
    console.log(`Uploading to Supabase: ${filePath} to bucket ${bucketName}`);
    
    // Read the file data
    const fileData = fs.readFileSync(filePath);
    
    // Ensure proper file extension with dot
    const fileName = `${jobId}.${fileExtension.replace(/^\./, '')}`;
    
    // Upload to the specified bucket
    const { data, error } = await storage
      .from(bucketName)
      .upload(fileName, fileData, {
        contentType,
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error(`Error uploading to Supabase: ${error.message}`);
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }
    
    console.log(`Successfully uploaded to Supabase at: ${fileName}`);
    
    // Generate a URL for the file
    const { data: { publicUrl } } = storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    console.log(`Public URL generated: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    throw new Error(`Failed to upload to Supabase: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Add this function to handle audio file combination with system FFmpeg
export async function combineAudioFilesWithSystemFFmpeg(
  audioChunkPaths: string[], 
  outputPath: string
): Promise<void> {
  try {
    // Check if system FFmpeg is available
    const systemFFmpegAvailable = await isSystemFFmpegAvailable();
    if (!systemFFmpegAvailable) {
      throw new Error('System FFmpeg is required but not available');
    }
    
    console.log('Using system FFmpeg to combine audio files');
    
    // Get the FFmpeg path - use environment variable if available
    const ffmpegPath = process.env.NETLIFY_FFMPEG_PATH || 'ffmpeg';
    console.log(`Using FFmpeg at: ${ffmpegPath}`);
    
    // Create a temporary file listing all input files
    const fileListPath = path.join(os.tmpdir(), `audio_files_${Date.now()}.txt`);
    
    // Create file content for FFmpeg concat
    const fileListContent = audioChunkPaths.map(
      filePath => `file '${filePath.replace(/'/g, "\\'")}'`
    ).join('\n');
    
    // Write the file list
    fs.writeFileSync(fileListPath, fileListContent);
    console.log(`Created file list at: ${fileListPath}`);
    console.log(`File list contains ${audioChunkPaths.length} files`);
    
    // Build and execute the FFmpeg command
    const command = `${ffmpegPath} -f concat -safe 0 -i "${fileListPath}" -c copy "${outputPath}"`;
    console.log(`Executing FFmpeg command: ${command}`);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.warn('FFmpeg stderr output:', stderr);
    }
    
    if (stdout) {
      console.log('FFmpeg stdout output:', stdout);
    }
    
    // Clean up the temporary file
    if (fs.existsSync(fileListPath)) {
      fs.unlinkSync(fileListPath);
      console.log('Removed temporary file list');
    }
    
    console.log(`Successfully combined ${audioChunkPaths.length} audio files to: ${outputPath}`);
  } catch (error) {
    console.error('Error combining audio files with system FFmpeg:', error);
    throw new Error(`Failed to combine audio files: ${error instanceof Error ? error.message : String(error)}`);
  }
}
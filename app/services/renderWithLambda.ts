"use server";

/**
 * WARNING: This file uses @remotion/lambda from client which may have type conflicts.
 * The interface RenderResult is a local implementation that matches the expected 
 * structure returned by renderMediaOnLambda, but may need updates if the API changes.
 */

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { renderMediaOnLambda, getRenderProgress } from '@remotion/lambda/client';
import { storage } from '../supabase';
import { DEFAULT_VOICE_ID } from './voiceOptions';
import { FetchedMedia } from './mediaFetchService';

const TMP_DIR = os.tmpdir();

// Define AWS region type to match Remotion's expectations
type AWSRegion = 'us-east-1' | 'eu-central-1' | 'eu-central-2' | 'eu-west-1' | 
  'eu-west-2' | 'eu-west-3' | 'eu-south-1' | 'eu-north-1' | 'us-east-2' | 
  'us-west-1' | 'us-west-2' | 'af-south-1' | 'ap-east-1' | 'ap-northeast-1' | 
  'ap-northeast-2' | 'ap-northeast-3' | 'ap-south-1' | 'ap-southeast-1' | 
  'ap-southeast-2' | 'ca-central-1' | 'me-south-1' | 'sa-east-1';

// Define interface for Remotion render result
interface RenderResult {
  renderId: string;
  bucketName: string;
  folderInS3Console?: string;
  cloudWatchLogs?: string;
  progressJsonInConsole?: string;
  outputUrl?: string;
}

interface VideoRenderParams {
  script: string;
  jobId: string;
  voiceId?: string;
  media?: FetchedMedia[][];
  onProgress?: (progress: number) => void;
}

export async function renderVideoWithLambda({
  script,
  jobId,
  voiceId = DEFAULT_VOICE_ID,
  media,
  onProgress = () => {}
}: VideoRenderParams): Promise<string> {
  let outputDir = '';
  let outputFile = '';
  let pollInterval: NodeJS.Timeout | undefined = undefined;
  
  try {
    outputDir = path.join(TMP_DIR, `remotion-${jobId}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    outputFile = path.join(outputDir, `${jobId}.mp4`);
    
    onProgress(10);
    
    // Cast region to the expected type
    const region = (process.env.REMOTION_AWS_REGION || 'us-east-1') as AWSRegion;
    const functionName = process.env.REMOTION_FUNCTION_NAME!;
    const serveUrl = process.env.REMOTION_SERVE_URL!;
    const compositionId = process.env.REMOTION_COMPOSITION_ID || 'VideoLecture';
    const bucketName = process.env.REMOTION_S3_BUCKET!;

    if (!serveUrl || !bucketName || !functionName) {
      throw new Error('Missing required Remotion environment variables.');
    }

    const renderId = uuidv4();
    console.log(`Starting render with ID: ${renderId}`);
    onProgress(30);

    const renderPromise = renderMediaOnLambda({
      region,
      functionName,
      serveUrl,
      composition: compositionId,
      inputProps: { script, voiceId, media },
      codec: 'h264',
      imageFormat: 'jpeg',
      maxRetries: 3,
      privacy: 'public',
      bucketName,
      renderId,
      framesPerLambda: 100,
      concurrencyPerLambda: 2
    });
    
    onProgress(40);
    
    let lastProgress = 0;
    pollInterval = setInterval(async () => {
      try {
        const progress = await getRenderProgress({
          renderId,
          bucketName,
          functionName,
          region
        });
        
        if (progress.fatalErrorEncountered) {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = undefined;
          }
          throw new Error(`Lambda render failed: ${progress.errors?.join(', ')}`);
        }

        const current = progress.overallProgress;
        if (current !== lastProgress) {
          lastProgress = current;
          onProgress(40 + Math.floor(current * 50));
        }
        
        if (progress.done) {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = undefined;
          }
          console.log('Render progress reports completion');
        }
      } catch (err) {
        console.error('Error polling Lambda progress:', err);
      }
    }, 3000);
    
    const result = await renderPromise as RenderResult;
    console.log('Render result:', JSON.stringify(result, null, 2));
    
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = undefined;
    }
    
    onProgress(90);
    
    // The actual renderId might be different from what we generated
    const actualRenderId = result.renderId;
    
    // Build multiple possible download URLs based on common patterns
    const possibleUrls = [
      // Standard pattern with region in URL
      `https://${bucketName}.s3.${region}.amazonaws.com/renders/${actualRenderId}/out.mp4`,
      
      // Standard pattern with us-east-1 explicitly (most common)
      `https://${bucketName}.s3.us-east-1.amazonaws.com/renders/${actualRenderId}/out.mp4`,
      
      // Alternative file names
      `https://${bucketName}.s3.us-east-1.amazonaws.com/renders/${actualRenderId}/${jobId}.mp4`,
      `https://${bucketName}.s3.us-east-1.amazonaws.com/renders/${actualRenderId}/remotion.mp4`,
      `https://${bucketName}.s3.us-east-1.amazonaws.com/renders/${actualRenderId}/video.mp4`,
      
      // Alternative URL formats
      `https://${bucketName}.s3-${region}.amazonaws.com/renders/${actualRenderId}/out.mp4`,
      `https://${bucketName}.s3.amazonaws.com/renders/${actualRenderId}/out.mp4`,
      
      // Try root level with the render ID or job ID
      `https://${bucketName}.s3.amazonaws.com/${actualRenderId}.mp4`,
      `https://${bucketName}.s3.amazonaws.com/${jobId}.mp4`
    ];
    
    // If we have folderInS3Console, we can extract the prefix
    if (result.folderInS3Console) {
      const prefixMatch = result.folderInS3Console.match(/prefix=([^&]+)/);
      if (prefixMatch && prefixMatch[1]) {
        const prefix = decodeURIComponent(prefixMatch[1]);
        console.log(`Extracted S3 prefix: ${prefix}`);
        
        possibleUrls.push(
          `https://${bucketName}.s3.us-east-1.amazonaws.com/${prefix}out.mp4`,
          `https://${bucketName}.s3.us-east-1.amazonaws.com/${prefix}${jobId}.mp4`
        );
      }
    }

    // Add retry logic for downloading
    let downloadAttempts = 0;
    const maxDownloadAttempts = 3;
    let downloadSuccess = false;
    let lastError = null;
    
    // First try each URL with retries
    for (const url of possibleUrls) {
      downloadAttempts = 0;
      
      while (downloadAttempts < maxDownloadAttempts && !downloadSuccess) {
        try {
          console.log(`Attempt ${downloadAttempts + 1}: Downloading from ${url}`);
          await downloadRenderedVideo(url, outputFile);
          downloadSuccess = true;
          console.log(`Successfully downloaded from: ${url}`);
          break;
        } catch (err) {
          downloadAttempts++;
          lastError = err;
          console.log(`Download attempt ${downloadAttempts} failed for ${url}`);
          
          // Only wait if we're going to try again
          if (downloadAttempts < maxDownloadAttempts) {
            console.log(`Retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (downloadSuccess) break;
    }
    
    if (!downloadSuccess) {
      throw new Error(`Failed to download video from any location after multiple attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    }

    const fileBuffer = fs.readFileSync(outputFile);
    const { error: uploadError } = await storage
      .from('videos')
      .upload(`${jobId}.mp4`, fileBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
    
    const { data: urlData } = storage
      .from('videos')
      .getPublicUrl(`${jobId}.mp4`);
      
    if (!urlData?.publicUrl) {
      throw new Error('Could not get public URL from Supabase.');
    }
    
    onProgress(100);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Lambda render error:', error);
    
    // Always ensure we clear the interval
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    
    throw new Error(`Failed to render video: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    // Clean up temp files regardless of success or failure
    try {
      if (outputFile && fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
      }
      if (outputDir && fs.existsSync(outputDir)) {
        fs.rmdirSync(outputDir, { recursive: true });
      }
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary files:', cleanupError);
    }
  }
}

async function downloadRenderedVideo(url: string, outputPath: string): Promise<void> {
  const res = await fetch(url, {
    // Add these headers to potentially help with S3 access
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  
  if (!res.ok) {
    console.error(`Download failed with status: ${res.status} ${res.statusText}`);
    throw new Error(`Download failed: ${res.statusText}`);
  }
  
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  console.log(`Successfully downloaded video to ${outputPath}`);
}
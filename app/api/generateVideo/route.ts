import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
// We'll use dynamic import instead of require
import { createJob, updateJobStatus, completeJob, failJob, updateJobProgress } from '../../services/jobService';
import { FetchedMedia } from '../../services/mediaFetchService';
import { renderVideoWithLambda } from '../../services/renderWithLambda';

// Define interface for expected request body
interface VideoGenerationRequest {
  script: string;
  voiceId?: string;
  media?: FetchedMedia[][];
}

export async function POST(request: Request) {
  let jobId = '';
  
  try {
    const body = await request.json() as VideoGenerationRequest;
    const { script, voiceId, media } = body;
    
    if (!script) {
      return NextResponse.json(
        { error: 'Script is required' },
        { status: 400 }
      );
    }
    
    // Log media if provided
    if (media && Array.isArray(media)) {
      console.log(`Received media data: ${media.length} scenes, ${media.flat().length} total items`);
    } else {
      console.log('No media data provided, using automatic media generation');
    }
    
    // Check AWS credentials are configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials are not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.' },
        { status: 500 }
      );
    }
    
    // Create a new job with a unique ID
    jobId = uuidv4();
    console.log(`Creating new video generation job with ID: ${jobId}`);
    
    // Create the job in our persistent storage with voice ID
    await createJob(jobId, script, voiceId);
    
    // Start processing in the background without awaiting
    // This allows the API to return immediately with the job ID
    processVideoGeneration(jobId, script, voiceId, media).catch(error => {
      console.error(`Error generating video for job ${jobId}:`, error);
      failJob(jobId, error instanceof Error ? error.message : String(error))
        .catch(err => console.error(`Failed to mark job ${jobId} as failed:`, err));
    });
    
    // Return the job ID to the client for status polling
    return NextResponse.json({ 
      jobId,
      message: 'Video generation started' 
    });
  } catch (error) {
    console.error('Error starting video generation:', error);
    
    // If we created a job ID but failed, try to mark the job as failed
    if (jobId) {
      try {
        await failJob(jobId, error instanceof Error ? error.message : String(error));
      } catch (failError) {
        console.error(`Failed to mark job ${jobId} as failed:`, failError);
      }
    }
    
    return NextResponse.json(
      { error: `Failed to start video generation: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

async function processVideoGeneration(
  jobId: string, 
  script: string, 
  voiceId?: string,
  media?: FetchedMedia[][]
): Promise<string> {
  try {
    console.log(`Starting video generation process for job ${jobId}`);
    
    // Update job status to processing
    await updateJobStatus(jobId, {
      status: 'processing',
      progress: 10
    });
    
    // Log media information before rendering
    if (media && Array.isArray(media)) {
      console.log(`Using ${media.length} media scenes for job ${jobId}`);
    }
    
    // Use the Lambda video rendering service
    const videoUrl = await renderVideoWithLambda({
      script,
      jobId,
      voiceId,
      media,
      onProgress: async (progress: number) => {
        // Update job progress
        await updateJobProgress(jobId, progress);
      }
    });
    
    // Complete the job with the video URL
    await completeJob(jobId, videoUrl);
    console.log(`Video generation completed for job ${jobId}`);
    
    return videoUrl;
  } catch (error) {
    console.error(`Error in video generation for job ${jobId}:`, error);
    await failJob(jobId, error instanceof Error ? error.message : String(error));
    throw error;
  }
} 
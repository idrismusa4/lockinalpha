import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
// We'll use dynamic import instead of require
import { createJob, updateJobStatus, completeJob, failJob, updateJobProgress } from '../../services/jobService';

export async function POST(request: Request) {
  let jobId = '';
  
  try {
    const { script, voiceId } = await request.json();
    
    if (!script) {
      return NextResponse.json(
        { error: 'Script is required' },
        { status: 400 }
      );
    }
    
    // Dynamically import the videoFallbackService
    let renderVideoFallback: any = null;
    try {
      const videoModule = await import('../../services/videoFallbackService');
      renderVideoFallback = videoModule.renderVideoFallback;
    } catch (importError) {
      console.error('Failed to import videoFallbackService:', importError);
      return NextResponse.json(
        { error: 'Video generation service is not available in this environment' },
        { status: 500 }
      );
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
    processVideoGeneration(jobId, script, voiceId).catch(error => {
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

async function processVideoGeneration(jobId: string, script: string, voiceId?: string) {
  try {
    console.log(`Starting video generation process for job ${jobId}`);
    
    // Update job status to processing
    await updateJobStatus(jobId, {
      status: 'processing',
      progress: 10
    });
    
    // Dynamically import the videoFallbackService
    let renderVideoFallback: any = null;
    try {
      const videoModule = await import('../../services/videoFallbackService');
      renderVideoFallback = videoModule.renderVideoFallback;
    } catch (importError) {
      console.error('Failed to import videoFallbackService:', importError);
      await failJob(jobId, 'Video generation service is not available in this environment');
      throw new Error('Video generation service is not available');
    }
    
    // Use the fallback video rendering service instead of Remotion
    const videoUrl = await renderVideoFallback({
      script,
      jobId,
      voiceId,
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
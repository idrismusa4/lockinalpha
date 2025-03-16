import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { renderVideoFallback } from '../../services/videoFallbackService';
import { createJob, updateJobStatus, completeJob, failJob, updateJobProgress } from '../../services/jobService';

export async function POST(request: Request) {
  try {
    const { script } = await request.json();
    
    if (!script) {
      return NextResponse.json(
        { error: 'Script is required' },
        { status: 400 }
      );
    }
    
    // Create a new job
    const jobId = uuidv4();
    await createJob(jobId, script);
    
    // Start processing in the background
    processVideoGeneration(jobId, script).catch(error => {
      console.error('Error generating video:', error);
      failJob(jobId, error instanceof Error ? error.message : String(error));
    });
    
    return NextResponse.json({ 
      jobId,
      message: 'Video generation started' 
    });
  } catch (error) {
    console.error('Error starting video generation:', error);
    return NextResponse.json(
      { error: `Failed to start video generation: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

async function processVideoGeneration(jobId: string, script: string) {
  try {
    // Update job status
    await updateJobStatus(jobId, {
      status: 'processing',
      progress: 10
    });
    
    // Use the fallback video rendering service instead of Remotion
    // This avoids issues with esbuild/Remotion bundling in Next.js
    const videoUrl = await renderVideoFallback({
      script,
      jobId,
      onProgress: (progress) => {
        // Update job progress
        updateJobProgress(jobId, progress);
      }
    });
    
    // Complete the job
    await completeJob(jobId, videoUrl);
  } catch (error) {
    console.error('Error in video generation:', error);
    await failJob(jobId, error instanceof Error ? error.message : String(error));
    throw error;
  }
} 
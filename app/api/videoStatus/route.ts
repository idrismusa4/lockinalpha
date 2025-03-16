import { NextResponse } from 'next/server';
import { getJobStatus } from '../../services/jobService';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');
  
  console.log('videoStatus API called with jobId:', jobId);
  
  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // Get job status
    const job = await getJobStatus(jobId);
    
    if (!job) {
      console.log(`Job not found with ID: ${jobId}`);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    console.log(`Found job with ID: ${jobId}, status: ${job.status}, progress: ${job.progress}`);
    
    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      videoUrl: job.videoUrl,
      error: job.error,
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      { error: `Failed to get job status: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 
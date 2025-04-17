import { NextResponse } from 'next/server';
import { getRenderProgress } from '@remotion/lambda/client';
import type { RenderProgress } from '@remotion/lambda/shared';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const renderId = url.searchParams.get('renderId');
  
  if (!renderId) {
    return NextResponse.json(
      { error: 'Render ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // Get environment variables for Lambda rendering
    const region = process.env.REMOTION_AWS_REGION || 'us-east-1';
    const functionName = process.env.REMOTION_FUNCTION_NAME || 'remotion-render-4-0-286-mem3008mb-disk2048mb-300sec';
    const bucketName = process.env.REMOTION_S3_BUCKET;
    
    if (!bucketName) {
      return NextResponse.json(
        { error: 'REMOTION_S3_BUCKET environment variable is required' },
        { status: 500 }
      );
    }
    
    // Get render progress from Lambda
    const progress: RenderProgress = await getRenderProgress({
      renderId,
      bucketName,
      functionName,
      region,
    });
    
    // Format for client response
    const response = {
      renderId,
      done: progress.done,
      overallProgress: progress.overallProgress,
      errors: progress.errors,
      fatalErrorEncountered: progress.fatalErrorEncountered,
      costs: progress.costs,
      outputUrl: progress.outputFile,
      timeElapsedInSeconds: progress.timeRenderedInMilliseconds / 1000,
    };
    
    if (progress.fatalErrorEncountered) {
      return NextResponse.json({
        ...response,
        error: progress.errors.join(', '),
      }, { status: 500 });
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting render progress:', error);
    return NextResponse.json(
      { error: `Failed to get render progress: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 
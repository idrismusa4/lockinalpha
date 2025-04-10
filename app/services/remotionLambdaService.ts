import { getRenderProgress, renderMediaOnLambda } from '@remotion/lambda/client';
import { storage } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { FetchedMedia } from './mediaFetchService';

interface LambdaRenderParams {
  script: string;
  audioUrl?: string;
  media?: FetchedMedia[][];
  customIntroPath?: string;
  onProgress?: (progress: number) => void;
}

export async function renderWithLambda({
  script,
  audioUrl,
  media,
  customIntroPath,
  onProgress
}: LambdaRenderParams): Promise<string> {
  try {
    const jobId = uuidv4();
    console.log('Starting Lambda render with job ID:', jobId);

    // Start the render
    const { renderId, bucketName } = await renderMediaOnLambda({
      region: process.env.REMOTION_AWS_REGION || 'us-east-1',
      functionName: process.env.REMOTION_FUNCTION_NAME!,
      serveUrl: process.env.REMOTION_SERVE_URL!,
      composition: process.env.REMOTION_COMPOSITION_ID || 'VideoLecture',
      codec: 'h264',
      inputProps: {
        script,
        audioUrl,
        media,
        customIntroPath
      },
      downloadBehavior: {
        type: 's3',
        bucketName: process.env.REMOTION_S3_BUCKET!,
        key: `${jobId}.mp4`
      }
    });

    console.log('Render started with ID:', renderId);

    // Poll for progress
    while (true) {
      const progress = await getRenderProgress({
        renderId,
        bucketName,
        functionName: process.env.REMOTION_FUNCTION_NAME!,
        region: process.env.REMOTION_AWS_REGION || 'us-east-1'
      });

      if (onProgress) {
        onProgress(progress.overallProgress);
      }

      if (progress.outputFile) {
        console.log('Render completed, downloading from S3...');
        
        // Download from S3
        const s3Url = `https://${process.env.REMOTION_S3_BUCKET}.s3.${process.env.REMOTION_AWS_REGION}.amazonaws.com/${jobId}.mp4`;
        const response = await fetch(s3Url);
        const videoBuffer = await response.arrayBuffer();
        
        // Upload to Supabase storage
        const { data, error } = await storage
          .from('videos')
          .upload(`${jobId}.mp4`, videoBuffer, {
            contentType: 'video/mp4',
            upsert: true
          });

        if (error) {
          throw new Error(`Failed to upload video to Supabase: ${error.message}`);
        }

        // Get the public URL
        const { data: { publicUrl } } = storage
          .from('videos')
          .getPublicUrl(`${jobId}.mp4`);

        return publicUrl;
      }

      if (progress.fatalErrorEncountered) {
        throw new Error(`Render failed: ${progress.errors[0]}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Lambda rendering failed:', error);
    throw error;
  }
} 
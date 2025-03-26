import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ClientSideVideoPlayer from '@/components/ClientSideVideoPlayer';
import { supabase } from '@/app/supabase';
import { Loader2 } from 'lucide-react';
import { mightHaveCorsIssues } from '@/app/utils/cors-proxy';

interface VideoPageProps {
  params: {
    id: string;
  };
}

async function getJobData(jobId: string) {
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error || !job) {
    console.error('Error fetching job:', error);
    return null;
  }

  return job;
}

function getProxiedMediaUrl(originalUrl: string): string {
  // Skip proxying if not needed
  if (!mightHaveCorsIssues(originalUrl)) {
    return originalUrl;
  }
  
  // Extract the file name from the URL
  const fileName = originalUrl.split('/').pop();
  if (!fileName) {
    return originalUrl;
  }
  
  // Return the proxied URL
  return `/api/media-proxy/${fileName}`;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const jobId = params.id;
  const job = await getJobData(jobId);

  if (!job) {
    notFound();
  }

  // Determine if it's audio or video
  const isAudioOnly = job.videoUrl?.includes('/audios/');
  const originalMediaUrl = job.videoUrl;
  // Use our proxy for media files to avoid CORS issues
  const mediaUrl = getProxiedMediaUrl(originalMediaUrl);
  const transcript = job.script || '';

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{job.title || 'Video Lecture'}</h1>
      
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
        <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <ClientSideVideoPlayer 
            audioUrl={mediaUrl} 
            transcript={transcript} 
            jobId={jobId} 
          />
        </Suspense>
        
        <div className="mt-8 prose dark:prose-invert max-w-none">
          <h2 className="text-xl font-semibold">Transcript</h2>
          <div className="whitespace-pre-wrap">
            {transcript}
          </div>
        </div>
      </div>
    </div>
  );
} 
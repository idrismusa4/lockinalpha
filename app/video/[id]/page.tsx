import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import ClientSideVideoPlayer from '@/app/components/ClientSideVideoPlayer';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: 'Video Player',
    description: 'Watch your generated video',
  };
}

export default function VideoPage({ params }: { params: { id: string } }) {
  const headersList = headers();
  const host = headersList.get('host') || '';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const videoUrl = `${baseUrl}/api/video/${params.id}`;
  const audioUrl = `${baseUrl}/api/audio/${params.id}`;
  const transcriptUrl = `${baseUrl}/api/transcript/${params.id}`;

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <ClientSideVideoPlayer
            audioUrl={audioUrl}
            transcript={transcriptUrl}
            jobId={params.id}
          />
        </div>
      </div>
    </div>
  );
} 
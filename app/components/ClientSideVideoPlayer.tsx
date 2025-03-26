'use client';

import { useEffect, useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import EnhancedAudioPlayer from './EnhancedAudioPlayer';
import { mightHaveCorsIssues } from '../utils/cors-proxy';

interface VideoPlayerProps {
  audioUrl: string;
  transcript: string;
  jobId: string;
}

export default function ClientSideVideoPlayer({ audioUrl, transcript, jobId }: VideoPlayerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load FFmpeg on component mount
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;
        
        // Ensure our CORS headers have taken effect before loading
        setTimeout(async () => {
          try {
            // Load FFmpeg core and codecs
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
            await ffmpeg.load({
              coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
              wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            
            console.log('FFmpeg loaded successfully in browser');
            setFfmpegLoaded(true);
          } catch (e) {
            console.error('Error loading FFmpeg:', e);
            setError(`Error loading FFmpeg: ${e instanceof Error ? e.message : String(e)}`);
          }
        }, 1000); // small delay to ensure CORS headers are applied
        
      } catch (e) {
        console.error('Error creating FFmpeg instance:', e);
        setError(`Error initializing video generator: ${e instanceof Error ? e.message : String(e)}`);
      }
    };

    loadFFmpeg();

    // Cleanup
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, []);

  const generateVideo = async () => {
    if (!ffmpegRef.current || !ffmpegLoaded) {
      setError('FFmpeg is not loaded yet');
      return;
    }

    try {
      setIsGenerating(true);
      setProgress(0);
      setError(null);
      
      const ffmpeg = ffmpegRef.current;
      
      // Create title and slides from transcript
      setProgress(10);
      const titleText = transcript.split('\n')[0].replace(/^#+\s*/, '') || 'Video Lecture';
      
      // Get the audio file - use our CORS proxy if needed
      setProgress(20);
      console.log('Fetching audio from:', audioUrl);
      
      try {
        const audioData = await fetchFile(audioUrl);
        ffmpeg.writeFile('audio.mp3', audioData);
      } catch (audioError) {
        console.error('Error fetching audio directly, trying CORS proxy:', audioError);
        
        // If failed and it might be a CORS issue, try with our proxy
        if (mightHaveCorsIssues(audioUrl)) {
          // Extract file name from URL
          const fileName = audioUrl.split('/').pop();
          if (fileName) {
            const proxyUrl = `/api/media-proxy/${fileName}`;
            console.log('Using proxy URL:', proxyUrl);
            
            try {
              const proxiedAudioData = await fetchFile(proxyUrl);
              ffmpeg.writeFile('audio.mp3', proxiedAudioData);
            } catch (proxyError) {
              throw new Error(`Failed to fetch audio even with proxy: ${proxyError instanceof Error ? proxyError.message : String(proxyError)}`);
            }
          } else {
            throw new Error('Could not determine filename for proxy');
          }
        } else {
          throw audioError;
        }
      }
      
      // Create a simple colored background for slides
      setProgress(30);
      await ffmpeg.exec([
        '-f', 'lavfi',
        '-i', 'color=c=blue:s=1280x720',
        '-frames:v', '1',
        'slide.png'
      ]);
      
      // Create a text file for the concat operation
      setProgress(40);
      const duration = 60; // Assume 60 seconds for now, we'd need to get actual duration
      const imageList = 'file slide.png\nduration ' + duration;
      ffmpeg.writeFile('concat.txt', imageList);
      
      // Generate the video
      setProgress(50);
      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-i', 'audio.mp3',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        '-pix_fmt', 'yuv420p',
        'output.mp4'
      ]);
      
      setProgress(80);
      
      // Read the output file
      const outputData = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([outputData], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      setVideoUrl(url);
      setProgress(100);
      
      // Clean up
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.load();
      }
    } catch (e) {
      console.error('Error generating video:', e);
      setError(`Error generating video: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Determine what to display
  let content;
  if (videoUrl) {
    content = (
      <div className="w-full">
        <video 
          ref={videoRef}
          controls
          className="w-full rounded-lg shadow-lg"
          poster="/video-poster.png"
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={audioUrl} type="audio/mpeg" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  } else {
    content = (
      <div className="w-full flex flex-col items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner">
        <div className="w-full mb-6">
          <EnhancedAudioPlayer src={audioUrl} />
        </div>
        
        <Button
          onClick={generateVideo}
          disabled={isGenerating || !ffmpegLoaded}
          className="mt-4"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Video ({progress}%)
            </>
          ) : (
            'Generate Video from Audio'
          )}
        </Button>
        
        {error && (
          <div className="mt-4 text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      <h2 className="text-2xl font-bold mb-4">Video Lecture</h2>
      {content}
    </div>
  );
} 
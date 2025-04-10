'use client';

import { useEffect, useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import EnhancedAudioPlayer from './EnhancedAudioPlayer';
import { mightHaveCorsIssues } from '@/app/utils/cors-proxy';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('ClientSideVideoPlayer received audioUrl:', audioUrl);
  }, [audioUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = (e: ErrorEvent) => {
      console.error('Video error:', e);
      setError('Failed to load video. Please try refreshing the page.');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Helper function to add debug info
  const addDebugInfo = (info: string) => {
    console.log('FFmpeg Debug:', info);
    setDebugInfo(prev => [...prev, info]);
  };

  // Load FFmpeg on component mount
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        addDebugInfo('Creating FFmpeg instance...');
        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;
        
        // Listen for FFmpeg logs
        ffmpeg.on('log', ({ message }) => {
          addDebugInfo(`FFmpeg log: ${message}`);
        });
        
        // Load FFmpeg core and codecs
        addDebugInfo('Loading FFmpeg core files...');
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        
        const coreJsURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
        
        await ffmpeg.load({
          coreURL: coreJsURL,
          wasmURL: wasmURL,
        });
        
        addDebugInfo('FFmpeg loaded successfully');
        setFfmpegLoaded(true);
      } catch (e) {
        console.error('Error loading FFmpeg:', e);
        setError(`Error loading FFmpeg: ${e instanceof Error ? e.message : String(e)}`);
        addDebugInfo(`FFmpeg load error: ${e instanceof Error ? e.message : String(e)}`);
      }
    };

    loadFFmpeg();

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
      setDebugInfo([]);
      addDebugInfo('Starting video generation process');
      
      const ffmpeg = ffmpegRef.current;
      
      // Get the audio file
      setProgress(20);
      addDebugInfo(`Fetching audio from: ${audioUrl}`);
      
      let audioData;
      try {
        audioData = await fetchFile(audioUrl);
        ffmpeg.writeFile('audio.mp3', audioData);
        addDebugInfo('Audio fetched successfully');
      } catch (e) {
        console.error('Error fetching audio:', e);
        throw new Error(`Failed to fetch audio: ${e instanceof Error ? e.message : String(e)}`);
      }
      
      // Create a simple colored background for slides
      setProgress(30);
      addDebugInfo('Creating background slide');
      try {
        await ffmpeg.exec([
          '-f', 'lavfi',
          '-i', 'color=c=blue:s=1280x720',
          '-frames:v', '1',
          'slide.png'
        ]);
        addDebugInfo('Background slide created successfully');
      } catch (e) {
        console.error('Error creating slide:', e);
        throw new Error(`Failed to create slide: ${e instanceof Error ? e.message : String(e)}`);
      }
      
      // Create a text file for the concat operation
      setProgress(40);
      addDebugInfo('Creating concat file for slideshow');
      const imageList = 'file slide.png\nduration 60';
      try {
        ffmpeg.writeFile('concat.txt', imageList);
        addDebugInfo('Concat file created');
      } catch (e) {
        console.error('Error creating concat file:', e);
        throw new Error(`Failed to create concat file: ${e instanceof Error ? e.message : String(e)}`);
      }
      
      // Generate the video
      setProgress(50);
      addDebugInfo('Starting video generation process with FFmpeg');
      try {
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
        addDebugInfo('Video generation completed successfully');
      } catch (e) {
        console.error('Error generating video:', e);
        throw new Error(`Failed to generate video: ${e instanceof Error ? e.message : String(e)}`);
      }
      
      setProgress(80);
      addDebugInfo('Reading output file');
      
      // Read the output file
      try {
        const outputData = await ffmpeg.readFile('output.mp4');
        addDebugInfo(`Output file read successfully, size: ${outputData.byteLength} bytes`);
        
        const blob = new Blob([outputData], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        addDebugInfo(`Blob URL created: ${url}`);
        
        setVideoUrl(url);
        setProgress(100);
        
        // Clean up
        if (videoRef.current) {
          videoRef.current.src = url;
          videoRef.current.load();
          addDebugInfo('Video loaded into video element');
        }
      } catch (e) {
        console.error('Error reading output file:', e);
        throw new Error(`Failed to read generated video: ${e instanceof Error ? e.message : String(e)}`);
      }
    } catch (e) {
      console.error('Error generating video:', e);
      setError(`Error generating video: ${e instanceof Error ? e.message : String(e)}`);
      addDebugInfo(`Generation process failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      <h2 className="text-2xl font-bold mb-4">Video Lecture</h2>
      {videoUrl ? (
        <div className="relative w-full aspect-video bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-red-500">
              {error}
            </div>
          )}
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full h-full"
            crossOrigin="anonymous"
            playsInline
            preload="auto"
            style={{
              objectFit: 'contain',
              backgroundColor: 'black'
            }}
          />
        </div>
      ) : (
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
          
          {!ffmpegLoaded && !error && (
            <div className="mt-4 text-amber-500 text-sm">
              <AlertCircle className="inline mr-1" size={16} />
              Loading video generator... This may take a moment.
            </div>
          )}
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {debugInfo.length > 0 && (
            <div className="mt-4 text-xs p-2 bg-gray-200 dark:bg-gray-700 rounded-md w-full">
              <details>
                <summary className="cursor-pointer font-medium">Debug Information</summary>
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="py-1 border-b border-gray-300 dark:border-gray-600">
                      {info}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
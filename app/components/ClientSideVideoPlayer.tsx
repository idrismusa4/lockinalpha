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

  useEffect(() => {
    console.log('ClientSideVideoPlayer received audioUrl:', audioUrl);
  }, [audioUrl]);

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
        
        // Ensure our CORS headers have taken effect before loading
        setTimeout(async () => {
          try {
            // Load FFmpeg core and codecs
            addDebugInfo('Loading FFmpeg core files...');
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
            
            // Try to load with more detailed error handling
            try {
              const coreJsURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
              addDebugInfo('FFmpeg core JS URL created');
              
              const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
              addDebugInfo('FFmpeg WASM URL created');
              
              await ffmpeg.load({
                coreURL: coreJsURL,
                wasmURL: wasmURL,
              });
              
              addDebugInfo('FFmpeg loaded successfully in browser');
              setFfmpegLoaded(true);
            } catch (loadError) {
              console.error('Error during FFmpeg load:', loadError);
              addDebugInfo(`FFmpeg load error: ${loadError instanceof Error ? loadError.message : String(loadError)}`);
              throw loadError;
            }
          } catch (e) {
            console.error('Error loading FFmpeg:', e);
            setError(`Error loading FFmpeg: ${e instanceof Error ? e.message : String(e)}`);
            addDebugInfo(`Failed to load FFmpeg: ${e instanceof Error ? e.message : String(e)}`);
          }
        }, 1500); // increased delay to ensure CORS headers are applied
        
      } catch (e) {
        console.error('Error creating FFmpeg instance:', e);
        setError(`Error initializing video generator: ${e instanceof Error ? e.message : String(e)}`);
        addDebugInfo(`FFmpeg initialization error: ${e instanceof Error ? e.message : String(e)}`);
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
      setDebugInfo([]);
      addDebugInfo('Starting video generation process');
      
      const ffmpeg = ffmpegRef.current;
      
      // Create title and slides from transcript
      setProgress(10);
      addDebugInfo('Preparing transcript for slides');
      const titleText = transcript.split('\n')[0].replace(/^#+\s*/, '') || 'Video Lecture';
      
      // Get the audio file - use our CORS proxy if needed
      setProgress(20);
      addDebugInfo(`Fetching audio from: ${audioUrl}`);
      
      let audioFetched = false;
      
      // First try direct fetch
      try {
        addDebugInfo('Attempting direct fetch of audio file');
        const audioData = await fetchFile(audioUrl);
        ffmpeg.writeFile('audio.mp3', audioData);
        audioFetched = true;
        addDebugInfo('Audio fetched successfully via direct URL');
      } catch (directFetchError) {
        console.error('Error fetching audio directly:', directFetchError);
        addDebugInfo(`Direct fetch failed: ${directFetchError instanceof Error ? directFetchError.message : String(directFetchError)}`);
        
        // If direct fetch failed, try the proxy
        if (mightHaveCorsIssues(audioUrl)) {
          try {
            // Extract file name from URL
            const fileName = audioUrl.split('/').pop();
            if (fileName) {
              const proxyUrl = `/api/media-proxy/${fileName}`;
              addDebugInfo(`Trying with proxy URL: ${proxyUrl}`);
              
              const proxiedAudioData = await fetchFile(proxyUrl);
              ffmpeg.writeFile('audio.mp3', proxiedAudioData);
              audioFetched = true;
              addDebugInfo('Audio fetched successfully via proxy');
            } else {
              throw new Error('Could not determine filename for proxy');
            }
          } catch (proxyError) {
            addDebugInfo(`Proxy fetch failed: ${proxyError instanceof Error ? proxyError.message : String(proxyError)}`);
            throw new Error(`Failed to fetch audio even with proxy: ${proxyError instanceof Error ? proxyError.message : String(proxyError)}`);
          }
        } else {
          throw directFetchError;
        }
      }
      
      if (!audioFetched) {
        throw new Error('Could not fetch audio file through any method');
      }
      
      // Try to get audio duration using Web Audio API for more accurate video length
      let audioDuration = 60; // default fallback
      try {
        addDebugInfo('Getting audio duration using Web Audio API');
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) throw new Error('Failed to fetch audio for duration analysis');
        
        const arrayBuffer = await audioResponse.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioDuration = audioBuffer.duration;
        addDebugInfo(`Audio duration: ${audioDuration} seconds`);
        
        // Clean up audio context
        if (audioContext.close) {
          audioContext.close();
        }
      } catch (durationError) {
        console.error('Error getting audio duration:', durationError);
        addDebugInfo(`Duration detection failed: ${durationError instanceof Error ? durationError.message : String(durationError)}`);
        addDebugInfo('Using default duration of 60 seconds');
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
      } catch (slideError) {
        console.error('Error creating slide:', slideError);
        addDebugInfo(`Slide creation failed: ${slideError instanceof Error ? slideError.message : String(slideError)}`);
        throw new Error(`Failed to create slide: ${slideError instanceof Error ? slideError.message : String(slideError)}`);
      }
      
      // Create a text file for the concat operation
      setProgress(40);
      addDebugInfo('Creating concat file for slideshow');
      const imageList = 'file slide.png\nduration ' + Math.ceil(audioDuration);
      try {
        ffmpeg.writeFile('concat.txt', imageList);
        addDebugInfo('Concat file created');
      } catch (concatError) {
        console.error('Error creating concat file:', concatError);
        addDebugInfo(`Concat file creation failed: ${concatError instanceof Error ? concatError.message : String(concatError)}`);
        throw new Error(`Failed to create concat file: ${concatError instanceof Error ? concatError.message : String(concatError)}`);
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
      } catch (videoGenError) {
        console.error('Error generating video:', videoGenError);
        addDebugInfo(`Video generation failed: ${videoGenError instanceof Error ? videoGenError.message : String(videoGenError)}`);
        throw new Error(`Failed to generate video: ${videoGenError instanceof Error ? videoGenError.message : String(videoGenError)}`);
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
      } catch (outputError) {
        console.error('Error reading output file:', outputError);
        addDebugInfo(`Error reading output: ${outputError instanceof Error ? outputError.message : String(outputError)}`);
        throw new Error(`Failed to read generated video: ${outputError instanceof Error ? outputError.message : String(outputError)}`);
      }
    } catch (e) {
      console.error('Error generating video:', e);
      setError(`Error generating video: ${e instanceof Error ? e.message : String(e)}`);
      addDebugInfo(`Generation process failed: ${e instanceof Error ? e.message : String(e)}`);
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
          onError={(e) => {
            console.error('Video playback error:', e);
            setError('Video playback failed. Please try the audio-only version.');
            setVideoUrl(null);
          }}
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
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      <h2 className="text-2xl font-bold mb-4">Video Lecture</h2>
      {content}
    </div>
  );
} 
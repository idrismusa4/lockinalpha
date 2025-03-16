"use client";

import { useState, useRef, useEffect } from "react";

interface VideoPlayerProps {
  videoUrl: string;
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // Reset state when video URL changes
    setError(null);
    setLoaded(false);
    setDebugInfo(null);
    
    // Log the video URL for debugging
    console.log("Video URL:", videoUrl);
    
    // Check if URL is valid
    if (!videoUrl || !videoUrl.startsWith('http')) {
      setError("Invalid video URL. Please try again.");
      setDebugInfo(`Received invalid URL: ${videoUrl}`);
    }
    
    // Test accessibility of the URL
    const testFetch = async () => {
      try {
        const response = await fetch(videoUrl, { method: 'HEAD' });
        setDebugInfo(`URL status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
        
        if (!response.ok) {
          setError(`Video resource not available (Status: ${response.status})`);
        }
      } catch (err) {
        setDebugInfo(`Fetch error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    if (videoUrl && videoUrl.startsWith('http')) {
      testFetch();
    }
  }, [videoUrl]);
  
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const errorCode = video.error?.code || 'unknown';
    const errorMessage = video.error?.message || 'unknown error';
    
    console.error("Video error:", { code: errorCode, message: errorMessage });
    setDebugInfo(`Error code: ${errorCode}, Message: ${errorMessage}`);
    setError("Failed to load video. The video file may be corrupted or unavailable.");
  };
  
  const handleVideoLoaded = () => {
    setLoaded(true);
    setError(null);
    console.log("Video loaded successfully");
  };
  
  const handleRetry = () => {
    setError(null);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Your Video Lecture</h2>
      
      <div className="aspect-video mb-4 bg-black rounded-md overflow-hidden">
        {error ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-800 text-white">
            <p className="text-center mb-2">{error}</p>
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <video 
            ref={videoRef}
            src={videoUrl} 
            controls 
            className="w-full h-full"
            poster="/video-placeholder.png"
            onError={handleVideoError}
            onLoadedData={handleVideoLoaded}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      
      {/* Debugging info section */}
      {debugInfo && (
        <div className="mb-4 p-2 bg-gray-100 border border-gray-300 rounded-md">
          <p className="text-xs text-gray-700 font-mono">{debugInfo}</p>
        </div>
      )}
      
      {loaded && !error && (
        <div className="flex gap-2 justify-between">
          <a
            href={videoUrl}
            download
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Download Video
          </a>
          
          <button
            onClick={() => {
              navigator.clipboard.writeText(videoUrl);
              alert('Video URL copied to clipboard!');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md
              hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Copy Link
          </button>
        </div>
      )}
      
      {!loaded && !error && (
        <div className="flex justify-center">
          <p className="text-gray-500">Loading video...</p>
        </div>
      )}
      
      {/* Always show the direct URL as a fallback */}
      <div className="mt-4 p-3 bg-gray-100 rounded-md">
        <p className="text-sm text-gray-600 mb-1">Video URL:</p>
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline break-all"
        >
          {videoUrl}
        </a>
      </div>
      
      {/* Additional info */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Troubleshooting:</strong> If the video doesn't load, try watching it directly in a new tab or downloading it.
        </p>
      </div>
    </div>
  );
} 
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, ExternalLink, Volume2, Link as LinkIcon, RotateCcw, Play, Download } from "lucide-react";
import axios from 'axios';

interface VideoPlayerProps {
  videoUrl: string;
  onRetry?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, onRetry }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [key, setKey] = useState(Date.now()); // Force remount of media elements when URL changes
  const [useFallbackPlayer, setUseFallbackPlayer] = useState(false);
  const [isFetchingBlob, setIsFetchingBlob] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Reset state and force remount of media elements when URL changes
    setKey(Date.now());
    setLoading(true);
    setError(null);
    
    if (!videoUrl) {
      setError("No media URL provided");
      setLoading(false);
      return;
    }

    // Determine if this is an audio file based on the URL
    const isAudio = videoUrl.toLowerCase().endsWith('.mp3') || 
                    videoUrl.toLowerCase().includes('/audios/');
    setIsAudioOnly(isAudio);

    // For video content, use the fallback player by default
    if (!isAudio) {
      setUseFallbackPlayer(true);
    }

    // Check if the resource is accessible
    const checkResource = async () => {
      try {
        console.log("Checking media URL:", videoUrl);
        
        // Use a HEAD request to check if the resource exists
        await axios.head(videoUrl);
        
        // Don't set loading to false here - we'll wait for the onCanPlay event
      } catch (err) {
        console.error("Error checking media URL:", err);
        setError("Media could not be loaded. The file may be inaccessible or corrupted.");
        setLoading(false);
      }
    };

    checkResource();
  }, [videoUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(videoUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleMediaError = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const mediaElement = e.target as HTMLMediaElement;
    const errorCode = mediaElement.error ? mediaElement.error.code : 'unknown';
    const errorMessage = mediaElement.error ? mediaElement.error.message : 'Unknown error';
    
    console.error("Media error:", { 
      code: errorCode, 
      message: errorMessage, 
      mediaUrl: videoUrl 
    });
    
    // Try using the fallback player instead of showing an error immediately
    if (!useFallbackPlayer && !isAudioOnly) {
      console.log("Switching to fallback player for URL:", videoUrl);
      setUseFallbackPlayer(true);
      return; // Don't show error yet
    }
    
    setError(`Failed to load media (Error ${errorCode}): ${errorMessage}. The file may be corrupted or inaccessible.`);
    setLoading(false);
  };

  const handleMediaLoaded = () => {
    console.log("Media loaded successfully:", videoUrl);
    setLoading(false);
    setError(null);
  };

  const handleRetry = () => {
    // Reset fallback player state
    setUseFallbackPlayer(false);
    
    if (onRetry) {
      onRetry();
    } else {
      // Refresh the current media
      setKey(Date.now());
      setLoading(true);
      setError(null);
    }
  };

  // Method to fetch video as blob and create object URL
  const handlePlayWithBlob = async () => {
    if (blobUrl) {
      // If we already have a blob URL, use it
      if (videoRef.current) {
        videoRef.current.src = blobUrl;
        videoRef.current.play().catch(e => console.error("Error playing blob video:", e));
      }
      return;
    }
    
    try {
      setIsFetchingBlob(true);
      console.log("Fetching video as blob:", videoUrl);
      
      // For Supabase URLs, add cache-busting to avoid CORS issues
      const fetchUrl = videoUrl.includes('supabase.co') 
        ? `${videoUrl}${videoUrl.includes('?') ? '&' : '?'}_t=${Date.now()}` 
        : videoUrl;
      
      // Use credentials: 'omit' for Supabase
      const response = await fetch(fetchUrl, {
        credentials: 'omit',
        mode: 'cors',
        headers: {
          'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Verify that we got a video blob
      if (!blob.type.startsWith('video/')) {
        console.warn(`Warning: Expected video content but got ${blob.type}, size: ${blob.size} bytes`);
      }
      
      const objectUrl = URL.createObjectURL(blob);
      
      console.log("Created blob URL:", objectUrl, "from content type:", blob.type);
      setBlobUrl(objectUrl);
      setIsFetchingBlob(false);
      
      // Create a new video element to replace the current one with the blob URL
      const video = document.createElement('video');
      video.src = objectUrl;
      video.controls = true;
      video.className = "w-full rounded-md mb-4 bg-black";
      video.playsInline = true;
      video.autoplay = false;
      
      // When the new video can play, replace the old one
      video.oncanplay = () => {
        console.log("Blob video can play!");
        setLoading(false);
        
        // Replace the existing video with our new blob-sourced video
        if (videoRef.current && videoRef.current.parentNode) {
          videoRef.current.parentNode.replaceChild(video, videoRef.current);
          videoRef.current = video;
        }
      };
      
      video.onerror = (e) => {
        console.error("Error with blob video:", e);
        setError("Failed to play the video from blob. Please try the direct link.");
        setLoading(false);
      };
    } catch (error) {
      console.error("Error creating blob URL:", error);
      setIsFetchingBlob(false);
      setError(`Failed to load video as blob: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Direct link for easy troubleshooting
  const renderDirectLink = () => (
    <div className="mt-2 text-sm text-center">
      <span className="text-muted-foreground">If the video doesn't play, </span>
      <a 
        href={videoUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:underline inline-flex items-center gap-1"
      >
        <LinkIcon className="h-3 w-3" />
        try this direct link
      </a>
    </div>
  );

  // Render either the video or the iframe fallback
  const renderVideoPlayer = () => {
    if (useFallbackPlayer) {
      // Extract the file ID for a cleaner embedded solution
      const fileId = videoUrl.split('/').pop()?.split('?')[0] || '';
      
      // Create a player container with multiple fallback options
      return (
        <div className="w-full mb-4">
          {/* Main player - HTML5 Video with optimized settings for Supabase */}
          <div className="relative">
            <video 
              key={`direct-video-${key}`}
              ref={videoRef}
              className="w-full rounded-md bg-black" 
              controls 
              playsInline
              crossOrigin="anonymous"
              autoPlay={false}
              preload="metadata"
              poster="/video-poster.png"
              onError={(e) => {
                console.error("Direct video failed:", e);
                // We'll keep the player and just show the direct link notice
              }}
              onCanPlay={() => {
                console.log("Direct video can play!");
                setLoading(false);
                setError(null);
              }}
            >
              <source src={videoUrl} type="video/mp4" />
              <source src={videoUrl.replace('?', '%3F')} type="video/mp4" />
              Your browser does not support HTML5 video.
            </video>
            
            {/* Overlay with direct link notice */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md pointer-events-none opacity-0 transition-opacity hover:opacity-100">
              <div className="text-white text-center p-4">
                <p>If video doesn't play, use the direct link below</p>
              </div>
            </div>
          </div>
          
          {/* Permanent notice below player */}
          <div className="mt-2 text-sm text-center bg-primary/5 p-2 rounded-md">
            <p className="text-muted-foreground">
              If the video doesn't play, try the "Download" or "Open in New Tab" options below.
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <video 
        key={`video-${key}`}
        ref={videoRef}
        src={videoUrl} 
        controls 
        className="w-full rounded-md mb-4 bg-black" 
        onError={handleMediaError}
        onCanPlay={handleMediaLoaded}
        onLoadedMetadata={(e) => console.log("Video metadata loaded:", e.currentTarget.duration, "seconds")}
        onLoadStart={() => console.log("Video load started:", videoUrl)}
        controlsList="nodownload"
        preload="auto"
        poster="/video-poster.png"
        playsInline
      />
    );
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="bg-primary/5 pb-3">
        <CardTitle>{isAudioOnly ? "Audio Recording" : "Video Recording"}</CardTitle>
        <CardDescription>
          {isAudioOnly 
            ? "Listen to your generated audio recording" 
            : "Watch your generated video lecture"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-primary/5 rounded-md">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading media...</p>
            
            {/* Debug URL display */}
            <div className="mt-2 text-xs text-muted-foreground max-w-full overflow-hidden">
              <details>
                <summary className="cursor-pointer">Debug Info</summary>
                <p className="mt-1 break-all">URL: {videoUrl}</p>
                <p className="mt-1">Audio Only: {isAudioOnly ? 'Yes' : 'No'}</p>
              </details>
            </div>
            
            {!isAudioOnly && renderDirectLink()}
            {!isAudioOnly && (
              <Button 
                variant="outline" 
                size="sm"
                className="mt-4"
                onClick={handlePlayWithBlob}
                disabled={isFetchingBlob}
              >
                <Play className="mr-2 h-4 w-4" />
                {isFetchingBlob ? "Preparing Video..." : "Try Alternative Player"}
              </Button>
            )}
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="space-y-2">
              <p>{error}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry} 
                  className="mt-2 mr-2"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                {!isAudioOnly && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-2 mr-2"
                    onClick={handlePlayWithBlob}
                    disabled={isFetchingBlob}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {isFetchingBlob ? "Preparing..." : "Try Alternative Player"}
                  </Button>
                )}
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Directly
                  </Button>
                </a>
              </div>
            </AlertDescription>
          </Alert>
        ) : isAudioOnly ? (
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center justify-center h-20 w-full bg-primary/5 rounded-md mb-4">
              <Volume2 className="h-10 w-10 text-primary opacity-70 mr-2" />
              <p className="text-muted-foreground">Audio playback available</p>
            </div>
            
            <audio 
              key={`audio-${key}`}
              ref={audioRef}
              src={videoUrl} 
              controls 
              className="w-full mb-4" 
              onError={handleMediaError}
              onCanPlay={handleMediaLoaded}
              controlsList="nodownload"
              preload="auto"
            />
            
            <div className="flex justify-between w-full mt-2">
              <Button 
                variant="outline" 
                onClick={handleCopyLink}
                className="flex items-center"
              >
                <Copy className="mr-2 h-4 w-4" />
                {isCopied ? "Copied!" : "Copy Link"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.open(videoUrl, '_blank')}
                className="flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            {renderVideoPlayer()}
            {renderDirectLink()}
            
            <div className="flex flex-wrap justify-between w-full mt-2 gap-2">
              <Button 
                variant="outline" 
                onClick={handleCopyLink}
                className="flex items-center"
              >
                <Copy className="mr-2 h-4 w-4" />
                {isCopied ? "Copied!" : "Copy Link"}
              </Button>
              
              {!blobUrl && (
                <Button 
                  variant="outline"
                  onClick={handlePlayWithBlob}
                  disabled={isFetchingBlob}
                  className="flex items-center"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isFetchingBlob ? "Preparing..." : "Try Alternative Player"}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => window.open(videoUrl, '_blank')}
                className="flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </Button>
              
              <a 
                href={videoUrl} 
                download={`video-${videoUrl.split('/').pop()?.split('?')[0] || `video-${key}`}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
                onClick={(e) => {
                  // For Supabase URLs, we need to handle download specially
                  if (videoUrl.includes('supabase.co')) {
                    e.preventDefault();
                    
                    // Option 1: Try to use the Blob approach if available
                    if (blobUrl) {
                      const downloadLink = document.createElement('a');
                      downloadLink.href = blobUrl;
                      downloadLink.download = `video-${videoUrl.split('/').pop()?.split('?')[0] || `video-${key}`}`;
                      downloadLink.click();
                      return;
                    }
                    
                    // Option 2: Use the fetch API to download the file
                    setIsFetchingBlob(true);
                    fetch(videoUrl, { 
                      credentials: 'omit',
                      mode: 'cors' 
                    })
                      .then(response => response.blob())
                      .then(blob => {
                        setIsFetchingBlob(false);
                        const url = URL.createObjectURL(blob);
                        const downloadLink = document.createElement('a');
                        downloadLink.href = url;
                        downloadLink.download = `video-${videoUrl.split('/').pop()?.split('?')[0] || `video-${key}`}`;
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                      })
                      .catch(err => {
                        setIsFetchingBlob(false);
                        console.error('Error downloading video:', err);
                        // Fallback to direct link if fetch fails
                        window.open(videoUrl, '_blank');
                      });
                  }
                  // For non-Supabase URLs, let the browser handle it naturally
                }}
              >
                <Button 
                  variant="outline"
                  className="flex items-center"
                  disabled={isFetchingBlob}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isFetchingBlob ? "Preparing..." : "Download"}
                </Button>
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoPlayer; 
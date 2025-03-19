"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Download, Copy, ExternalLink } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [copying, setCopying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // Reset state when video URL changes
    setError(null);
    setLoaded(false);
    
    // Check if URL is valid
    if (!videoUrl || !videoUrl.startsWith('http')) {
      setError("Invalid video URL. Please try again.");
    }
    
    // Test accessibility of the URL
    const testFetch = async () => {
      try {
        const response = await fetch(videoUrl, { method: 'HEAD' });
        
        if (!response.ok) {
          setError(`Video resource not available (Status: ${response.status})`);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    
    if (videoUrl && videoUrl.startsWith('http')) {
      testFetch();
    }
  }, [videoUrl]);
  
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    console.error("Video error:", { code: video.error?.code, message: video.error?.message });
    setError("Failed to load video. The video file may be corrupted or unavailable.");
  };
  
  const handleVideoLoaded = () => {
    setLoaded(true);
    setError(null);
  };
  
  const handleRetry = () => {
    setError(null);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };
  
  const copyToClipboard = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(videoUrl);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setCopying(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Video Lecture</CardTitle>
        <CardDescription>
          Your generated video is ready to view and share
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-black rounded-md overflow-hidden">
          {error ? (
            <div className="h-full flex flex-col items-center justify-center p-4 bg-muted text-center">
              <AlertTriangle className="h-12 w-12 mb-2 text-destructive" />
              <p className="mb-2">{error}</p>
              <Button 
                onClick={handleRetry}
                variant="secondary"
                size="sm"
              >
                Retry
              </Button>
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
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={videoUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </Button>
          
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            {copying ? "Copied!" : "Copy Link"}
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <a href={videoUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </a>
          </Button>
        </div>
        
        {!loaded && !error && (
          <Alert>
            <AlertDescription>
              Loading video... If it doesn't appear, you can use the download or open links above.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 
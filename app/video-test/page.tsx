"use client";

import React, { useState } from 'react';
import VideoPlayer from '../components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VideoTestPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleTestVideo = async () => {
    if (!videoUrl) {
      setErrorMessage('Please enter a video URL');
      return;
    }
    
    setIsLoading(true);
    try {
      // Attempt to fetch the video URL head to see if it exists
      const response = await fetch(videoUrl, { method: 'HEAD' });
      if (!response.ok) {
        setErrorMessage(`Video URL returned status: ${response.status}`);
      } else {
        setErrorMessage('');
      }
    } catch (error) {
      setErrorMessage(`Error checking video URL: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Video Player Test</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Enter Video URL to Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Enter video URL to test"
              className="flex-1"
            />
            <Button 
              onClick={handleTestVideo}
              disabled={isLoading}
            >
              {isLoading ? 'Checking...' : 'Test'}
            </Button>
          </div>
          
          {errorMessage && (
            <div className="text-red-500 mb-4">
              {errorMessage}
            </div>
          )}
          
          {videoUrl && (
            <div className="mt-4">
              <VideoPlayer videoUrl={videoUrl} />
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="bg-primary/5 p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Debugging Tips</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>If videos don't play, check the browser console for errors</li>
          <li>Verify that CORS is configured properly on your storage</li>
          <li>Try the "Alternative Player" option which uses blob URLs</li>
          <li>Make sure your video content-type is set correctly (video/mp4)</li>
        </ul>
      </div>
    </div>
  );
} 
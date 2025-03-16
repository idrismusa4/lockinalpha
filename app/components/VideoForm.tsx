"use client";

import React, { useState } from 'react';
import { renderVideoWithRemotion } from '../services/videoService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

export default function VideoForm() {
  const [script, setScript] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleScriptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScript(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!script) {
      toast({
        title: "Script is required",
        description: "Please enter a script for your video.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setProgress(0);
    setVideoUrl(null);
    
    try {
      // Generate a unique job ID for this render
      const jobId = uuidv4();
      
      // Start the render process
      const url = await renderVideoWithRemotion({
        script,
        jobId,
        // We can't use the progress callback directly with server actions
        // This is a limitation, progress will only update after completion
      });
      
      // Set progress to 100% when complete
      setProgress(100);
      setVideoUrl(url);
      
      toast({
        title: "Video Generated",
        description: "Your video has been successfully created.",
      });
    } catch (error) {
      console.error("Error generating video:", error);
      toast({
        title: "Error Generating Video",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Create a Video Lecture</CardTitle>
        <CardDescription>
          Enter a script for your video lecture and we'll generate it for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full gap-4">
            <Textarea
              placeholder="Enter your script here..."
              className="min-h-[200px]"
              value={script}
              onChange={handleScriptChange}
              disabled={isLoading}
            />
            
            {isLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generating video...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
            
            {videoUrl && !isLoading && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Your Video</h3>
                <div className="aspect-video bg-muted rounded-md overflow-hidden">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="mt-2">
                  <a 
                    href={videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Download Video
                  </a>
                </div>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={isLoading || !script}
              className="w-full"
            >
              {isLoading ? "Generating..." : "Generate Video"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Videos are generated using AI and stored securely.
        </p>
      </CardFooter>
    </Card>
  );
} 
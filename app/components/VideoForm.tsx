"use client";

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { renderVideoWithRemotion } from '../services/videoService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { VOICE_OPTIONS, DEFAULT_VOICE_ID } from '@/app/services/voiceOptions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Volume2, Pause } from "lucide-react";

export default function VideoForm() {
  const [script, setScript] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE_ID);
  const [previewText, setPreviewText] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Update preview text when script changes
  useEffect(() => {
    if (script) {
      // Take the first 100 characters for preview
      setPreviewText(script.slice(0, 100) + (script.length > 100 ? "..." : ""));
    } else {
      setPreviewText('');
    }
  }, [script]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  const handleScriptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScript(event.target.value);
    // Stop any current preview when text changes
    if (isPreviewing) {
      stopPreview();
    }
  };

  const handleVoiceChange = (value: string) => {
    setSelectedVoice(value);
    // Stop any current preview when voice changes
    if (isPreviewing) {
      stopPreview();
    }
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPreviewing(false);
      audioRef.current = null;
    }
  };

  const handlePreviewVoice = async () => {
    if (!script) {
      toast({
        title: "Script is required",
        description: "Please enter a script to preview the voice.",
        variant: "destructive",
      });
      return;
    }

    // If already previewing, stop it
    if (isPreviewing) {
      stopPreview();
      return;
    }

    try {
      setIsPreviewing(true);

      const response = await axios.post("/api/previewVoice", {
        text: previewText,
        voiceId: selectedVoice
      });

      if (response.data.audioUrl) {
        // Stop any existing preview
        if (audioRef.current) {
          audioRef.current.pause();
        }

        // Create new audio element
        const audio = new Audio(response.data.audioUrl);
        audioRef.current = audio;

        // Play the preview
        audio.play();

        // Clean up when done
        audio.onended = () => {
          setIsPreviewing(false);
          audioRef.current = null;
        };
      }
    } catch (err) {
      console.error("Error previewing voice:", err);
      toast({
        title: "Voice Preview Failed",
        description: "Could not generate voice preview. Please try again.",
        variant: "destructive",
      });
      setIsPreviewing(false);
    }
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
      
      // Start the render process with selected voice
      const url = await renderVideoWithRemotion({
        script,
        jobId,
        voiceId: selectedVoice
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
            
            <div className="space-y-2">
              <Label htmlFor="voice">Narrator Voice</Label>
              <div className="flex gap-2">
                <Select 
                  value={selectedVoice} 
                  onValueChange={handleVoiceChange}
                  disabled={isLoading}
                >
                  <SelectTrigger id="voice" className="flex-1">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_OPTIONS.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviewVoice}
                  disabled={isLoading || !script}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  {isPreviewing ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      <span>Preview</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Select a voice and click Preview to hear how it sounds
              </p>
            </div>
            
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
"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { VOICE_OPTIONS, DEFAULT_VOICE_ID } from '@/app/services/voiceOptions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Volume2 } from "lucide-react";

interface VideoGeneratorProps {
  script: string;
  onVideoGenerated: (videoUrl: string) => void;
}

export default function VideoGenerator({ script, onVideoGenerated }: VideoGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE_ID);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [statusCheckAttempts, setStatusCheckAttempts] = useState(0);
  const maxStatusCheckAttempts = 20;
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Cleanup function to clear any active timeouts
  const cleanup = () => {
    if (statusCheckRef.current) {
      clearTimeout(statusCheckRef.current);
      statusCheckRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };
  
  const handlePreviewVoice = async () => {
    if (!script) return;
    
    try {
      setIsPreviewing(true);
      setError(null);
      
      // Get a short preview of the script (first 100 characters)
      const previewText = script.slice(0, 100) + "...";
      
      const response = await axios.post("/api/previewVoice", {
        text: previewText,
        voiceId: selectedVoice
      });
      
      if (response.data.audioUrl) {
        setPreviewAudio(response.data.audioUrl);
        
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
          setPreviewAudio(null);
          audioRef.current = null;
        };
      }
    } catch (err) {
      console.error("Error previewing voice:", err);
      setError("Failed to preview voice. Please try again.");
      setIsPreviewing(false);
    }
  };
  
  const handleGenerateVideo = async () => {
    // Clear any previous state
    setLoading(true);
    setError(null);
    setProgress(0);
    setJobId(null);
    setStatusCheckAttempts(0);
    cleanup();
    
    try {
      console.log("Starting video generation process...");
      
      // Start video generation with the selected voice
      const generateResponse = await axios.post("/api/generateVideo", {
        script,
        voiceId: selectedVoice
      });
      
      const newJobId = generateResponse.data.jobId;
      
      if (!newJobId) {
        throw new Error("Failed to start video generation - no job ID returned");
      }
      
      setJobId(newJobId);
      console.log(`Video generation job started with ID: ${newJobId}`);
      
      // Poll for video generation status
      const checkStatus = async () => {
        try {
          // Clear the current timeout reference
          statusCheckRef.current = null;
          
          // If we've exceeded the maximum number of attempts, give up
          if (statusCheckAttempts >= maxStatusCheckAttempts) {
            setError(`Gave up after ${maxStatusCheckAttempts} failed attempts to check status. The job may still be processing.`);
            setLoading(false);
            return;
          }
          
          console.log(`Checking status for job: ${newJobId}... (Attempt ${statusCheckAttempts + 1}/${maxStatusCheckAttempts})`);
          const statusResponse = await axios.get(`/api/videoStatus?jobId=${newJobId}`);
          
          // Reset the status check attempts on success
          setStatusCheckAttempts(0);
          
          console.log(`Got status response:`, statusResponse.data);
          
          if (statusResponse.data.status === "completed") {
            // Video generation complete
            setProgress(100);
            console.log(`Video generation completed: ${statusResponse.data.videoUrl}`);
            onVideoGenerated(statusResponse.data.videoUrl);
            setLoading(false);
          } else if (statusResponse.data.status === "failed") {
            // Video generation failed
            const errorMessage = statusResponse.data.error || "Video generation failed. Please try again.";
            console.error(`Video generation failed: ${errorMessage}`);
            setError(errorMessage);
            setLoading(false);
          } else {
            // Still processing
            const currentProgress = statusResponse.data.progress || 0;
            console.log(`Video still processing: ${currentProgress}% complete`);
            setProgress(currentProgress);
            
            // Schedule the next status check
            statusCheckRef.current = setTimeout(checkStatus, 2000);
          }
        } catch (err) {
          console.error("Error checking video status:", err);
          
          // Increment the number of failed attempts
          setStatusCheckAttempts(prev => prev + 1);
          
          if (statusCheckAttempts < maxStatusCheckAttempts - 1) {
            // If we haven't reached the max attempts, schedule another check
            // with increasing backoff time
            const backoffTime = Math.min(2000 * Math.pow(1.5, statusCheckAttempts), 10000);
            console.log(`Retrying status check in ${backoffTime}ms (attempt ${statusCheckAttempts + 1}/${maxStatusCheckAttempts})`);
            statusCheckRef.current = setTimeout(checkStatus, backoffTime);
          } else {
            // Try to provide more helpful error messages
            if (axios.isAxiosError(err) && err.response) {
              if (err.response.status === 404) {
                setError(`Job not found (ID: ${newJobId}). The processing job may have been lost. Please try again.`);
              } else {
                setError(`Failed to check video status: ${err.response.status} ${err.response.statusText}`);
              }
            } else {
              setError(`Failed to check video generation status: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
            
            setLoading(false);
          }
        }
      };
      
      // Start polling after a short delay
      statusCheckRef.current = setTimeout(checkStatus, 2000);
      
    } catch (err) {
      console.error("Error generating video:", err);
      
      // Try to provide more helpful error messages
      if (axios.isAxiosError(err) && err.response) {
        setError(`Video generation failed: ${err.response.status} ${err.response.statusText} - ${err.response.data?.error || 'Unknown error'}`);
      } else {
        setError(`An error occurred while generating the video: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      
      setLoading(false);
    }
  };
  
  // Function to retry video generation
  const handleRetry = () => {
    // Clean up any existing timeouts
    cleanup();
    
    // Just call handleGenerateVideo again
    handleGenerateVideo();
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Video Lecture</CardTitle>
        <CardDescription>
          Convert your script into a professional video lecture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="script">Lecture Script</Label>
          <div className="p-3 bg-muted rounded-md max-h-48 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap">{script}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="voice">Narrator Voice</Label>
          <div className="flex gap-2">
            <Select 
              value={selectedVoice} 
              onValueChange={setSelectedVoice}
              disabled={loading || isPreviewing}
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
              variant="outline"
              size="icon"
              onClick={handlePreviewVoice}
              disabled={loading || isPreviewing || !script}
            >
              <Volume2 className={isPreviewing ? "animate-pulse" : ""} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Select a voice and use the speaker icon to preview how it sounds
          </p>
        </div>
        
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generating video</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground">
              This may take several minutes depending on the length of the script
            </p>
            {jobId && (
              <p className="text-xs text-muted-foreground">
                Job ID: {jobId}
              </p>
            )}
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry} 
                className="mt-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Button
          onClick={handleGenerateVideo}
          disabled={loading || !script}
          className="w-full"
        >
          {loading ? "Generating Video..." : "Generate Video Lecture"}
        </Button>
      </CardContent>
    </Card>
  );
} 
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VOICE_OPTIONS, DEFAULT_VOICE_ID } from '@/app/services/voiceOptions';

export default function VideoForm() {
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE_ID);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Poll for job status when we have a job ID
  useEffect(() => {
    if (!jobId || videoUrl) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/videoStatus?jobId=${jobId}`);
        if (!response.ok) {
          throw new Error('Failed to check job status');
        }

        const data = await response.json();
        setProgress(data.progress || 0);

        if (data.status === 'completed' && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setLoading(false);
          toast({
            title: "Video generated successfully",
            description: "Your video lecture is now ready to view and download.",
          });
        } else if (data.status === 'failed') {
          setLoading(false);
          toast({
            title: "Generation failed",
            description: data.error || "There was an error generating your video. Please try again.",
            variant: "destructive",
          });
        } else {
          // Continue polling if still processing
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Error checking job status:', error);
      }
    };

    checkStatus();
  }, [jobId, videoUrl, toast]);

  // Add event listeners for audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioPreviewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!script.trim()) {
      toast({
        title: "Empty script",
        description: "Please enter content for your video lecture.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setProgress(0);
    setVideoUrl(null);
    
    try {
      const response = await fetch('/api/generateVideo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          script,
          voiceId: selectedVoice
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start video generation');
      }

      const data = await response.json();
      setJobId(data.jobId);

      toast({
        title: "Video generation started",
        description: "Your video is being processed. This may take a few minutes.",
      });
      
    } catch (error) {
      console.error('Error generating video:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "There was an error starting the video generation. Please check your AWS credentials.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handlePreviewVoice = async () => {
    // If we already have audio and the button is clicked, toggle play/pause
    if (audioPreviewUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          toast({
            title: "Audio playback failed",
            description: "There was an issue playing the audio. Please try again.",
            variant: "destructive",
          });
        });
      }
      return;
    }

    if (!script.trim()) {
      toast({
        title: "Empty script",
        description: "Please enter content for the voice preview.",
        variant: "destructive",
      });
      return;
    }

    setPreviewLoading(true);
    
    try {
      const response = await fetch('/api/previewTts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: script.substring(0, 500), // Use the first 500 chars for preview
          voiceId: selectedVoice
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate voice preview');
      }

      const data = await response.json();
      
      // Create hidden audio element if it doesn't exist
      if (!audioRef.current) {
        const audio = document.createElement('audio');
        audio.style.display = 'none';
        document.body.appendChild(audio);
        audioRef.current = audio;
      }
      
      // Update audio source and play
      if (audioRef.current) {
        setAudioPreviewUrl(data.audioUrl);
        audioRef.current.src = data.audioUrl;
        
        // Wait for the audio to be loaded before playing
        audioRef.current.onloadeddata = () => {
          audioRef.current?.play().catch(playError => {
            console.error('Error playing audio:', playError);
          });
          setIsPlaying(true);
        };
        
        audioRef.current.load();
      }
      
      toast({
        title: "Voice preview ready",
        description: "Previewing selected voice now.",
      });
    } catch (error) {
      console.error('Error generating voice preview:', error);
      toast({
        title: "Preview failed",
        description: error instanceof Error ? error.message : "There was an error generating the voice preview. Please check your AWS credentials.",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Get button text based on audio state
  const getPreviewButtonText = () => {
    if (previewLoading) return 'Loading...';
    if (audioPreviewUrl) {
      return isPlaying ? 'Pause' : 'Play';
    }
    return 'Preview Voice';
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="script" className="block text-sm font-medium mb-2">
            Video Script
          </label>
          <Textarea
            id="script"
            placeholder="Enter your lecture script here. Use clear sections and structure for best results."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="min-h-[200px]"
            disabled={loading}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="voice" className="block text-sm font-medium mb-2">
            Voice Selection
          </label>
          <div className="flex gap-2">
            <Select
              value={selectedVoice}
              onValueChange={setSelectedVoice}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
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
              disabled={previewLoading || loading}
            >
              {getPreviewButtonText()}
            </Button>
          </div>
          {/* Hidden audio element - we'll create it dynamically */}
        </div>
        
        {loading && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Processing: {progress}%
            </p>
          </div>
        )}
        
        {videoUrl && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Your Video</h3>
            <div className="aspect-video bg-gray-100 rounded overflow-hidden">
              <video 
                src={videoUrl} 
                controls 
                className="w-full h-full"
              />
            </div>
            <div className="mt-2 flex justify-end">
              <Button variant="outline" asChild>
                <a href={videoUrl} download target="_blank" rel="noopener noreferrer">
                  Download Video
                </a>
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={loading || !script}
            className="w-full"
          >
            {loading ? "Generating..." : "Generate Video"}
          </Button>
        </div>
      </form>
    </Card>
  );
} 
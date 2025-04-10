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
import { Volume2, Pause, Search, Loader2 } from "lucide-react";
import { extractSceneKeywords, extractVisualSubject } from '../services/keywordExtractionService';
import { FetchedMedia } from '../services/mediaFetchService';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function VideoForm() {
  const [script, setScript] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE_ID);
  const [previewText, setPreviewText] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  // New states for script analysis
  const [keywords, setKeywords] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mediaResults, setMediaResults] = useState<FetchedMedia[][]>([]);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Update preview text when script changes
  useEffect(() => {
    if (script) {
      // Take the first 100 characters for preview
      setPreviewText(script.slice(0, 100) + (script.length > 100 ? "..." : ""));
      // Reset analysis when script changes
      setHasAnalyzed(false);
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
    // Reset analysis when script changes
    setHasAnalyzed(false);
    setKeywords([]);
    setMediaResults([]);
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

  // New function to analyze script
  const analyzeScript = async () => {
    if (!script) {
      toast({
        title: "Script is required",
        description: "Please enter a script to analyze.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalyzeError(null);
      
      // Extract keywords from script
      const sceneKeywords = extractSceneKeywords(script);
      setKeywords(sceneKeywords);
      
      // Fetch media for each scene
      const fetchMediaPromise = fetch('/api/fetchMedia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script }),
      });
      
      // Set a timeout to handle potential long-running requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Media fetching timed out')), 15000)
      );
      
      // Race the fetch against the timeout
      const response = await Promise.race([fetchMediaPromise, timeoutPromise]) as Response;
      
      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.statusText}`);
      }
      
      const result = await response.json();
      setMediaResults(result.media);
      setHasAnalyzed(true);

      toast({
        title: "Script Analysis Complete",
        description: "Your script has been analyzed and media has been selected for your video.",
      });
    } catch (err) {
      console.error('Error analyzing script:', err);
      setAnalyzeError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: "Analysis Failed",
        description: "Could not complete script analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
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
    
    // If script hasn't been analyzed yet, suggest doing so
    if (!hasAnalyzed && !isLoading) {
      const shouldAnalyze = window.confirm(
        "You haven't analyzed your script yet. Analyzing helps create better visuals. Analyze now?"
      );
      
      if (shouldAnalyze) {
        await analyzeScript();
        return;
      }
    }
    
    setIsLoading(true);
    setProgress(0);
    setVideoUrl(null);
    
    try {
      // Generate a unique job ID for this render
      const jobId = uuidv4();
      
      // Include media results if available
      const mediaToUse = hasAnalyzed ? mediaResults : undefined;
      
      // Start the render process with selected voice and media
      const url = await renderVideoWithRemotion({
        script,
        jobId,
        voiceId: selectedVoice,
        media: mediaToUse
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
            
            {/* Script Analysis Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={analyzeScript}
              disabled={isLoading || isAnalyzing || !script}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {hasAnalyzed ? "Re-analyze Script" : "Analyze Script"}
                </>
              )}
            </Button>
            
            {/* Script Analysis Results */}
            {hasAnalyzed && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="analysis">
                  <AccordionTrigger>Script Analysis Results</AccordionTrigger>
                  <AccordionContent>
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      {keywords.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold">Extracted Keywords & Media</h3>
                          <div className="space-y-4">
                            {keywords.map((scene, index) => (
                              <div key={index} className="border p-3 rounded">
                                <h4 className="text-sm font-medium">Scene {index + 1}</h4>
                                <p className="text-xs"><strong>Main Concept:</strong> {scene.mainConcept}</p>
                                <p className="text-xs"><strong>Keywords:</strong> {scene.keywords.map((k: any) => k.keyword).join(', ')}</p>
                                
                                {/* Media Preview for this scene */}
                                {mediaResults[index] && mediaResults[index].length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium">Media:</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {mediaResults[index].map((media, mediaIndex) => (
                                        <div key={mediaIndex} className="border p-1 rounded w-20 h-20">
                                          <img 
                                            src={media.previewUrl || media.url} 
                                            alt={media.title || `Media ${mediaIndex}`}
                                            className="w-full h-full object-cover rounded"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
            
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
              <div className="space-y-2">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                  <video src={videoUrl} controls className="w-full h-full" />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(videoUrl, '_blank')}
                  className="w-full"
                >
                  Open in New Tab
                </Button>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={isLoading || !script}
              className="w-full"
            >
              {isLoading ? 'Generating...' : 'Generate Video'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 
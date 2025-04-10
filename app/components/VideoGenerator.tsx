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
import { AlertCircle, Volume2, Pause, Search, Loader2 } from "lucide-react";
import { extractSceneKeywords, extractVisualSubject } from '../services/keywordExtractionService';
import { FetchedMedia } from '../services/mediaFetchService';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

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
  const [previewText, setPreviewText] = useState<string>("");
  // New states for script analysis
  const [keywords, setKeywords] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mediaResults, setMediaResults] = useState<FetchedMedia[][]>([]);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  
  const maxStatusCheckAttempts = 10;
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Update preview text when script changes
  useEffect(() => {
    if (script) {
      setPreviewText(script.slice(0, 100) + "...");
    }
  }, [script]);
  
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
  
  // Handle change in voice selection
  const handleVoiceChange = (value: string) => {
    setSelectedVoice(value);
    // Stop any current preview
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
    if (!script) return;
    
    // If already previewing, stop it
    if (isPreviewing) {
      stopPreview();
      return;
    }
    
    try {
      setIsPreviewing(true);
      setError(null);
      
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
        
        // Set up event listeners
        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          setError("Failed to play audio preview. Please try again.");
          setIsPreviewing(false);
        };
        
        // Play the preview
        try {
          await audio.play();
        } catch (playError) {
          console.error("Error playing audio:", playError);
          setError("Failed to play audio preview. Please check your browser settings.");
          setIsPreviewing(false);
          return;
        }
        
        // Clean up when done
        audio.onended = () => {
          setIsPreviewing(false);
          setPreviewAudio(null);
          audioRef.current = null;
        };
      }
    } catch (err) {
      console.error("Error previewing voice:", err);
      
      // Provide more specific error messages
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage = err.response.data?.error || "Failed to preview voice";
        setError(`${errorMessage} (Status: ${err.response.status})`);
      } else {
        setError("Failed to preview voice. Please try again.");
      }
      
      setIsPreviewing(false);
    }
  };
  
  // New function to analyze script
  const analyzeScript = async () => {
    if (!script) return;

    try {
      setIsAnalyzing(true);
      setAnalyzeError(null);
      setError(null);
      
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
      
      console.log(`Analyzed script: ${sceneKeywords.length} scenes, ${result.media.flat().length} media items`);
    } catch (err) {
      console.error('Error analyzing script:', err);
      setAnalyzeError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Function to check video generation status with a specific job ID
  const checkStatusWithId = async (specificJobId: string) => {
    try {
      // Clear the current timeout reference
      if (statusCheckRef.current) {
        clearTimeout(statusCheckRef.current);
        statusCheckRef.current = null;
      }
      
      // If we've exceeded the maximum number of attempts, give up
      if (statusCheckAttempts >= maxStatusCheckAttempts) {
        setError(`Gave up after ${maxStatusCheckAttempts} failed attempts to check status. The job may still be processing.`);
        setLoading(false);
        return;
      }
      
      console.log(`Checking status for job: ${specificJobId}... (Attempt ${statusCheckAttempts + 1}/${maxStatusCheckAttempts})`);
      const statusResponse = await axios.get(`/api/videoStatus?jobId=${specificJobId}`);
      
      // Reset the status check attempts on success
      setStatusCheckAttempts(0);
      
      console.log(`Got status response:`, statusResponse.data);
      
      if (statusResponse.data.status === "completed") {
        // Media generation complete
        setProgress(100);
        
        // Check if this is an audio file
        const mediaUrl = statusResponse.data.videoUrl;
        const isAudioOnly = mediaUrl.toLowerCase().endsWith('.mp3') || 
                           mediaUrl.toLowerCase().includes('/audios/');
        
        if (isAudioOnly) {
          console.log(`Audio generation completed: ${mediaUrl}`);
        } else {
          console.log(`Video generation completed: ${mediaUrl}`);
        }
        
        // Pass the URL to the parent component regardless of whether it's audio or video
        onVideoGenerated(mediaUrl);
        setLoading(false);
      } else if (statusResponse.data.status === "failed") {
        // Generation failed
        const errorMessage = statusResponse.data.error || "Generation failed. Please try again.";
        console.error(`Media generation failed: ${errorMessage}`);
        setError(errorMessage);
        setLoading(false);
      } else {
        // Still processing
        const currentProgress = statusResponse.data.progress || 0;
        console.log(`Still processing: ${currentProgress}% complete`);
        setProgress(currentProgress);
        
        // Schedule the next status check with the same specific job ID
        statusCheckRef.current = setTimeout(() => checkStatusWithId(specificJobId), 2000);
      }
    } catch (err) {
      console.error("Error checking status:", err);
      
      // Increment the number of failed attempts
      setStatusCheckAttempts(prev => prev + 1);
      
      if (statusCheckAttempts < maxStatusCheckAttempts - 1) {
        // If we haven't reached the max attempts, schedule another check
        // with increasing backoff time
        const backoffTime = Math.min(2000 * Math.pow(1.5, statusCheckAttempts), 10000);
        console.log(`Retrying status check in ${backoffTime}ms (attempt ${statusCheckAttempts + 1}/${maxStatusCheckAttempts})`);
        statusCheckRef.current = setTimeout(() => checkStatusWithId(specificJobId), backoffTime);
      } else {
        // Try to provide more helpful error messages
        if (axios.isAxiosError(err) && err.response) {
          if (err.response.status === 404) {
            setError(`Job not found (ID: ${specificJobId}). The processing job may have been lost. Please try again.`);
          } else {
            setError(`Failed to check status: ${err.response.status} ${err.response.statusText}`);
          }
        } else {
          setError(`Failed to check generation status: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        
        setLoading(false);
      }
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
    
    // If script hasn't been analyzed yet, recommend analysis first
    if (!hasAnalyzed) {
      // Do a quick analysis before generation
      await analyzeScript();
    }
    
    try {
      console.log("Starting media generation process...");
      
      // Include media results if available
      const mediaToUse = hasAnalyzed ? mediaResults : undefined;
      
      // Start video or audio generation with the selected voice and media
      const generateResponse = await axios.post("/api/generateVideo", {
        script,
        voiceId: selectedVoice,
        media: mediaToUse
      });
      
      const newJobId = generateResponse.data.jobId;
      
      if (!newJobId) {
        throw new Error("Failed to start generation - no job ID returned");
      }
      
      // Store job ID in state for future reference
      setJobId(newJobId);
      console.log(`Generation job started with ID: ${newJobId}`);
      
      // Start checking status
      await checkStatusWithId(newJobId);
    } catch (err) {
      console.error("Error starting generation:", err);
      
      // Try to provide a more specific error message
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage = err.response.data?.error || "Failed to start generation";
        setError(`${errorMessage} (Status: ${err.response.status})`);
      } else {
        setError(`Failed to start media generation: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      
      setLoading(false);
    }
  };
  
  const handleRetry = () => {
    setError(null);
    setProgress(0);
    // Keep the same voice selection but clear other state
    setJobId(null);
    setStatusCheckAttempts(0);
    cleanup();
  };
  
  useEffect(() => {
    // Clean up when the component unmounts
    return cleanup;
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create Video</CardTitle>
        <CardDescription>
          Generate a video lecture from your script with visuals and voice narration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Script Analysis Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Script Analysis</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeScript}
              disabled={isAnalyzing || loading}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {hasAnalyzed ? "Re-analyze" : "Analyze Script"}
                </>
              )}
            </Button>
          </div>
          
          {analyzeError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Error</AlertTitle>
              <AlertDescription>{analyzeError}</AlertDescription>
            </Alert>
          )}
          
          {hasAnalyzed && (
            <Accordion type="single" collapsible className="w-full mt-2">
              <AccordionItem value="analysis">
                <AccordionTrigger>
                  Analyzed {keywords.length} scenes with {mediaResults.flat().length} media items
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <div className="space-y-4">
                      {keywords.map((scene, index) => (
                        <div key={index} className="border p-3 rounded text-sm">
                          <p className="font-medium">Scene {index + 1}</p>
                          <p className="text-xs text-muted-foreground"><span className="font-medium">Main:</span> {scene.mainConcept}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Keywords:</span> {scene.keywords.map((k: any) => k.keyword).join(', ')}
                          </p>
                          
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
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
        
        <Separator />
        
        {/* Voice Selection */}
        <div className="space-y-2">
          <Label htmlFor="voice">Narrator Voice</Label>
          <div className="flex flex-1 gap-2">
            <Select 
              value={selectedVoice} 
              onValueChange={handleVoiceChange}
              disabled={loading}
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
              disabled={loading}
              className="flex items-center gap-2"
              size="sm"
            >
              {isPreviewing ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Stop</span>
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
            Choose a voice for your video narration
          </p>
        </div>
        
        {/* Generation Status */}
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generating video...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-muted-foreground">
              This may take several minutes. Please don't close this page.
            </p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="pt-2">
          {error ? (
            <Button 
              variant="outline" 
              onClick={handleRetry}
              className="w-full"
            >
              Try Again
            </Button>
          ) : (
            <Button 
              disabled={loading} 
              onClick={handleGenerateVideo}
              className="w-full"
            >
              {loading ? 'Generating...' : 'Generate Video'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
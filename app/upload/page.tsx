"use client";

import { useState } from "react";
import FileUpload from "../components/FileUpload";
import ScriptGenerator from "../components/ScriptGenerator";
import VideoGenerator from "../components/VideoGenerator";
import VideoPlayer from "../components/VideoPlayer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function Upload() {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [script, setScript] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const handleUploadComplete = (url: string, fileName: string) => {
    setDocumentUrl(url);
    setDocumentName(fileName);
    setScript(null);
    setVideoUrl(null);
  };
  
  const handleScriptGenerated = (generatedScript: string) => {
    setScript(generatedScript);
    setVideoUrl(null);
  };
  
  const handleVideoGenerated = (url: string) => {
    setVideoUrl(url);
  };
  
  // Calculate current step (1, 2, or 3)
  const currentStep = !documentUrl ? 1 : (!script ? 2 : (!videoUrl ? 3 : 4));
  
  const resetProcess = () => {
    setDocumentUrl(null);
    setDocumentName(null);
    setScript(null);
    setVideoUrl(null);
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-4 text-center">Document to Video Converter</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-2xl mx-auto">
        Upload your study materials and we'll help you create engaging video lectures.
      </p>
      
      {/* Progress steps */}
      <div className="mb-8">
        <div className="flex justify-between max-w-md mx-auto">
          <div className={`flex flex-col items-center ${currentStep >= 1 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>1</div>
            <span className="mt-2 text-sm">Upload</span>
          </div>
          <div className={`flex flex-col items-center ${currentStep >= 2 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>2</div>
            <span className="mt-2 text-sm">Generate Script</span>
          </div>
          <div className={`flex flex-col items-center ${currentStep >= 3 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>3</div>
            <span className="mt-2 text-sm">Create Video</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Input or Script */}
        <div>
          {!videoUrl ? (
            <>
              {/* Step 1: File Upload */}
              {!documentUrl && (
                <FileUpload onUploadComplete={handleUploadComplete} />
              )}
              
              {/* Step 2: Script Generation */}
              {documentUrl && !script && (
                <ScriptGenerator 
                  documentUrl={documentUrl} 
                  documentName={documentName || ""} 
                  onScriptGenerated={handleScriptGenerated} 
                />
              )}
              
              {/* Step 3: Video Generation */}
              {script && !videoUrl && (
                <VideoGenerator 
                  script={script} 
                  onVideoGenerated={handleVideoGenerated} 
                />
              )}
            </>
          ) : (
            /* Script Display when video is generated */
            <Card>
              <CardHeader>
                <CardTitle>Lecture Script</CardTitle>
                <CardDescription>
                  The script used to generate your video lecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="whitespace-pre-wrap text-sm">
                    {script}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Right Column - Output */}
        <div>
          {videoUrl ? (
            <VideoPlayer videoUrl={videoUrl} />
          ) : (
            <div className="bg-card rounded-lg border h-[300px] flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Video Preview</h3>
              <p className="text-muted-foreground max-w-xs">
                {currentStep === 1 
                  ? "Upload a document to get started." 
                  : currentStep === 2 
                    ? "Generate a script from your document." 
                    : "Create your video and it will appear here."}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Another Video - Full width under both columns */}
      {videoUrl && (
        <div className="mt-10 py-6 border-t border-border">
          <div className="max-w-lg mx-auto text-center">
            <h3 className="text-xl font-semibold mb-2">Create Another Video</h3>
            <p className="text-muted-foreground mb-4">
              Start the process again with a new document.
            </p>
            <Button 
              onClick={resetProcess}
              className="px-6"
              size="lg"
            >
              Start New Video
            </Button>
          </div>
        </div>
      )}
      
      <div className="mt-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">How It Works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-card p-6 rounded-lg border">
            <div className="font-bold text-xl mb-2">1. Upload Document</div>
            <p className="text-muted-foreground">Upload your study materials (PDF, DOCX, or TXT) and we'll analyze the content.</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="font-bold text-xl mb-2">2. Generate Script</div>
            <p className="text-muted-foreground">Our AI will create an engaging script based on your document's content.</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="font-bold text-xl mb-2">3. Create Video</div>
            <p className="text-muted-foreground">Choose a voice and we'll generate a professional video lecture you can download and share.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
"use client";

import { useState } from "react";
import FileUpload from "../components/FileUpload";
import ScriptGenerator from "../components/ScriptGenerator";
import VideoGenerator from "../components/VideoGenerator";
import VideoPlayer from "../components/VideoPlayer";

export default function Dashboard() {
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
  
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">LockIn Auto Video Lecture</h1>
          <p className="text-lg text-gray-600">
            Upload your study materials, generate AI-powered scripts, and create engaging video lectures.
          </p>
        </header>
        
        <div className="max-w-5xl mx-auto">
          {/* Stepper */}
          <div className="flex justify-between mb-8">
            <div className={`flex flex-col items-center ${documentUrl ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${documentUrl ? 'bg-blue-100 text-blue-600' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="mt-2 text-sm">Upload</span>
            </div>
            <div className="flex-1 h-0.5 self-center bg-gray-200 mx-2" />
            <div className={`flex flex-col items-center ${script ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${script ? 'bg-green-100 text-green-600' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="mt-2 text-sm">Script</span>
            </div>
            <div className="flex-1 h-0.5 self-center bg-gray-200 mx-2" />
            <div className={`flex flex-col items-center ${videoUrl ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${videoUrl ? 'bg-purple-100 text-purple-600' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="mt-2 text-sm">Video</span>
            </div>
          </div>
          
          {/* Content */}
          <div className="grid grid-cols-1 gap-6">
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
            
            {/* Step 4: Video Player */}
            {videoUrl && (
              <VideoPlayer videoUrl={videoUrl} />
            )}
            
            {/* Reset button when all steps are complete */}
            {videoUrl && (
              <div className="text-center mt-6">
                <button
                  onClick={() => {
                    setDocumentUrl(null);
                    setDocumentName(null);
                    setScript(null);
                    setVideoUrl(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md
                    hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                >
                  Create Another Video
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
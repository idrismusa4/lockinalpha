"use client";

import { useState } from "react";
import axios from "axios";

interface VideoGeneratorProps {
  script: string;
  onVideoGenerated: (videoUrl: string) => void;
}

export default function VideoGenerator({ script, onVideoGenerated }: VideoGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  
  const handleGenerateVideo = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setJobId(null);
    
    try {
      console.log("Starting video generation process...");
      
      // Start video generation
      const generateResponse = await axios.post("/api/generateVideo", {
        script,
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
          console.log(`Checking status for job: ${newJobId}...`);
          const statusResponse = await axios.get(`/api/videoStatus?jobId=${newJobId}`);
          
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
            setTimeout(checkStatus, 2000); // Check again in 2 seconds
          }
        } catch (err) {
          console.error("Error checking video status:", err);
          
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
      };
      
      // Start polling after a short delay
      setTimeout(checkStatus, 2000);
      
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
    // Just call handleGenerateVideo again
    handleGenerateVideo();
  };
  
  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Generate Video Lecture</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lecture Script
        </label>
        <div className="p-3 bg-gray-50 rounded-md max-h-48 overflow-y-auto">
          <p className="text-sm whitespace-pre-wrap">{script}</p>
        </div>
      </div>
      
      {loading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-purple-600 h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Generating video: {progress}%
          </p>
          <p className="text-sm text-gray-500 mt-1">
            This may take several minutes depending on the length of the script.
          </p>
          {jobId && (
            <p className="text-xs text-gray-400 mt-1">
              Job ID: {jobId}
            </p>
          )}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          <p className="font-medium mb-2">Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={handleRetry}
            className="mt-2 px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-md hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}
      
      <button
        onClick={handleGenerateVideo}
        disabled={loading || !script}
        className="w-full py-2 px-4 bg-purple-600 text-white font-semibold rounded-md
          hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
          disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? "Generating Video..." : "Generate Video Lecture"}
      </button>
    </div>
  );
} 
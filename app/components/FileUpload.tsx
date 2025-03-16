"use client";

import { useState } from "react";
import { storage } from "../supabase";
import { v4 as uuidv4 } from 'uuid';

export default function FileUpload({ onUploadComplete }: { onUploadComplete: (url: string, fileName: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null); // Clear any previous errors
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(10); // Initial progress
    setError(null);
    
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${uuidv4()}.${fileExt}`;
      
      // Upload the file to Supabase Storage - using the pre-created 'documents' bucket
      const { error: uploadError } = await storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        throw uploadError;
      }
      
      setProgress(70);
      
      // Get the public URL for the file
      const { data: urlData } = storage
        .from('documents')
        .getPublicUrl(fileName);
        
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL for the uploaded file');
      }
      
      setProgress(100);
      
      // Call the callback with the download URL
      onUploadComplete(urlData.publicUrl, file.name);
      
      setUploading(false);
      setFile(null);
    } catch (error: any) {
      console.error("Upload failed:", error);
      console.error("Error message:", error.message);
      setError(error.message || "Upload failed. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Upload Study Material</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Document (PDF, DOCX, TXT)
        </label>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      
      {file && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Selected: {file.name}</p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {uploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Uploading: {progress}%</p>
        </div>
      )}
      
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {uploading ? "Uploading..." : "Upload Document"}
      </button>
    </div>
  );
} 
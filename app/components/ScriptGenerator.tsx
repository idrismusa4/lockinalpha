"use client";

import { useState } from "react";
import axios from "axios";

interface ScriptGeneratorProps {
  documentUrl: string;
  documentName: string;
  onScriptGenerated: (script: string) => void;
}

export default function ScriptGenerator({ 
  documentUrl, 
  documentName, 
  onScriptGenerated 
}: ScriptGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("5");
  const [style, setStyle] = useState("formal");
  
  const handleGenerateScript = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post("/api/generateScript", {
        documentUrl,
        documentName,
        topic: topic || undefined,
        duration: parseInt(duration),
        style,
      });
      
      if (response.data.script) {
        onScriptGenerated(response.data.script);
      } else {
        setError("Failed to generate script. Please try again.");
      }
    } catch (err) {
      console.error("Error generating script:", err);
      setError("An error occurred while generating the script.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Generate Lecture Script</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Document: <span className="font-medium">{documentName}</span>
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Topic (Optional)
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Specific topic to focus on"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lecture Duration (minutes)
        </label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="3">3 minutes</option>
          <option value="5">5 minutes</option>
          <option value="10">10 minutes</option>
          <option value="15">15 minutes</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lecture Style
        </label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
          <option value="technical">Technical</option>
          <option value="simplified">Simplified</option>
          <option value="storytelling">Storytelling</option>
        </select>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <button
        onClick={handleGenerateScript}
        disabled={loading}
        className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-md
          hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50
          disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? "Generating..." : "Generate Script"}
      </button>
    </div>
  );
} 
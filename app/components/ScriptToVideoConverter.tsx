'use client';

import React, { useState } from 'react';
import { extractSceneKeywords, extractVisualSubject } from '../services/keywordExtractionService';
import { FetchedMedia } from '../services/mediaFetchService';

interface ScriptAnalysisProps {
  script: string;
}

const ScriptAnalysis: React.FC<ScriptAnalysisProps> = ({ script }) => {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mediaResults, setMediaResults] = useState<FetchedMedia[][]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyzeScript = async () => {
    try {
      setIsAnalyzing(true);
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
    } catch (err) {
      console.error('Error analyzing script:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-white shadow mb-4">
      <h2 className="text-xl font-bold mb-4">Script Analysis</h2>
      
      <button
        onClick={analyzeScript}
        disabled={isAnalyzing || !script}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze Script'}
      </button>
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {keywords.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Extracted Keywords</h3>
          <div className="space-y-4">
            {keywords.map((scene, index) => (
              <div key={index} className="border p-3 rounded">
                <h4 className="font-medium">Scene {index + 1}</h4>
                <p><strong>Main Concept:</strong> {scene.mainConcept}</p>
                <p><strong>Keywords:</strong> {scene.keywords.map(k => k.keyword).join(', ')}</p>
                {scene.entities.length > 0 && (
                  <p><strong>Entities:</strong> {scene.entities.join(', ')}</p>
                )}
                {scene.emotions.length > 0 && (
                  <p><strong>Emotions:</strong> {scene.emotions.join(', ')}</p>
                )}
                <p><strong>Context:</strong> {scene.context}</p>
                
                {/* Visual Subject Analysis */}
                <div className="mt-2 pt-2 border-t">
                  <strong>Visual Subject Analysis:</strong>
                  {(() => {
                    const { paragraphs } = require('../remotion/utils/parser').parseMarkdown(script);
                    const sceneText = paragraphs[index] || '';
                    const visual = extractVisualSubject(sceneText);
                    return (
                      <div>
                        <p><strong>Subject:</strong> {visual.subject}</p>
                        <p><strong>Description:</strong> {visual.description}</p>
                        <p><strong>Action:</strong> {visual.action}</p>
                        <p><strong>Emotion:</strong> {visual.emotion}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {mediaResults.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Media Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediaResults.map((sceneMedia, sceneIndex) => (
              <div key={sceneIndex} className="border p-3 rounded">
                <h4 className="font-medium">Scene {sceneIndex + 1}</h4>
                <div className="flex flex-wrap gap-2">
                  {sceneMedia.map((media, mediaIndex) => (
                    <div key={mediaIndex} className="border p-2 rounded">
                      <img 
                        src={media.previewUrl || media.url} 
                        alt={media.title || `Media ${mediaIndex}`}
                        className="max-w-full h-auto max-h-40"
                      />
                      <div className="text-xs mt-1">
                        <p>{media.title}</p>
                        <p>Keywords: {media.keywords.join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ScriptToVideoConverterProps {
  defaultScript?: string;
}

const ScriptToVideoConverter: React.FC<ScriptToVideoConverterProps> = ({ 
  defaultScript = "# AI Video Presentation\n\nArtificial intelligence is revolutionizing how we work and live.\n\nMachine learning models can now understand natural language and generate human-like responses.\n\nComputer vision systems can recognize objects and faces with incredible accuracy.\n\nThe future of AI will bring even more powerful tools that enhance human creativity."
}) => {
  const [script, setScript] = useState(defaultScript);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScript(e.target.value);
  };

  const generateVideo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setStatus('Starting video generation...');
      
      const response = await fetch('/api/generateVideo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start video generation: ${response.statusText}`);
      }
      
      const result = await response.json();
      setJobId(result.jobId);
      setStatus('Video generation started. Checking status...');
      
      // Start polling for status
      pollVideoStatus(result.jobId);
    } catch (err) {
      console.error('Error generating video:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setStatus(null);
      setIsLoading(false);
    }
  };
  
  const pollVideoStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/videoStatus?jobId=${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to check video status: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update status
      setStatus(`Status: ${result.status} (${result.progress || 0}%)`);
      
      if (result.status === 'completed') {
        setVideoUrl(result.url);
        setIsLoading(false);
      } else if (result.status === 'failed') {
        throw new Error(result.error || 'Video generation failed');
      } else {
        // Continue polling
        setTimeout(() => pollVideoStatus(id), 5000);
      }
    } catch (err) {
      console.error('Error checking video status:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setStatus(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Script to Video Converter</h1>
      
      <div className="mb-4">
        <label htmlFor="script" className="block font-medium mb-2">
          Enter your script:
        </label>
        <textarea
          id="script"
          value={script}
          onChange={handleScriptChange}
          className="w-full h-64 p-2 border rounded focus:ring focus:border-blue-300"
          placeholder="Write your script here..."
        />
      </div>
      
      <ScriptAnalysis script={script} />
      
      <div className="flex space-x-4 mb-4">
        <button
          onClick={generateVideo}
          disabled={isLoading || !script}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate Video'}
        </button>
      </div>
      
      {status && (
        <div className="p-3 mb-4 bg-blue-100 text-blue-700 rounded">
          {status}
        </div>
      )}
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {videoUrl && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Generated Video</h2>
          <video
            src={videoUrl}
            controls
            className="w-full max-h-96 bg-black"
            poster="/video-placeholder.jpg"
          />
          <div className="mt-2">
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Open video in new tab
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptToVideoConverter; 
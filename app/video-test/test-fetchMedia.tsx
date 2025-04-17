'use client';

import React, { useState } from 'react';
import { FetchedMedia } from '../services/mediaFetchService';

export default function TestFetchMedia() {
  const [script, setScript] = useState<string>("Artificial intelligence is revolutionizing how we work and live.\n\nMachine learning models can now understand natural language.");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaResults, setMediaResults] = useState<FetchedMedia[][]>([]);

  const handleFetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResults(null);
      
      console.log('Testing fetchMedia API with script:', script.substring(0, 100));
      
      const response = await fetch('/api/fetchMedia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          script,
          itemsPerSlide: 1 // Just fetch one item per paragraph for testing
        }),
      });
      
      // Log the raw response
      const responseText = await response.text();
      console.log('Raw API response:', responseText);
      
      // Parse the JSON (we have to parse it again since we read the text)
      const result = JSON.parse(responseText);
      setResults(result);
      
      if (result.error) {
        setError(result.error);
      } else if (result.media) {
        setMediaResults(result.media);
      }
    } catch (err) {
      console.error('Error testing fetchMedia:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test fetchMedia API</h1>
      
      <div className="mb-4">
        <label className="block font-medium mb-2">Test Script:</label>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="w-full h-40 p-2 border rounded"
        />
      </div>
      
      <button
        onClick={handleFetch}
        disabled={isLoading || !script}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-6"
      >
        {isLoading ? 'Fetching...' : 'Test fetchMedia API'}
      </button>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <pre className="mt-2 whitespace-pre-wrap">{error}</pre>
        </div>
      )}
      
      {results && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3">API Response:</h2>
          <div className="p-4 bg-gray-100 rounded overflow-auto">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {mediaResults.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-3">Media Results:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediaResults.map((paragraph, index) => (
              <div key={index} className="border p-4 rounded">
                <h3 className="font-medium mb-2">Paragraph {index + 1}</h3>
                {paragraph.length === 0 ? (
                  <p className="text-gray-500">No media found for this paragraph</p>
                ) : (
                  <div className="space-y-4">
                    {paragraph.map((media, mediaIndex) => (
                      <div key={mediaIndex} className="border p-2 rounded">
                        <h4 className="font-medium text-sm mb-1">Media {mediaIndex + 1}</h4>
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="md:w-1/2">
                            <img
                              src={media.url}
                              alt={media.title || `Media ${mediaIndex}`}
                              className="max-w-full h-auto max-h-60 border rounded"
                            />
                          </div>
                          <div className="md:w-1/2">
                            <p><strong>Title:</strong> {media.title}</p>
                            <p><strong>Type:</strong> {media.type}</p>
                            <p><strong>Source:</strong> {media.source}</p>
                            <p><strong>Dimensions:</strong> {media.width}x{media.height}</p>
                            <p><strong>Keywords:</strong> {media.keywords.join(', ')}</p>
                            <p>
                              <strong>URL:</strong> 
                              <a 
                                href={media.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline break-all"
                              >
                                {media.url.substring(0, 50)}...
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
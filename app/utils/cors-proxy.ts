/**
 * This utility helps proxy requests to media files that might have CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Check if a URL might have CORS issues
 * @param url The URL to check
 * @returns Whether the URL might have CORS issues
 */
export function mightHaveCorsIssues(url: string): boolean {
  if (!url) return false;
  
  try {
    // Check if it's a Supabase storage URL
    if (url.includes('supabase.co/storage/v1/object/public')) {
      return true;
    }
    
    // Check if it's a relative URL starting with /api
    if (url.startsWith('/api/')) {
      return false; // Our own API shouldn't have CORS issues
    }
    
    // Check if it's a blob URL (these are already local and don't have CORS issues)
    if (url.startsWith('blob:')) {
      return false;
    }
    
    // Add other services that might have CORS issues here
    // For example:
    const corsIssueHosts = [
      'amazonaws.com',
      'cloudfront.net',
      'googleapis.com'
    ];
    
    for (const host of corsIssueHosts) {
      if (url.includes(host)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking CORS issues:', error);
    return true; // If in doubt, assume there might be CORS issues
  }
}

/**
 * Helper function to extract a filename from a URL
 */
export function extractFilenameFromUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    // Try to get the filename from the path
    const pathSegments = new URL(url).pathname.split('/');
    const filename = pathSegments[pathSegments.length - 1];
    
    // Remove query parameters if present
    return filename.split('?')[0];
  } catch (error) {
    // If URL parsing fails, try a simpler approach
    const segments = url.split('/');
    const lastSegment = segments[segments.length - 1];
    return lastSegment.split('?')[0] || null;
  }
}

/**
 * Create a proxy URL for a given media URL
 */
export function createProxyUrl(url: string): string | null {
  try {
    // Direct URL method - pass the full URL as a parameter
    const encodedUrl = encodeURIComponent(url);
    const filename = extractFilenameFromUrl(url);
    
    if (!filename) {
      console.error('Could not extract filename from URL:', url);
      return null;
    }
    
    // Create the proxy URL
    return `/api/media-proxy/${filename}?url=${encodedUrl}`;
  } catch (error) {
    console.error('Error creating proxy URL:', error);
    return null;
  }
}

/**
 * Proxy a media file to avoid CORS issues
 * @param url The URL of the media file
 * @returns A NextResponse with the media file
 */
export async function proxyMediaFile(url: string): Promise<NextResponse> {
  try {
    // Add caching parameter to avoid issues with cached responses
    const cacheBuster = Date.now();
    const fetchUrl = url.includes('?') 
      ? `${url}&_t=${cacheBuster}` 
      : `${url}?_t=${cacheBuster}`;
    
    console.log(`Proxying media from: ${fetchUrl}`);
    
    // Fetch the file with custom headers to avoid CORS issues
    const response = await fetch(fetchUrl, {
      headers: {
        'Accept': 'audio/*, video/*, application/octet-stream',
        'Origin': 'https://lockin-alpha.vercel.app'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch media file: ${response.status} ${response.statusText}`);
      return NextResponse.json({ 
        error: 'Failed to fetch media file', 
        status: response.status,
        statusText: response.statusText
      }, { status: response.status });
    }

    // Get the content type and the file data
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    console.log(`Media content type: ${contentType}`);
    
    const data = await response.arrayBuffer();
    console.log(`Received media data: ${data.byteLength} bytes`);

    // Create a response with the proper headers
    const proxiedResponse = new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': data.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        'X-Proxy-Source': 'lockin-proxy'
      }
    });

    return proxiedResponse;
  } catch (error) {
    console.error('Error proxying media file:', error);
    return NextResponse.json({ 
      error: 'Error proxying media file',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
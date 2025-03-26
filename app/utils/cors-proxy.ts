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
  
  // Check if it's a Supabase storage URL
  if (url.includes('supabase.co/storage/v1/object/public')) {
    return true;
  }
  
  // Add other services that might have CORS issues here
  
  return false;
}

/**
 * Proxy a media file to avoid CORS issues
 * @param url The URL of the media file
 * @returns A NextResponse with the media file
 */
export async function proxyMediaFile(url: string): Promise<NextResponse> {
  try {
    // Fetch the file
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch media file: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: 'Failed to fetch media file' }, { status: response.status });
    }

    // Get the content type and the file data
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const data = await response.arrayBuffer();

    // Create a response with the proper headers
    const proxiedResponse = new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': data.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=86400' // Cache for 1 day
      }
    });

    return proxiedResponse;
  } catch (error) {
    console.error('Error proxying media file:', error);
    return NextResponse.json({ error: 'Error proxying media file' }, { status: 500 });
  }
} 
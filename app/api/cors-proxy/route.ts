import { NextRequest, NextResponse } from 'next/server';
import { mightHaveCorsIssues, extractFilenameFromUrl } from '@/app/utils/cors-proxy';

/**
 * API route for proxying requests to media files that might have CORS issues
 */
export async function GET(request: NextRequest) {
  // Get the URL from the query params
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Fetch the resource
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Get the content as an array buffer
    const buffer = await response.arrayBuffer();
    
    // Create a new response with the content and appropriate headers
    const proxiedResponse = new NextResponse(buffer, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });

    // Try to get a filename for the Content-Disposition header
    const filename = extractFilenameFromUrl(url);
    if (filename) {
      proxiedResponse.headers.set(
        'Content-Disposition',
        `inline; filename="${filename}"`
      );
    }

    return proxiedResponse;
  } catch (error) {
    console.error('CORS proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy resource', details: (error as Error).message },
      { status: 500 }
    );
  }
} 
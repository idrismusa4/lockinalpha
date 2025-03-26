import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/supabase';
import { proxyMediaFile } from '@/app/utils/cors-proxy';

/**
 * Helper function to decode URL parameters
 */
function decodeMediaId(mediaId: string): string {
  try {
    // Handle potential double encoding
    return decodeURIComponent(mediaId);
  } catch (e) {
    console.error('Error decoding mediaId:', e);
    return mediaId;
  }
}

/**
 * GET handler for proxying media files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  const { mediaId: encodedMediaId } = params;
  
  if (!encodedMediaId) {
    return NextResponse.json({ error: 'Missing media ID' }, { status: 400 });
  }
  
  // Decode the mediaId to handle URL encoded parameters
  const mediaId = decodeMediaId(encodedMediaId);
  console.log('Proxying media:', mediaId);

  try {
    // Get URL parameters from the request
    const url = new URL(request.url);
    const directUrl = url.searchParams.get('url');
    
    // If a direct URL is provided, proxy it directly
    if (directUrl) {
      console.log('Proxying direct URL:', directUrl);
      return proxyMediaFile(directUrl);
    }
    
    // Otherwise, look up the file in Supabase
    // Determine if it's audio or video based on extension
    const isAudio = mediaId.toLowerCase().endsWith('.mp3') || 
                    mediaId.toLowerCase().endsWith('.wav') ||
                    mediaId.toLowerCase().endsWith('.ogg');
    
    const bucket = isAudio ? 'audios' : 'videos';
    console.log(`Using bucket '${bucket}' for file: ${mediaId}`);
    
    // Get the public URL from Supabase
    const { data: publicUrlData } = await supabase.storage
      .from(bucket)
      .getPublicUrl(mediaId);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error(`Media file not found: ${mediaId}`);
      
      // Try the other bucket as a fallback
      const fallbackBucket = isAudio ? 'videos' : 'audios';
      console.log(`Trying fallback bucket '${fallbackBucket}'`);
      
      const { data: fallbackData } = await supabase.storage
        .from(fallbackBucket)
        .getPublicUrl(mediaId);
      
      if (!fallbackData || !fallbackData.publicUrl) {
        return NextResponse.json({ error: 'Media file not found in either bucket' }, { status: 404 });
      }
      
      console.log(`Found in fallback bucket: ${fallbackData.publicUrl}`);
      return proxyMediaFile(fallbackData.publicUrl);
    }

    console.log(`Proxying file from Supabase: ${publicUrlData.publicUrl}`);
    // Proxy the media file
    return proxyMediaFile(publicUrlData.publicUrl);
  } catch (error) {
    console.error('Error proxying media:', error);
    return NextResponse.json(
      { error: 'Failed to proxy media file', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
} 
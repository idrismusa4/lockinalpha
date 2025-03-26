import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/supabase';
import { proxyMediaFile } from '@/app/utils/cors-proxy';

/**
 * GET handler for proxying media files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { mediaId: string } }
) {
  const { mediaId } = params;

  if (!mediaId) {
    return NextResponse.json({ error: 'Missing media ID' }, { status: 400 });
  }

  try {
    // Determine if it's audio or video based on extension
    const isAudio = mediaId.toLowerCase().endsWith('.mp3') || 
                    mediaId.toLowerCase().endsWith('.wav') ||
                    mediaId.toLowerCase().endsWith('.ogg');
    
    const bucket = isAudio ? 'audios' : 'videos';
    
    // Get the public URL from Supabase
    const { data: publicUrlData } = await supabase.storage
      .from(bucket)
      .getPublicUrl(mediaId);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error(`Media file not found: ${mediaId}`);
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    // Proxy the media file
    return proxyMediaFile(publicUrlData.publicUrl);
  } catch (error) {
    console.error('Error proxying media:', error);
    return NextResponse.json(
      { error: 'Failed to proxy media file' },
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
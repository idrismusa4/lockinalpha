import { NextResponse } from 'next/server';
import { fetchMediaForScript } from '../../services/mediaFetchService';

// Define interface for expected request body
interface FetchMediaRequest {
  script: string;
  mediaTypes?: string[];
  limit?: number;
  itemsPerSlide?: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as FetchMediaRequest;
    const { script, limit = 1, itemsPerSlide = 2 } = body;
    
    if (!script) {
      return NextResponse.json(
        { error: 'Script is required' },
        { status: 400 }
      );
    }
    
    // Check if GIPHY API key is configured
    if (!process.env.GIPHY_API_KEY) {
      return NextResponse.json(
        { error: 'GIPHY API key is not configured. Please set the GIPHY_API_KEY environment variable.' },
        { status: 500 }
      );
    }
    
    console.log(`Fetching media for script with ${itemsPerSlide} items per slide`);
    
    // Fetch media for the script with the specified itemsPerSlide
    const media = await fetchMediaForScript(script, itemsPerSlide);
    
    // Return the fetched media
    return NextResponse.json({ 
      media,
      message: 'Media fetched successfully' 
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    
    return NextResponse.json(
      { error: `Failed to fetch media: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 
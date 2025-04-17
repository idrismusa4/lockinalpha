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
    // Check if GIPHY API key is configured first
    if (!process.env.GIPHY_API_KEY) {
      console.error('GIPHY_API_KEY environment variable is missing');
      return NextResponse.json(
        { 
          error: 'GIPHY_API_KEY environment variable is not configured',
          media: [] // Return empty media array so the app can continue without visuals
        },
        { status: 500 }
      );
    }
    
    const body = await request.json() as FetchMediaRequest;
    const { script, limit = 1, itemsPerSlide = 2 } = body;
    
    if (!script) {
      return NextResponse.json(
        { error: 'Script is required' },
        { status: 400 }
      );
    }
    
    console.log(`Fetching media for script with ${itemsPerSlide} items per slide`);
    console.log(`Script length: ${script.length} characters`);
    
    // Fetch media for the script with the specified itemsPerSlide
    const media = await fetchMediaForScript(script, itemsPerSlide);
    
    // Count the total number of media items
    const totalItems = media.reduce((sum, items) => sum + items.length, 0);
    
    console.log(`Successfully fetched ${totalItems} media items across ${media.length} paragraphs`);
    
    // Return the fetched media
    return NextResponse.json({ 
      media,
      totalItems,
      message: `Media fetched successfully (${totalItems} items)` 
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    
    // Detailed error response
    let errorMessage = `Failed to fetch media: ${error instanceof Error ? error.message : String(error)}`;
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n') || 'No stack trace',
      };
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        media: [] // Return empty media array so the app can continue without visuals
      },
      { status: 500 }
    );
  }
} 
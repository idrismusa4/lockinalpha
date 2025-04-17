import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
    
    if (!GIPHY_API_KEY) {
      return NextResponse.json({
        error: 'GIPHY_API_KEY is not set in environment variables',
        env_keys: Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY')).join(', ')
      }, { status: 500 });
    }
    
    // Make a test request to the Giphy API
    const query = 'test';
    const url = `https://api.giphy.com/v1/gifs/search?q=${query}&api_key=${GIPHY_API_KEY}&limit=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({
        error: `Giphy API error: ${response.status} ${response.statusText}`,
        apiKey: GIPHY_API_KEY.substring(0, 4) + '...' + GIPHY_API_KEY.substring(GIPHY_API_KEY.length - 4)
      }, { status: response.status });
    }
    
    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return NextResponse.json({
        error: 'No GIFs found in Giphy API response',
        response: data
      }, { status: 404 });
    }
    
    // Return success with the first GIF URL
    return NextResponse.json({
      success: true,
      apiKey: GIPHY_API_KEY.substring(0, 4) + '...' + GIPHY_API_KEY.substring(GIPHY_API_KEY.length - 4),
      gifUrl: data.data[0].images?.original?.url || null
    });
  } catch (error) {
    return NextResponse.json({
      error: `Error testing Giphy API: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}
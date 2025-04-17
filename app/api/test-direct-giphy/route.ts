import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
    
    if (!GIPHY_API_KEY) {
      return NextResponse.json({
        error: 'GIPHY_API_KEY environment variable is not set',
        envKeys: Object.keys(process.env).filter(key => 
          !key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('KEY')
        )
      }, { status: 500 });
    }
    
    // Use a very simple query
    const query = 'cat';
    const apiUrl = `https://api.giphy.com/v1/gifs/search?q=${query}&api_key=${GIPHY_API_KEY}&limit=1&rating=g`;
    
    console.log(`Direct test to Giphy API: ${apiUrl.replace(GIPHY_API_KEY, 'API_KEY_HIDDEN')}`);
    
    // Minimal fetch options
    const response = await fetch(apiUrl, { 
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`Giphy direct test response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // Try to get the error text
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Could not read error response';
      }
      
      return NextResponse.json({
        error: `Giphy API error: ${response.status} ${response.statusText}`,
        errorText,
        apiKey: GIPHY_API_KEY.substring(0, 4) + '...' + GIPHY_API_KEY.substring(GIPHY_API_KEY.length - 4)
      }, { status: response.status });
    }
    
    // Get the full response for direct inspection
    const data = await response.json();
    
    // Extract just the basics for a cleaner response
    const gifData = data.data && data.data.length > 0 ? {
      id: data.data[0].id,
      title: data.data[0].title,
      url: data.data[0].images?.original?.url,
      preview: data.data[0].images?.fixed_width?.url,
    } : null;
    
    return NextResponse.json({
      success: true,
      meta: data.meta,
      gifData,
      fullResponse: data // Include the full response for inspection
    });
    
  } catch (error) {
    console.error('Error in direct Giphy test:', error);
    
    return NextResponse.json({
      error: `Error testing Giphy API directly: ${error instanceof Error ? error.message : String(error)}`,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined
    }, { status: 500 });
  }
} 
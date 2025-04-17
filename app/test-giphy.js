// Check if Giphy API key is available and working
require('dotenv').config({ path: '.env.local' });

async function testGiphyApi() {
  const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
  
  console.log('Environment check:');
  console.log('GIPHY_API_KEY exists:', !!GIPHY_API_KEY);
  
  if (!GIPHY_API_KEY) {
    console.error('GIPHY_API_KEY is not set in the .env.local file');
    return;
  }
  
  try {
    // Make a test request to the Giphy API
    const query = 'test';
    const url = `https://api.giphy.com/v1/gifs/search?q=${query}&api_key=${GIPHY_API_KEY}&limit=1`;
    
    console.log('Making request to Giphy API...');
    const response = await fetch(url);
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('Giphy API error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    console.log('Giphy API response:');
    console.log('Data exists:', !!data);
    console.log('Results count:', data.data?.length || 0);
    
    if (data.data && data.data.length > 0) {
      const gif = data.data[0];
      console.log('First GIF URL:', gif.images?.original?.url || 'No URL found');
    }
  } catch (error) {
    console.error('Error testing Giphy API:', error);
  }
}

// Run the test
testGiphyApi(); 
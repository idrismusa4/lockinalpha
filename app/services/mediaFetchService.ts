/**
 * Service to fetch media assets based on keywords and context
 */

import { extractVisualSubject } from './keywordExtractionService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Media types supported by the service
export type MediaType = 'gif' | 'lottie' | 'illustration' | 'icon' | 'video' | 'image';

// Media source options
export type MediaSource = 'giphy' | 'tenor' | 'unsplash' | 'custom';

// Media fetch options
export interface MediaFetchOptions {
  // The text content to extract keywords from
  text: string;
  
  // Manually specified keywords (optional)
  keywords?: string[];
  
  // Type of media to fetch
  mediaType?: 'gif' | 'image';
  
  // Source of media
  mediaSource?: MediaSource;
  
  // Number of results to return
  limit?: number;
  
  // Media content rating
  rating?: 'g' | 'pg' | 'pg-13' | 'r';
  
  // Custom context to improve search relevance
  context?: string;
}

// Fetched media result interface
export type FetchedMedia = {
  type: 'image' | 'gif';
  url: string;
  keywords: string[];
};

// Giphy API response interfaces
interface GiphyImage {
  url: string;
  width: string;
  height: string;
}

interface GiphyImages {
  original: GiphyImage;
  fixed_width: GiphyImage;
}

interface GiphyData {
  id: string;
  title: string;
  images: GiphyImages;
}

interface GiphyResponse {
  data: GiphyData[];
  meta: {
    status: number;
    msg: string;
  };
}

// API Key from environment variable
const GIPHY_API_KEY = process.env.GIPHY_API_KEY || 'YOUR_API_KEY';

/**
 * Construct an optimal search query for Giphy based on keywords, context, and emotion
 */
function constructGiphyQuery(options: MediaFetchOptions): string {
  // If keywords are provided, use them
  if (options.keywords && options.keywords.length > 0) {
    return options.keywords.join(' ');
  }
  
  // Otherwise, extract visual subject from the text
  const { subject, description, action, emotion } = extractVisualSubject(options.text);
  
  // Construct a query string combining the most relevant information
  if (description && description.length > 0) {
    // If we have a good description, use it
    return description;
  } else if (subject) {
    // Build query from subject plus action/emotion
    let query = subject;
    
    if (action && action !== subject) {
      query += ` ${action}`;
    }
    
    if (emotion && emotion !== subject && emotion !== action) {
      query = `${emotion} ${query}`;
    }
    
    return query;
  }
  
  // Fallback to the first 10 words of the text
  return options.text.split(' ').slice(0, 10).join(' ');
}

/**
 * Fetch GIFs from Giphy API based on keywords
 */
export async function fetchGifsFromGiphy(options: MediaFetchOptions): Promise<FetchedMedia[]> {
  try {
    const query = constructGiphyQuery(options);
    const limit = options.limit || 1;
    const rating = options.rating || 'g';
    
    console.log(`Fetching GIFs from Giphy with query: "${query}", limit: ${limit}`);
    
    // Make API request to Giphy
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}&api_key=${GIPHY_API_KEY}&limit=${limit}&rating=${rating}`
    );
    
    if (!response.ok) {
      throw new Error(`Giphy API error: ${response.status}`);
    }
    
    const data = await response.json() as GiphyResponse;
    
    // Validate response
    if (!data.data || !Array.isArray(data.data)) {
      console.error('Invalid Giphy API response:', data);
      return [];
    }
    
    // Check if we got any results
    if (data.data.length === 0) {
      console.log(`No GIFs found for query: "${query}"`);
      return [];
    }
    
    // Map the Giphy response to our FetchedMedia interface
    const results = data.data.map((gif: GiphyData) => {
      try {
        // Use default values if any properties are missing
        const width = gif.images?.original?.width ? parseInt(gif.images.original.width) : 480;
        const height = gif.images?.original?.height ? parseInt(gif.images.original.height) : 270;
        
        return {
          type: 'gif' as const,
          url: gif.images?.original?.url || '',
          keywords: query.split(' ')
        };
      } catch (itemError) {
        console.error('Error processing Giphy item:', itemError);
        // Return a placeholder on error
        return {
          type: 'gif' as const,
          url: '',
          keywords: []
        };
      }
    }).filter(item => item.url); // Filter out items with empty URLs
    
    console.log(`Successfully fetched ${results.length} GIFs from Giphy`);
    return results;
  } catch (error) {
    console.error('Error fetching GIFs from Giphy:', error);
    return [];
  }
}

/**
 * Main function to fetch media based on options
 */
export async function fetchMedia(options: MediaFetchOptions): Promise<FetchedMedia[]> {
  // Default to GIF if no media type is specified
  const mediaType = options.mediaType || 'gif';
  const mediaSource = options.mediaSource || 'giphy';
  
  // For now, we only support GIFs from Giphy
  if (mediaType === 'gif' && mediaSource === 'giphy') {
    return fetchGifsFromGiphy(options);
  }
  
  // Placeholder for future media sources
  console.warn(`Unsupported media type (${mediaType}) or source (${mediaSource})`);
  return [];
}

/**
 * Process a script to extract keywords and fetch appropriate media for each paragraph
 * @param script The script text
 * @param itemsPerSlide Number of media items to fetch per slide (default: 1)
 * @returns Array of fetched media items for each paragraph
 */
export async function fetchMediaForScript(script: string): Promise<FetchedMedia[][]> {
  try {
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Extract scene keywords
    const prompt = `Analyze the following script and extract 3-5 key visual keywords for each paragraph/scene. 
    Focus on concrete, visualizable concepts that would make good GIFs or images.
    Return the keywords as a JSON array of arrays, where each inner array contains keywords for one scene.
    
    Script:
    ${script}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const keywordsArray: string[][] = JSON.parse(response.text());

    // Fetch media for each scene
    const mediaPromises = keywordsArray.map(async (sceneKeywords) => {
      const mediaItems: FetchedMedia[] = [];
      
      // Try to fetch a GIF first
      try {
        const gifUrl = await fetchGif(sceneKeywords);
        if (gifUrl) {
          const gifItem: FetchedMedia = {
            type: 'gif' as const,
            url: gifUrl,
            keywords: sceneKeywords
          };
          mediaItems.push(gifItem);
        }
      } catch (error) {
        console.warn('Failed to fetch GIF:', error);
      }

      // If no GIF found, try to fetch an image
      if (mediaItems.length === 0) {
        try {
          const imageUrl = await fetchImage(sceneKeywords);
          if (imageUrl) {
            const imageItem: FetchedMedia = {
              type: 'image' as const,
              url: imageUrl,
              keywords: sceneKeywords
            };
            mediaItems.push(imageItem);
          }
        } catch (error) {
          console.warn('Failed to fetch image:', error);
        }
      }

      return mediaItems;
    });

    return await Promise.all(mediaPromises);
  } catch (error) {
    console.error('Error fetching media:', error);
    throw new Error('Failed to fetch media for script');
  }
}

async function fetchGif(keywords: string[]): Promise<string | null> {
  try {
    const query = keywords.join(' ');
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=1`
    );

    if (!response.ok) {
      throw new Error('Giphy API request failed');
    }

    const data = await response.json();
    return data.data[0]?.images?.original?.url || null;
  } catch (error) {
    console.error('Error fetching GIF:', error);
    return null;
  }
}

async function fetchImage(keywords: string[]): Promise<string | null> {
  try {
    const query = keywords.join(' ');
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`,
      {
        headers: {
          'Authorization': `Client-ID ${process.env.UNSPLASH_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Unsplash API request failed');
    }

    const data = await response.json();
    return data.results[0]?.urls?.regular || null;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

export async function fetchGifs(keywords: string[]): Promise<FetchedMedia[]> {
  try {
    const gifs = await Promise.all(
      keywords.map(async (keyword) => {
        const response = await fetch(
          `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${encodeURIComponent(keyword)}&limit=1&rating=g`
        );
        const data = await response.json();
        return {
          type: 'gif' as const,
          url: data.data[0]?.images?.original?.url || '',
          keywords: [keyword]
        };
      })
    );
    return gifs;
  } catch (error) {
    console.error('Error fetching GIFs:', error);
    return [];
  }
} 
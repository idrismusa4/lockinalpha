/**
 * Service to fetch media assets based on keywords and context
 */

import { extractVisualSubject } from './keywordExtractionService';

// Media types supported by the service
export type MediaType = 'gif' | 'lottie' | 'illustration' | 'icon' | 'video';

// Media source options
export type MediaSource = 'giphy' | 'tenor' | 'unsplash' | 'custom';

// Media fetch options
export interface MediaFetchOptions {
  // The text content to extract keywords from
  text: string;
  
  // Manually specified keywords (optional)
  keywords?: string[];
  
  // Type of media to fetch
  mediaType?: MediaType;
  
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
export interface FetchedMedia {
  id: string;
  url: string;
  previewUrl?: string;
  width: number;
  height: number;
  type: MediaType;
  source: MediaSource;
  title?: string;
  keywords: string[];
}

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
          id: gif.id || `giphy-${Date.now()}`,
          url: gif.images?.original?.url || '',
          previewUrl: gif.images?.fixed_width?.url || '',
          width: isNaN(width) ? 480 : width,
          height: isNaN(height) ? 270 : height,
          type: 'gif' as MediaType,
          source: 'giphy' as MediaSource,
          title: gif.title || '',
          keywords: query.split(' ')
        };
      } catch (itemError) {
        console.error('Error processing Giphy item:', itemError);
        // Return a placeholder on error
        return {
          id: `giphy-error-${Date.now()}`,
          url: '',
          width: 480,
          height: 270,
          type: 'gif' as MediaType,
          source: 'giphy' as MediaSource,
          title: 'Error',
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
export async function fetchMediaForScript(script: string, itemsPerSlide: number = 1): Promise<FetchedMedia[][]> {
  // Parse the script using the markdown parser
  const { paragraphs } = await import('../remotion/utils/parser').then(m => m.parseMarkdown(script));
  
  // Fetch media for each paragraph
  const mediaPromises = paragraphs.map(async (paragraph) => {
    const mediaOptions: MediaFetchOptions = {
      text: paragraph,
      mediaType: 'gif',
      mediaSource: 'giphy',
      limit: itemsPerSlide, // Fetch multiple items if requested
      rating: 'g'
    };
    
    return fetchMedia(mediaOptions);
  });
  
  // Wait for all media fetching to complete
  return Promise.all(mediaPromises);
} 
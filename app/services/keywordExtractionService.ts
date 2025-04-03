/**
 * Service to extract and process keywords from scripts for media fetching
 */

import { parseMarkdown } from '../remotion/utils/parser';

// Define types for keyword extraction
export interface KeywordExtractionOptions {
  text: string;
  limit?: number;
  excludeWords?: string[];
  includeEntities?: boolean;
  includeEmotions?: boolean;
}

export interface KeywordResult {
  keyword: string;
  weight: number;
  type: 'concept' | 'entity' | 'emotion' | 'action';
}

export interface SceneKeywords {
  mainConcept: string;
  keywords: KeywordResult[];
  entities: string[];
  emotions: string[];
  context: string;
}

// Common words to exclude from keyword extraction
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 
  'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 
  'must', 'can', 'could', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'this', 'that', 'these', 'those', 'there', 'their', 'of', 'in'
]);

// Common entities (people, places, objects) indicator words
const ENTITY_INDICATORS = [
  'people', 'person', 'man', 'woman', 'child', 'building', 'house', 'car', 
  'animal', 'plant', 'tree', 'mountain', 'ocean', 'river', 'city', 'country'
];

// Emotion words that might be relevant for media selection
const EMOTION_WORDS = [
  'happy', 'sad', 'angry', 'excited', 'nervous', 'anxious', 'calm', 'peaceful',
  'frustrated', 'joyful', 'depressed', 'enthusiastic', 'bored', 'surprised',
  'confused', 'afraid', 'proud', 'confident', 'embarrassed', 'grateful',
  'love', 'hate', 'fear', 'hope', 'disappointment', 'satisfaction'
];

// Action words that might be relevant for animations
const ACTION_WORDS = [
  'run', 'walk', 'jump', 'fly', 'swim', 'climb', 'fall', 'rise', 'dance', 
  'sing', 'talk', 'speak', 'shout', 'whisper', 'eat', 'drink', 'sleep', 
  'build', 'create', 'destroy', 'break', 'fix', 'open', 'close', 'start', 
  'stop', 'increase', 'decrease', 'grow', 'shrink'
];

/**
 * Extract keywords from a text segment
 * @param options Options for keyword extraction
 * @returns Array of extracted keywords with weights
 */
export function extractKeywords(options: KeywordExtractionOptions): KeywordResult[] {
  const { 
    text, 
    limit = 5, 
    excludeWords = [], 
    includeEntities = true, 
    includeEmotions = true 
  } = options;

  // Remove punctuation and split into words
  const words = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .split(/\s+/);
  
  // Create a map to count word frequency
  const wordCounts = new Map<string, number>();
  
  // Process each word
  words.forEach(word => {
    // Skip stop words and excluded words
    if (STOP_WORDS.has(word) || excludeWords.includes(word) || word.length <= 2) {
      return;
    }
    
    // Increment count for this word
    const count = wordCounts.get(word) || 0;
    wordCounts.set(word, count + 1);
  });
  
  // Convert to array and sort by frequency
  const sortedWords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => {
      // Determine word type
      let type: 'concept' | 'entity' | 'emotion' | 'action' = 'concept';
      
      if (includeEntities && ENTITY_INDICATORS.includes(word)) {
        type = 'entity';
      } else if (includeEmotions && EMOTION_WORDS.includes(word)) {
        type = 'emotion';
      } else if (ACTION_WORDS.includes(word)) {
        type = 'action';
      }
      
      return {
        keyword: word,
        weight: count / words.length,
        type
      };
    });
  
  // Return the top keywords based on limit
  return sortedWords.slice(0, limit);
}

/**
 * Process a script to extract keywords for each scene/paragraph
 * @param script The script text to process
 * @returns Array of scene keywords for each paragraph
 */
export function extractSceneKeywords(script: string): SceneKeywords[] {
  // Parse the script using the existing markdown parser
  const { paragraphs } = parseMarkdown(script);
  
  // Process each paragraph as a scene
  return paragraphs.map(paragraph => {
    // Extract basic keywords
    const keywords = extractKeywords({ 
      text: paragraph,
      limit: 10
    });
    
    // Extract entities
    const entities = keywords
      .filter(k => k.type === 'entity')
      .map(k => k.keyword);
    
    // Extract emotions
    const emotions = keywords
      .filter(k => k.type === 'emotion')
      .map(k => k.keyword);
    
    // Determine the main concept (highest weighted non-emotion, non-entity)
    const mainConcept = keywords.find(k => 
      k.type === 'concept' || k.type === 'action'
    )?.keyword || '';
    
    // Create a context string that combines the most important elements
    const topKeywords = keywords.slice(0, 3).map(k => k.keyword);
    const context = topKeywords.join(' ');
    
    return {
      mainConcept,
      keywords,
      entities,
      emotions,
      context
    };
  });
}

/**
 * Enhanced keyword extraction that attempts to identify the visual subject of a scene
 * @param text The text to analyze
 * @returns An object with the main visual subject and supporting keywords
 */
export function extractVisualSubject(text: string): { 
  subject: string; 
  description: string;
  action: string;
  emotion: string;
} {
  // Extract all keywords first
  const keywords = extractKeywords({ 
    text, 
    limit: 15,
    includeEntities: true,
    includeEmotions: true
  });
  
  // Find the main entity or subject
  let subject = keywords.find(k => k.type === 'entity')?.keyword || '';
  
  // If no entity is found, use the highest weighted concept
  if (!subject) {
    subject = keywords.find(k => k.type === 'concept')?.keyword || '';
  }
  
  // Find an action if present
  const action = keywords.find(k => k.type === 'action')?.keyword || '';
  
  // Find an emotion if present
  const emotion = keywords.find(k => k.type === 'emotion')?.keyword || '';
  
  // Create a descriptive phrase using the subject and other keywords
  let description = subject;
  
  // Add action if available
  if (action && action !== subject) {
    description = `${description} ${action}`;
  }
  
  // Add emotion as a qualifier if available and not already included
  if (emotion && emotion !== subject && emotion !== action) {
    description = `${emotion} ${description}`;
  }
  
  // If we still have a limited description, add more context from top keywords
  if (description.split(' ').length < 3) {
    const additionalKeywords = keywords
      .filter(k => k.keyword !== subject && k.keyword !== action && k.keyword !== emotion)
      .slice(0, 2)
      .map(k => k.keyword);
      
    if (additionalKeywords.length > 0) {
      description = `${description} ${additionalKeywords.join(' ')}`;
    }
  }
  
  return {
    subject,
    description,
    action,
    emotion
  };
} 
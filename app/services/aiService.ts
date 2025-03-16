// import axios from 'axios';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

interface GenerateScriptParams {
  text: string;
  topic?: string;
  duration: number;
  style: 'formal' | 'casual' | 'technical' | 'simplified' | 'storytelling';
}

/**
 * Generate a lecture script using Google Gemini
 */
export async function generateScript(params: GenerateScriptParams): Promise<string> {
  return generateWithGemini(params);
}

/**
 * Generate a script using Google Gemini API
 */
async function generateWithGemini({ text, topic, duration, style }: GenerateScriptParams): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Google Gemini API key not found');
    }

    const prompt = createPrompt(text, style, topic, duration);

    // Initialize Google Generative AI with your API key
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    console.log('Sending request to Gemini API...');
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();
    
    console.log('Gemini API response received successfully');
    
    return generatedText;
  } catch (error) {
    console.error('Error generating script with Gemini:', error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check if the error is related to the API key
      if (error.message.includes('API key')) {
        console.error('API KEY ERROR: Check that your GOOGLE_GEMINI_API_KEY is valid');
      }
      
      // Check for rate limiting or quota issues
      if (error.message.includes('quota') || error.message.includes('rate')) {
        console.error('QUOTA ERROR: You may have exceeded your Gemini API quota or rate limits');
      }
    }
    
    // If we get an error, use the fallback
    return generateScriptFallback({ text, topic, duration, style });
  }
}

/**
 * Create a contextually adaptive prompt for the AI model
 */
function createPrompt(
  text: string,
  style: 'formal' | 'casual' | 'technical' | 'simplified' | 'storytelling',
  topic?: string,
  duration: number = 5
): string {
  const estimatedWordCount = duration * 150;

  let intro = '';
  let formatInstructions = `
- Use a clear and structured explanation.
- Keep sentences natural and fluid.
- Avoid buzzwords or unnecessary filler.
- Organize content logically with appropriate breaks.
`;

  switch (style) {
    case 'formal':
      intro = `Provide a structured and well-articulated explanation of the topic, maintaining a professional and academic tone.`;
      formatInstructions += `- Use precise language and well-structured arguments.
- Maintain a professional yet engaging tone.
- Provide clear section headers and subheadings.`;
      break;

    case 'casual':
      intro = `Explain the topic as if you're tutoring a friend, keeping it natural and easygoing, without being overly structured.`;
      formatInstructions += `- Use simple, direct language without jargon.
- Write as if speaking to a student in a one-on-one session.
- Avoid formal phrasing; make it feel conversational.`;
      break;

    case 'technical':
      intro = `Provide an in-depth and highly technical breakdown of the topic, including relevant equations, frameworks, or methodologies where applicable.`;
      formatInstructions += `- Assume the audience has a background in the subject.
- Include real-world applications and detailed concepts.
- Use precise terminology and step-by-step breakdowns.`;
      break;

    case 'simplified':
      intro = `Break down the topic in the simplest way possible, assuming the reader has no prior knowledge. Use analogies or everyday examples to make it more relatable.`;
      formatInstructions += `- Avoid technical jargon and explain terms simply.
- Relate concepts to familiar, everyday experiences.
- Use clear, easy-to-follow explanations.`;
      break;

    case 'storytelling':
      intro = `Explain the topic through a compelling narrative, using an engaging story or historical context to make it interesting and easy to follow.`;
      formatInstructions += `- Integrate the topic into an engaging story or example.
- Make the explanation flow naturally within the story.
- Keep it interesting but ensure all key points are covered.`;
      break;
  }

  return `You are a knowledgeable tutor creating a lecture script for a video.

**Objective:** Explain the following topic in a ${style} manner.

**Topic Details:**
${topic ? `- Focus on: ${topic}` : ''}
- Core Content: 
${text}

**Requirements:**
- Target duration: ${duration} minutes (~${estimatedWordCount} words).
${formatInstructions}

**Tone & Style:** ${intro}

**Output Format:**
- Use **#** for the title.
- Use **##** for section breaks.
- Structure logically with clear explanations.

Provide a detailed script that can be used as a spoken lecture.`;
}

/**
 * Fallback function for generating a script locally
 */
export function generateScriptFallback(params: GenerateScriptParams): string {
  const { text, topic = '', duration = 5, style } = params;
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0).slice(0, 10);

  let title = paragraphs[0]?.split('.')[0]?.trim() || 'Understanding the Topic';
  if (topic) {
    title = `Understanding ${topic}`;
  }

  const paragraphsToUse = Math.min(Math.round(duration / 2) + 2, paragraphs.length);
  
  let introduction = '';

  switch (style) {
    case 'formal':
      introduction = 'Let us explore this topic with a structured and well-articulated approach.';
      break;
    case 'casual':
      introduction = 'Alright, let\'s break this down in a way that makes sense.';
      break;
    case 'technical':
      introduction = 'We will analyze this concept in a detailed, step-by-step manner.';
      break;
    case 'simplified':
      introduction = 'Think of this like explaining to a complete beginner. Let\'s break it down easily.';
      break;
    case 'storytelling':
      introduction = 'Imagine a world where this concept plays a key role...';
      break;
    default:
      introduction = 'Let\'s explore this topic together.';
  }

  return `# ${title}

${introduction}

${paragraphs.slice(1, 3).join('\n\n')}

## Key Points

${paragraphs.slice(3, 3 + paragraphsToUse).join('\n\n')}

## Additional Information

${paragraphs.slice(3 + paragraphsToUse, 6 + paragraphsToUse).join('\n\n') || 'There are more details to explore beyond this introduction.'}

## Summary

${paragraphs.slice(6 + paragraphsToUse, 8 + paragraphsToUse).join('\n\n') || 'We\'ve covered the main ideas here. Hope this helps!'}`;
}

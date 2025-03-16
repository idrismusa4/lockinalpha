import { NextResponse } from 'next/server';
import { extractTextFromDocument } from '../../services/documentService';
import { generateScript, generateScriptFallback } from '../../services/aiService';

// Define valid style types to match aiService
const validStyles = ['formal', 'casual', 'technical', 'simplified', 'storytelling'] as const;
type StyleType = typeof validStyles[number];

export async function POST(request: Request) {
  try {
    const { documentUrl, documentName, topic, duration, style } = await request.json();
    
    if (!documentUrl || !documentName) {
      return NextResponse.json(
        { error: 'Document URL and name are required' },
        { status: 400 }
      );
    }
    
    // Validate style parameter
    const validatedStyle = validStyles.includes(style as StyleType) 
      ? style as StyleType 
      : 'formal'; // Default to formal if invalid style provided
    
    // Extract text from the uploaded document
    let extractedText;
    try {
      extractedText = await extractTextFromDocument(documentUrl, documentName);
    } catch (error) {
      console.error('Error extracting document text:', error);
      return NextResponse.json(
        { error: `Failed to extract text from document: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      );
    }
    
    // Generate script using AI service
    let generatedScript;
    try {
      // The generateScript function now handles fallback internally
      generatedScript = await generateScript({
        text: extractedText,
        topic,
        duration: duration || 5,
        style: validatedStyle
      });
    } catch (error) {
      // This is now a last resort fallback in case the internal fallback fails
      console.error('Error in script generation with all fallbacks:', error);
      
      // Use the local generation as a last resort
      generatedScript = generateScriptFallback({
        text: extractedText,
        topic,
        duration: duration || 5,
        style: validatedStyle
      });
      
      // Log that we're using the last resort fallback
      console.log("Using last resort fallback for script generation");
    }
    
    // Always return a 200 response with the script
    // Since we have a fallback mechanism, this should always work
    return NextResponse.json({ script: generatedScript });
  } catch (error) {
    console.error('Unexpected error in script generation:', error);
    
    // Return a generic script to avoid a 500 error
    const genericScript = `# Error Generating Script\n\nThere was an error generating your script. Please try again later or with different content.`;
    
    return NextResponse.json({ 
      script: genericScript,
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`
    });
  }
} 
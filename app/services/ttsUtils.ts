/**
 * Splits a long text into chunks suitable for TTS processing
 * ElevenLabs has limits on input text length
 */
export function splitTextForTTS(text: string, maxChunkLength = 5000): string[] {
  if (text.length <= maxChunkLength) {
    return [text];
  }
  
  const chunks: string[] = [];
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    // Find a good breakpoint (sentence ending or paragraph)
    let endIndex = currentIndex + maxChunkLength;
    if (endIndex >= text.length) {
      endIndex = text.length;
    } else {
      // Try to find a sentence end
      const possibleBreak = text.lastIndexOf('. ', endIndex);
      if (possibleBreak > currentIndex && possibleBreak > endIndex - 200) {
        endIndex = possibleBreak + 1; // Include the period
      } else {
        // Try to find a paragraph break
        const paragraphBreak = text.lastIndexOf('\n\n', endIndex);
        if (paragraphBreak > currentIndex && paragraphBreak > endIndex - 200) {
          endIndex = paragraphBreak;
        }
      }
    }
    
    chunks.push(text.substring(currentIndex, endIndex).trim());
    currentIndex = endIndex;
  }
  
  return chunks;
} 
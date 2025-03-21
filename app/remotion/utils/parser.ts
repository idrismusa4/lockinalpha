/**
 * Parses a markdown string into a title and paragraphs
 * @param markdown The markdown string to parse
 * @returns An object with title and paragraphs
 */
export function parseMarkdown(markdown: string): { title: string; paragraphs: string[] } {
  // Default title if none is found
  let title = "LockIn Video Lecture";
  
  // Split the markdown into lines
  const lines = markdown.split('\n');
  
  // Find the title - either the first line, or the first line that starts with #
  const titleLine = lines.find(line => line.trim().startsWith('#')) || lines[0];
  
  if (titleLine) {
    // Remove any markdown header markers
    title = titleLine.replace(/^#+\s*/, '').trim();
  }
  
  // Split the markdown into paragraphs - non-empty lines separated by empty lines
  const paragraphs: string[] = [];
  let currentParagraph = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip the title line
    if (line === titleLine.trim()) {
      continue;
    }
    
    if (line === '') {
      // End of a paragraph
      if (currentParagraph !== '') {
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      }
    } else {
      // Add to current paragraph
      if (currentParagraph !== '') {
        currentParagraph += ' ';
      }
      currentParagraph += line;
    }
  }
  
  // Add the last paragraph if there is one
  if (currentParagraph !== '') {
    paragraphs.push(currentParagraph);
  }
  
  // If we didn't find any paragraphs, create a single one from the content
  if (paragraphs.length === 0) {
    // Filter out the title line and create a paragraph from the rest
    const contentLines = lines.filter(line => line.trim() !== titleLine.trim());
    if (contentLines.length > 0) {
      paragraphs.push(contentLines.join(' '));
    } else {
      paragraphs.push("No content available.");
    }
  }
  
  // Process special markdown elements in each paragraph
  const processedParagraphs = paragraphs.map(para => {
    // Process bold text
    para = para.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Process italic text
    para = para.replace(/\*(.*?)\*/g, '$1');
    
    // Process links
    para = para.replace(/\[(.*?)\]\((.*?)\)/g, '$1');
    
    // Remove list markers
    para = para.replace(/^[*-]\s+/g, '');
    para = para.replace(/^\d+\.\s+/g, '');
    
    return para;
  });
  
  return {
    title,
    paragraphs: processedParagraphs,
  };
}

/**
 * Detects if a paragraph contains data that should be visualized
 * @param text The text to analyze
 * @returns True if the text contains data that should be visualized
 */
export function shouldVisualizeData(text: string): boolean {
  const dataIndicators = [
    'percent', '%', 'statistics', 'data', 'numbers',
    'increase', 'decrease', 'growth', 'reduction',
    'chart', 'graph', 'figure', 'plot',
    'analysis', 'trend', 'comparison'
  ];
  
  return dataIndicators.some(indicator => 
    text.toLowerCase().includes(indicator)
  );
}

/**
 * Suggests a pose for the stickman based on text content
 * @param text The text to analyze
 * @returns A suggested pose
 */
export function suggestStickmanPose(text: string): string {
  // Define keywords that map to specific poses
  const poseMap: Record<string, string[]> = {
    'explaining': ['explain', 'discuss', 'talk', 'describe', 'present', 'show'],
    'thinking': ['think', 'consider', 'ponder', 'question', 'wonder', 'analyze'],
    'pointing': ['point', 'indicate', 'highlight', 'refer', 'direct', 'mark'],
    'walking': ['walk', 'move', 'go', 'step', 'travel', 'progress'],
    'jumping': ['jump', 'increase', 'rise', 'grow', 'leap', 'expand'],
    'sitting': ['sit', 'rest', 'settle', 'relax', 'stay', 'position']
  };
  
  // Check for keywords in text
  for (const [pose, keywords] of Object.entries(poseMap)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
      return pose;
    }
  }
  
  // Default pose
  return 'thinking';
}

/**
 * Suggests a graph type based on text content
 * @param text The text to analyze
 * @returns A suggested graph type
 */
export function suggestGraphType(text: string): string {
  // Check for specific chart types
  if (text.toLowerCase().includes('bar') || 
      text.toLowerCase().includes('column') || 
      text.toLowerCase().includes('histogram')) {
    return 'bar';
  }
  
  if (text.toLowerCase().includes('line') || 
      text.toLowerCase().includes('trend') || 
      text.toLowerCase().includes('over time')) {
    return 'line';
  }
  
  if (text.toLowerCase().includes('pie') || 
      text.toLowerCase().includes('circle') || 
      text.toLowerCase().includes('percentage') || 
      text.toLowerCase().includes('proportion')) {
    return 'pie';
  }
  
  // Default to line chart for time-based or trend language
  if (text.toLowerCase().includes('increase') || 
      text.toLowerCase().includes('decrease') ||
      text.toLowerCase().includes('growth') ||
      text.toLowerCase().includes('change')) {
    return 'line';
  }
  
  // Default
  return 'bar';
} 
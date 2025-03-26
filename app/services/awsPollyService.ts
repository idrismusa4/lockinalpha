"use server";

import { PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandOutput } from "@aws-sdk/client-polly";
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { DEFAULT_VOICE_ID } from './voiceOptions';

// Promisify exec for async/await usage
const exec = promisify(execCallback);

// Define types for exec output
interface ExecResult {
  stdout: string;
  stderr: string;
}

// AWS Polly client configuration
const pollyClient = new PollyClient({
  region: process.env.MY_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Verifies AWS credentials by making a test request
 */
export async function verifyAwsCredentials(): Promise<boolean> {
  try {
    const command = new SynthesizeSpeechCommand({
      Text: "Test",
      VoiceId: DEFAULT_VOICE_ID,
      OutputFormat: "mp3",
    });
    
    await pollyClient.send(command);
    return true;
  } catch (error) {
    console.error("Failed to verify AWS credentials:", error);
    return false;
  }
}

/**
 * Generates a short audio preview using the selected voice
 */
export async function generateTtsPreview(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<string> {
  // Verify credentials first
  const isValid = await verifyAwsCredentials();
  if (!isValid) {
    throw new Error('AWS credentials are invalid or not configured correctly');
  }

  // Generate a unique ID for this preview
  const previewId = `preview-${Date.now()}`;
  const tmpDir = path.join(os.tmpdir(), `polly-preview`);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  const outputPath = path.join(tmpDir, `${previewId}.mp3`);
  
  // Limit preview text length to 500 characters
  const previewText = text.length > 500 
    ? text.substring(0, 500) + '...' 
    : text;
  
  // Generate the audio
  await textToSpeech(previewText, outputPath, voiceId);
  
  return outputPath;
}

/**
 * Converts text to speech using AWS Polly
 */
export async function textToSpeech(
  text: string,
  outputPath: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<string> {
  try {
    const command = new SynthesizeSpeechCommand({
      Text: text,
      VoiceId: voiceId,
      OutputFormat: "mp3",
      Engine: "neural", // Use neural engine for better quality
    });

    const response: SynthesizeSpeechCommandOutput = await pollyClient.send(command);
    
    if (!response.AudioStream) {
      throw new Error('No audio stream received from Polly');
    }

    // Convert the audio stream to a buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.AudioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Write the audio data to the output file
    fs.writeFileSync(outputPath, audioBuffer);
    
    console.log(`TTS audio saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error in text-to-speech conversion:', error);
    throw new Error(`Text-to-speech conversion failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Converts a script to speech and returns the path to the audio file
 */
export async function convertScriptToSpeech(
  script: string,
  jobId: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), `polly-${jobId}`);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  const outputPath = path.join(tmpDir, `${jobId}.mp3`);
  
  try {
    // Split script into manageable chunks
    const textChunks = splitTextForTTS(script);
    console.log(`Split script into ${textChunks.length} chunks for TTS processing`);
    
    if (textChunks.length === 1) {
      await textToSpeech(textChunks[0], outputPath, voiceId);
    } else {
      // For multiple chunks, we'll create and concatenate multiple audio files
      const chunkFiles: string[] = [];
      
      // Create audio for each chunk
      for (let i = 0; i < textChunks.length; i++) {
        const chunkPath = path.join(tmpDir, `chunk-${i}.mp3`);
        await textToSpeech(textChunks[i], chunkPath, voiceId);
        chunkFiles.push(chunkPath);
      }
      
      // Try to combine the audio files
      try {
        await combineAudioFiles(chunkFiles, outputPath);
        
        // Clean up the chunk files
        chunkFiles.forEach(file => {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        });
      } catch (combineError) {
        console.warn('Warning: Could not combine audio chunks. Using first chunk only.', combineError);
        // If combining fails, use the first chunk as fallback
        if (fs.existsSync(chunkFiles[0])) {
          fs.copyFileSync(chunkFiles[0], outputPath);
        }
      }
    }
    
    return outputPath;
  } catch (error) {
    console.error('Error converting script to speech:', error);
    throw new Error(`Script to speech conversion failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Splits text into chunks suitable for TTS processing
 */
function splitTextForTTS(text: string, maxChunkLength = 3000): string[] {
  if (text.length <= maxChunkLength) {
    return [text];
  }
  
  const chunks: string[] = [];
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    let endIndex = currentIndex + maxChunkLength;
    if (endIndex >= text.length) {
      endIndex = text.length;
    } else {
      const possibleBreak = text.lastIndexOf('. ', endIndex);
      if (possibleBreak > currentIndex && possibleBreak > endIndex - 200) {
        endIndex = possibleBreak + 1;
      } else {
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

/**
 * Combines multiple audio files using ffmpeg
 */
async function combineAudioFiles(inputFiles: string[], outputFile: string): Promise<void> {
  try {
    // Check if ffmpeg is available
    try {
      await exec('ffmpeg -version');
    } catch (ffmpegError) {
      throw new Error('FFmpeg is not available for audio file combination');
    }
    
    // Create a file list for ffmpeg
    const fileList = inputFiles.map(file => `file '${file.replace(/'/g, "'\\''")}'`).join('\n');
    const listFile = path.join(path.dirname(outputFile), 'filelist.txt');
    fs.writeFileSync(listFile, fileList);

    // Use ffmpeg to concatenate the files
    const command = `ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`;
    const { stdout, stderr }: ExecResult = await exec(command);
    
    if (stderr && !fs.existsSync(outputFile)) {
      throw new Error(`FFmpeg error: ${stderr}`);
    }

    // Clean up the list file
    if (fs.existsSync(listFile)) {
      fs.unlinkSync(listFile);
    }
  } catch (error) {
    console.error('Error combining audio files:', error);
    throw new Error(`Failed to combine audio files: ${error instanceof Error ? error.message : String(error)}`);
  }
} 
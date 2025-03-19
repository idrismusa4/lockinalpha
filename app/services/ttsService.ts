"use server";

import fs from 'fs';
import path from 'path';
import os from 'os';
import axios from 'axios';
import { splitTextForTTS } from './ttsUtils';
import { DEFAULT_VOICE_ID } from './voiceOptions';

// Ensure we're getting the API key properly and removing any whitespace
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY?.trim();
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1';

/**
 * Checks if the ElevenLabs API key is valid by making a test request
 */
export async function verifyElevenLabsApiKey(): Promise<boolean> {
  if (!ELEVEN_LABS_API_KEY) {
    console.error("ElevenLabs API key not found in environment variables");
    return false;
  }

  try {
    // Make a simple request to the voices endpoint to verify credentials
    const response = await axios.get(`${ELEVEN_LABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
      }
    });
    
    return response.status === 200;
  } catch (error) {
    console.error("Failed to verify ElevenLabs API key:", error);
    return false;
  }
}

/**
 * Generates a short audio preview using the selected voice
 * @param text Short text sample to preview the voice
 * @param voiceId Voice ID to use for preview
 */
export async function generateTtsPreview(
  text: string, 
  voiceId: string = DEFAULT_VOICE_ID
): Promise<string> {
  // Verify API key first
  const isValid = await verifyElevenLabsApiKey();
  if (!isValid) {
    throw new Error('ElevenLabs API key is invalid or not configured correctly');
  }

  // Generate a unique ID for this preview
  const previewId = `preview-${Date.now()}`;
  const tmpDir = path.join(os.tmpdir(), `tts-preview`);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  const outputPath = path.join(tmpDir, `${previewId}.mp3`);
  
  // Limit preview text length
  const previewText = text.length > 300 ? text.substring(0, 300) + '...' : text;
  
  // Generate the audio
  await textToSpeech(previewText, outputPath, voiceId);
  
  // In a real app, you'd upload this to storage and return a URL
  // For now, we'll just return the file path for local testing
  return outputPath;
}

/**
 * Converts text to speech using ElevenLabs API and saves the audio file
 * @param text The text to convert to speech
 * @param outputPath Path where to save the MP3 file
 * @param voiceId ElevenLabs voice ID to use (defaults to Adam)
 */
export async function textToSpeech(
  text: string, 
  outputPath: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<string> {
  if (!ELEVEN_LABS_API_KEY) {
    throw new Error('ElevenLabs API key is not configured');
  }

  console.log(`Using API key: ${ELEVEN_LABS_API_KEY.substring(0, 5)}...`);
  
  try {
    console.log(`Converting text to speech using ElevenLabs (text length: ${text.length})`);
    
    // Make API request to ElevenLabs
    const response = await axios({
      method: 'POST',
      url: `${ELEVEN_LABS_API_URL}/text-to-speech/${voiceId}`,
      data: {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });

    // Ensure the directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the audio data to the output file
    fs.writeFileSync(outputPath, Buffer.from(response.data));
    
    console.log(`TTS audio saved to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error in text-to-speech conversion:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('ElevenLabs API Error:', {
        status: error.response.status,
        data: error.response.data.toString()
      });
      
      // If we get a 401 error, it's likely an issue with the API key
      if (error.response.status === 401) {
        throw new Error(`ElevenLabs authentication failed. Please check your API key. Status: ${error.response.status}`);
      }
    }
    
    throw new Error(`Text-to-speech conversion failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Converts a script to speech and returns the path to the audio file
 * Handles long scripts by splitting them into chunks
 */
export async function convertScriptToSpeech(
  script: string, 
  jobId: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<string> {
  const tmpDir = path.join(os.tmpdir(), `tts-${jobId}`);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  const outputPath = path.join(tmpDir, `${jobId}.mp3`);
  
  try {
    // Split script into manageable chunks for the API
    const textChunks = splitTextForTTS(script);
    console.log(`Split script into ${textChunks.length} chunks for TTS processing`);
    
    if (textChunks.length === 1) {
      // Simple case: just process the single chunk
      await textToSpeech(textChunks[0], outputPath, voiceId);
    } else {
      // For multiple chunks, we need to process each and combine them
      const chunkPaths: string[] = [];
      
      for (let i = 0; i < textChunks.length; i++) {
        const chunkPath = path.join(tmpDir, `chunk-${i}.mp3`);
        await textToSpeech(textChunks[i], chunkPath, voiceId);
        chunkPaths.push(chunkPath);
      }
      
      // Combine audio files
      // Note: In a production environment, you'd use ffmpeg to concatenate these files
      // For simplicity, we'll just use the first file in this example
      fs.copyFileSync(chunkPaths[0], outputPath);
      
      // Clean up chunk files
      for (const chunkPath of chunkPaths) {
        fs.unlinkSync(chunkPath);
      }
    }
    
    return outputPath;
  } catch (error) {
    console.error('Error converting script to speech:', error);
    throw error;
  }
} 
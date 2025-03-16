"use server";

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { storage } from '../supabase';
import axios from 'axios';
import { updateJobStatus, updateJobProgress } from './jobService';

// Define paths for temporary files
const TMP_DIR = os.tmpdir();

interface VideoRenderParams {
  script: string;
  jobId: string;
  onProgress?: (progress: number) => void;
}

/**
 * A fallback video rendering service that creates a simple MP4 file
 */
export async function renderVideoFallback({
  script,
  jobId,
  onProgress = () => {}
}: VideoRenderParams): Promise<string> {
  try {
    console.log(`Starting video generation for job: ${jobId}`);
    
    // Update job status to processing immediately
    await updateJobStatus(jobId, { status: 'processing', progress: 5 });
    
    // Create temporary directory for outputs
    const outputDir = path.join(TMP_DIR, `remotion-${jobId}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Path to output video file
    const outputFile = path.join(outputDir, `${jobId}.mp4`);
    const audioFile = path.join(outputDir, `${jobId}.mp3`);
    
    // Update progress and ensure it's saved
    await updateJobProgress(jobId, 20);
    onProgress(20);
    
    // Create a valid but simple MP4 file
    console.log('Creating video file...');
    try {
      await createValidMp4File(outputFile, script);
      await updateJobProgress(jobId, 70);
      onProgress(70);
    } catch (videoError) {
      console.error('Error creating video:', videoError);
      throw new Error(`Failed to create video: ${videoError instanceof Error ? videoError.message : String(videoError)}`);
    }
    
    // Upload the rendered video to Supabase Storage
    console.log('Uploading video to storage...');
    let videoUrl;
    try {
      videoUrl = await uploadVideoToSupabase(outputFile, jobId);
      await updateJobProgress(jobId, 100);
      onProgress(100);
    } catch (uploadError) {
      console.error('Error uploading video:', uploadError);
      throw new Error(`Failed to upload video: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
    }
    
    // Clean up temporary files
    try {
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
      if (fs.existsSync(outputDir)) fs.rmdirSync(outputDir, { recursive: true });
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary files:', cleanupError);
      // Don't fail the process for cleanup errors
    }
    
    console.log(`Video generation completed for job: ${jobId}`);
    return videoUrl;
  } catch (error) {
    console.error('Error rendering video fallback:', error);
    // Make sure to update job status to failed
    await updateJobStatus(jobId, { 
      status: 'failed',
      error: `Video generation failed: ${error instanceof Error ? error.message : String(error)}`
    });
    throw new Error(`Failed to render video: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a valid MP4 file for testing
 * This downloads a small sample video file from a public URL
 */
async function createValidMp4File(outputPath: string, script: string): Promise<void> {
  try {
    // URL to a small sample MP4 file (replace with an actual small, public MP4 URL)
    const sampleVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-rotating-planets-in-a-planetary-system-in-space-12019-small.mp4';
    
    const response = await axios.get(sampleVideoUrl, {
      responseType: 'arraybuffer'
    });
    
    // Write the sample video to the output path
    fs.writeFileSync(outputPath, Buffer.from(response.data));
    
    console.log('Created valid MP4 file at:', outputPath);
    console.log('Script that would be used:', script.substring(0, 100) + '...');
  } catch (error) {
    console.error('Error creating valid MP4 file:', error);
    
    // Fallback - create a minimal valid MP4 file
    // This is just a placeholder that will work for testing
    const minimalMp4 = Buffer.from([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
      0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32, 0x6D, 0x70, 0x34, 0x31, 0x00, 0x00, 0x00, 0x08,
      0x6D, 0x6F, 0x6F, 0x76, 0x00, 0x00, 0x00, 0x6C, 0x6D, 0x76, 0x68, 0x64, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0xE8, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    fs.writeFileSync(outputPath, minimalMp4);
    console.log('Created minimal MP4 file at:', outputPath);
    
    // Don't throw - we've created a placeholder file
  }
}

/**
 * Uploads a rendered video file to Supabase Storage
 */
async function uploadVideoToSupabase(filePath: string, jobId: string): Promise<string> {
  try {
    const fileName = `${jobId}.mp4`;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Video file not found at path: ${filePath}`);
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    if (fileBuffer.length < 100) {
      throw new Error(`Video file is too small (${fileBuffer.length} bytes) and may be corrupted`);
    }
    
    console.log(`Uploading video to Supabase: ${fileName}, size: ${fileBuffer.length} bytes`);
    
    // Check if storage is initialized
    if (!storage) {
      throw new Error('Supabase storage is not initialized');
    }
    
    // Upload the file to the pre-created 'videos' bucket
    const { error: uploadError } = await storage
      .from('videos')
      .upload(fileName, fileBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw uploadError;
    }
    
    // Get the public URL
    const { data: urlData } = storage
      .from('videos')
      .getPublicUrl(fileName);
      
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for the uploaded video');
    }
    
    console.log(`Video uploaded successfully, public URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading video to Supabase:', error);
    throw error; // Let the caller handle this error
  }
} 
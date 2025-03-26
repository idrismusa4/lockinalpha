import { NextResponse } from 'next/server';
import { generateTtsPreview } from '@/app/services/awsPollyService';
import { storage } from '@/app/supabase';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const { text, voiceId } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }
    
    // Check AWS credentials are configured
    if (!process.env.MY_AWS_ACCESS_KEY_ID || !process.env.MY_AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials are not configured. Please set MY_AWS_ACCESS_KEY_ID and MY_AWS_SECRET_ACCESS_KEY environment variables.' },
        { status: 500 }
      );
    }
    
    try {
      // Generate the audio file (this returns a local file path)
      const audioPath = await generateTtsPreview(text, voiceId);
      
      // Read the audio file
      const audioBuffer = fs.readFileSync(audioPath);
      
      if (audioBuffer.length < 100) {
        return NextResponse.json(
          { error: 'Generated audio file is too small or empty' },
          { status: 500 }
        );
      }
      
      // Generate a unique filename
      const filename = `preview-${Date.now()}.mp3`;
      
      // Upload to Supabase storage in the 'audios' bucket
      const { error: uploadError } = await storage
        .from('audios') // Make sure this bucket exists in your Supabase project
        .upload(filename, audioBuffer, {
          contentType: 'audio/mpeg',
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Error uploading audio to Supabase:', uploadError);
        throw uploadError;
      }
      
      // Get the public URL
      const { data: urlData } = storage
        .from('audios')
        .getPublicUrl(filename);
        
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL for the preview');
      }
      
      console.log(`Audio preview uploaded successfully: ${urlData.publicUrl}`);
      
      // Clean up the temporary file
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
      
      return NextResponse.json({ 
        audioUrl: urlData.publicUrl,
        message: 'Audio preview generated successfully'
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      return NextResponse.json(
        { error: `Failed to generate preview: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 
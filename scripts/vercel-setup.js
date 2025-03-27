#!/usr/bin/env node

/**
 * This script prepares the application for Vercel deployment
 * It makes necessary adjustments for the serverless environment
 */

const fs = require('fs');
const path = require('path');

console.log('=== Vercel Deployment Setup ===');

// Check if we're in Vercel
const isVercel = process.env.VERCEL === '1';
if (!isVercel) {
  console.log('Not running in Vercel environment. Exiting.');
  process.exit(0);
}

console.log('Running in Vercel environment');

// Create public directory for static assets if it doesn't exist
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory');
}

// Create an empty video poster image if it doesn't exist
const posterPath = path.join(publicDir, 'video-poster.png');
if (!fs.existsSync(posterPath)) {
  // Create a simple blank image or copy from assets
  console.log('Creating empty video poster...');
  // This would ideally copy from an existing asset, but for simplicity:
  fs.writeFileSync(posterPath, ''); // Empty file as placeholder
  console.log('Created empty video poster file');
}

// Ensure the application knows we're in WASM mode for FFmpeg
console.log('Setting up WASM mode for FFmpeg...');
process.env.FFMPEG_WASM_MODE = 'true';

// Create or update the Remotion root file if needed
const remotionDir = path.join(process.cwd(), 'app', 'remotion');
if (!fs.existsSync(remotionDir)) {
  fs.mkdirSync(remotionDir, { recursive: true });
  console.log('Created Remotion directory');
}

const rootPath = path.join(remotionDir, 'root.tsx');
if (!fs.existsSync(rootPath)) {
  console.log('Creating Remotion root file...');
  
  const rootContent = `
import { registerRoot } from 'remotion';
import { VideoLecture } from './VideoLecture';
import { Composition } from 'remotion';

const Root = () => {
  return (
    <Composition
      id="VideoLecture"
      component={VideoLecture}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={300}
      defaultProps={{
        script: "Default script content",
        audioUrl: ""
      }}
    />
  );
};

registerRoot(Root);
`;
  
  fs.writeFileSync(rootPath, rootContent);
  console.log('Created Remotion root file');
}

// Update service code to handle Vercel's serverless environment
console.log('Checking service code for Vercel compatibility...');

// Since Vercel is serverless and FFmpeg won't work as well there,
// we log this as a warning rather than trying to modify the code
console.log('⚠️ Note: On Vercel, FFmpeg will use WASM mode which has limitations.');
console.log('⚠️ Video generation may fall back to audio-only mode in production.');

console.log('\n=== Vercel setup complete ==='); 
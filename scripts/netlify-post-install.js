#!/usr/bin/env node

/**
 * This script is designed to run after Netlify deployment,
 * installing FFmpeg for the functions runtime if possible
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('Starting Netlify post-install script for FFmpeg support...');

// Helper function to safely execute commands
function safeExec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    console.error(`Command "${command}" failed:`, error.message);
    return null;
  }
}

// Check if we're running on Netlify
const isNetlify = process.env.NETLIFY === 'true';
if (!isNetlify) {
  console.log('Not running on Netlify, skipping post-install setup.');
  process.exit(0);
}

// Attempt to set up FFmpeg in Netlify Functions environment
try {
  console.log('Checking current environment...');
  console.log(`Platform: ${os.platform()}, Architecture: ${os.arch()}`);
  
  // Determine if we can install FFmpeg
  const hasBinaryFolder = fs.existsSync('.netlify/functions-internal');
  
  if (hasBinaryFolder) {
    console.log('Netlify Functions folder found, attempting to set up FFmpeg...');
    
    // Create the bin directory if it doesn't exist
    const binDir = path.join('.netlify', 'bin');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }
    
    // Set environment variables
    const envFile = path.join('.netlify', 'functions-internal', '.env');
    let envContent = '';
    
    if (fs.existsSync(envFile)) {
      envContent = fs.readFileSync(envFile, 'utf8');
    }
    
    // Add FFmpeg path env variable if not already present
    if (!envContent.includes('NETLIFY_FFMPEG_PATH')) {
      const ffmpegPath = path.join(process.cwd(), '.netlify', 'bin', 'ffmpeg');
      console.log(`Setting NETLIFY_FFMPEG_PATH to: ${ffmpegPath}`);
      
      // Append to existing env file
      fs.appendFileSync(envFile, `\nNETLIFY_FFMPEG_PATH=${ffmpegPath}\n`);
      console.log('Environment variable added to functions runtime');
    }
    
    // Create a shell script that will reference the system FFmpeg
    const shScript = `#!/bin/sh
# This is a wrapper script for FFmpeg in Netlify Functions
# It attempts to use the system FFmpeg if available

if command -v ffmpeg >/dev/null 2>&1; then
  # System FFmpeg is available, use it
  exec ffmpeg "$@"
else
  echo "FFmpeg not found in Netlify Functions environment" >&2
  exit 1
fi
`;
    
    // Write the shell script to the bin directory
    const ffmpegWrapperPath = path.join(binDir, 'ffmpeg');
    fs.writeFileSync(ffmpegWrapperPath, shScript);
    fs.chmodSync(ffmpegWrapperPath, '755'); // Make executable
    
    console.log('FFmpeg wrapper script created successfully');
    console.log('FFmpeg setup for Netlify completed successfully.');
  } else {
    console.log('Netlify Functions folder not found, skipping FFmpeg setup.');
  }
} catch (error) {
  console.error('Error setting up FFmpeg in Netlify:', error);
  // Don't fail the build if setup fails
}

console.log('Netlify post-install script completed.');
process.exit(0); 
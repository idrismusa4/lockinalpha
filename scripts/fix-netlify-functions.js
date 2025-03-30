#!/usr/bin/env node

/**
 * This script will run after the Netlify functions are bundled to ensure
 * that our custom FFmpeg binary is available to the functions.
 */

const fs = require('fs');
const path = require('path');

console.log('Fixing Netlify function environment...');

// Check if we're running on Netlify
const isNetlify = process.env.NETLIFY === 'true';
if (!isNetlify) {
  console.log('Not running on Netlify, skipping function fix.');
  process.exit(0);
}

try {
  const netlifyDir = path.resolve(process.cwd(), '.netlify');
  const binDir = path.join(netlifyDir, 'bin');
  const ffmpegBin = path.join(binDir, 'ffmpeg');
  
  // Make sure the bin directory exists
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
    console.log(`Created bin directory at ${binDir}`);
  }
  
  // Check if the FFmpeg binary exists and is executable
  if (!fs.existsSync(ffmpegBin)) {
    // Create a shell script as a placeholder
    console.log('FFmpeg binary not found, creating placeholder script...');
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
    fs.writeFileSync(ffmpegBin, shScript);
    fs.chmodSync(ffmpegBin, '755'); // Make executable
    console.log(`Created FFmpeg wrapper script at ${ffmpegBin}`);
  } else {
    console.log(`FFmpeg binary already exists at ${ffmpegBin}`);
    // Make sure it's executable
    fs.chmodSync(ffmpegBin, '755');
  }
  
  // Try to find the functions directory
  let functionsDir = null;
  const possibleFunctionDirs = [
    path.join(netlifyDir, 'functions-internal'),
    path.join(netlifyDir, 'functions'),
    path.join(process.cwd(), '.netlify', 'functions-internal'),
    path.join(process.cwd(), '.netlify', 'functions'),
    path.join(process.env.NETLIFY_BUILD_BASE || '', '.netlify', 'functions-internal')
  ];
  
  for (const dir of possibleFunctionDirs) {
    if (fs.existsSync(dir)) {
      functionsDir = dir;
      console.log(`Found functions directory at: ${functionsDir}`);
      break;
    }
  }
  
  // Set the NETLIFY_FFMPEG_PATH environment variable in functions
  if (functionsDir) {
    const envFile = path.join(functionsDir, '.env');
    
    // Create or update the .env file
    let envContent = '';
    if (fs.existsSync(envFile)) {
      envContent = fs.readFileSync(envFile, 'utf8');
    }
    
    // Add the FFmpeg path environment variable if not already present
    if (!envContent.includes('NETLIFY_FFMPEG_PATH')) {
      fs.appendFileSync(envFile, `\nNETLIFY_FFMPEG_PATH=${ffmpegBin}\n`);
      console.log(`Added NETLIFY_FFMPEG_PATH environment variable to ${envFile}`);
    } else {
      console.log('NETLIFY_FFMPEG_PATH already set in environment');
    }
  } else {
    console.log('Netlify functions directory not found. Will create environment backup file.');
    
    // Create a backup file that can be sourced later
    const backupEnvFile = path.join(netlifyDir, 'ffmpeg-env.sh');
    fs.writeFileSync(backupEnvFile, `export NETLIFY_FFMPEG_PATH=${ffmpegBin}\n`);
    fs.chmodSync(backupEnvFile, '755');
    console.log(`Created backup environment file at ${backupEnvFile}`);
  }
  
  console.log('Netlify function environment fix completed.');
} catch (error) {
  console.error('Error fixing Netlify function environment:', error);
  // Don't fail the build
}

process.exit(0); 
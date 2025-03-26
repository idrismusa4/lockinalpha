#!/usr/bin/env node

/**
 * This script is designed to run after Netlify deployment,
 * installing FFmpeg for the functions runtime if possible
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const https = require('https');
const { createWriteStream } = require('fs');

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

// Function to download a file
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${outputPath}...`);
    
    const file = createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Download completed: ${outputPath}`);
        resolve();
      });
    }).on('error', (error) => {
      fs.unlink(outputPath, () => {}); // Delete the file if download failed
      reject(error);
    });
  });
}

// Check if we're running on Netlify
const isNetlify = process.env.NETLIFY === 'true';
if (!isNetlify) {
  console.log('Not running on Netlify, skipping post-install setup.');
  process.exit(0);
}

// Attempt to set up FFmpeg in Netlify Functions environment
async function setupFFmpeg() {
  try {
    console.log('Checking current environment...');
    console.log(`Platform: ${os.platform()}, Architecture: ${os.arch()}`);
    
    // Create the .netlify bin directory if it doesn't exist
    const netlifyDir = path.join(process.cwd(), '.netlify');
    const binDir = path.join(netlifyDir, 'bin');
    
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }
    
    // Create a function to check if ffmpeg exists and is executable
    const ffmpegTargetPath = path.join(binDir, 'ffmpeg');
    
    // Download a static build of FFmpeg for Linux
    // Using a small static build from https://johnvansickle.com/ffmpeg/
    const ffmpegUrl = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';
    const downloadPath = path.join(os.tmpdir(), 'ffmpeg-static.tar.xz');
    
    try {
      // Check if we need to download (only if ffmpeg doesn't exist)
      if (!fs.existsSync(ffmpegTargetPath)) {
        await downloadFile(ffmpegUrl, downloadPath);
        
        // Extract the tar.xz file
        console.log('Extracting FFmpeg...');
        const extractDir = path.join(os.tmpdir(), 'ffmpeg-extract');
        if (!fs.existsSync(extractDir)) {
          fs.mkdirSync(extractDir, { recursive: true });
        }
        
        // Extract the archive
        safeExec(`tar -xf ${downloadPath} -C ${extractDir}`);
        
        // Find the ffmpeg binary in the extracted folder
        const extractedDirs = fs.readdirSync(extractDir);
        if (extractedDirs.length > 0) {
          const ffmpegDir = path.join(extractDir, extractedDirs[0]);
          const ffmpegBin = path.join(ffmpegDir, 'ffmpeg');
          
          if (fs.existsSync(ffmpegBin)) {
            // Copy the ffmpeg binary to our bin directory
            fs.copyFileSync(ffmpegBin, ffmpegTargetPath);
            fs.chmodSync(ffmpegTargetPath, '755'); // Make executable
            console.log(`FFmpeg binary copied to ${ffmpegTargetPath}`);
          }
        }
      } else {
        console.log('FFmpeg binary already exists');
      }
    } catch (downloadError) {
      console.error('Error downloading or extracting FFmpeg:', downloadError);
      
      // If download fails, create a shell script instead
      console.log('Creating FFmpeg wrapper script as fallback...');
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
      fs.writeFileSync(ffmpegTargetPath, shScript);
      fs.chmodSync(ffmpegTargetPath, '755'); // Make executable
    }
    
    // Set environment variables for the functions
    try {
      // Make sure the functions-internal directory exists
      const functionsDir = path.join(netlifyDir, 'functions-internal');
      if (!fs.existsSync(functionsDir)) {
        // If it doesn't exist, we might be in a different phase of the build
        console.log('Functions directory not available yet. Environment will be set up later.');
        
        // Instead, create a setup script in the .netlify directory
        const setupScript = path.join(netlifyDir, 'setup-ffmpeg.sh');
        const scriptContent = `#!/bin/bash
# This script will be run by Netlify to set up FFmpeg environment
FFMPEG_PATH="${ffmpegTargetPath}"
ENV_FILE="\${NETLIFY_BUILD_BASE}/.netlify/functions-internal/.env"

# Ensure .env file exists
touch "\${ENV_FILE}"

# Add NETLIFY_FFMPEG_PATH to the environment
if ! grep -q "NETLIFY_FFMPEG_PATH" "\${ENV_FILE}"; then
  echo "NETLIFY_FFMPEG_PATH=\${FFMPEG_PATH}" >> "\${ENV_FILE}"
  echo "Added NETLIFY_FFMPEG_PATH to functions environment"
fi
`;
        fs.writeFileSync(setupScript, scriptContent);
        fs.chmodSync(setupScript, '755');
        console.log(`Created setup script at ${setupScript}`);
      } else {
        // Set environment variables directly
        const envFile = path.join(functionsDir, '.env');
        let envContent = '';
        
        if (fs.existsSync(envFile)) {
          envContent = fs.readFileSync(envFile, 'utf8');
        }
        
        // Add FFmpeg path env variable if not already present
        if (!envContent.includes('NETLIFY_FFMPEG_PATH')) {
          console.log(`Setting NETLIFY_FFMPEG_PATH to: ${ffmpegTargetPath}`);
          fs.appendFileSync(envFile, `\nNETLIFY_FFMPEG_PATH=${ffmpegTargetPath}\n`);
          console.log('Environment variable added to functions runtime');
        }
      }
    } catch (envError) {
      console.error('Error setting environment variables:', envError);
    }
    
    console.log('FFmpeg setup for Netlify completed successfully.');
  } catch (error) {
    console.error('Error setting up FFmpeg in Netlify:', error);
    // Don't fail the build if setup fails
  }
}

// Run the setup function
setupFFmpeg().then(() => {
  console.log('Netlify post-install script completed.');
  process.exit(0);
}).catch(error => {
  console.error('Error in post-install script:', error);
  process.exit(1);
}); 
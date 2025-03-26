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

console.log('Starting Netlify FFmpeg setup script...');
console.log('Current working directory:', process.cwd());

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
    console.log('OS Release:', os.release());
    console.log('Node version:', process.version);
    
    // Create the .netlify bin directory if it doesn't exist
    const netlifyDir = path.join(process.cwd(), '.netlify');
    const binDir = path.join(netlifyDir, 'bin');
    
    if (!fs.existsSync(netlifyDir)) {
      fs.mkdirSync(netlifyDir, { recursive: true });
      console.log(`Created .netlify directory at ${netlifyDir}`);
    }
    
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
      console.log(`Created bin directory at ${binDir}`);
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
        console.log('Extracted contents:', extractedDirs);
        
        if (extractedDirs.length > 0) {
          const ffmpegDir = path.join(extractDir, extractedDirs[0]);
          const ffmpegBin = path.join(ffmpegDir, 'ffmpeg');
          
          if (fs.existsSync(ffmpegBin)) {
            // Copy the ffmpeg binary to our bin directory
            fs.copyFileSync(ffmpegBin, ffmpegTargetPath);
            fs.chmodSync(ffmpegTargetPath, '755'); // Make executable
            console.log(`FFmpeg binary copied to ${ffmpegTargetPath}`);
            
            // Verify it's working
            try {
              const version = safeExec(`${ffmpegTargetPath} -version`);
              if (version) {
                console.log('FFmpeg version verified:', version.split('\n')[0]);
              }
            } catch (verifyError) {
              console.error('Error verifying FFmpeg:', verifyError);
            }
          } else {
            console.error(`FFmpeg binary not found at expected path: ${ffmpegBin}`);
            console.log('Contents of extracted directory:', fs.readdirSync(ffmpegDir));
          }
        } else {
          console.error('No directories found in extracted archive');
        }
      } else {
        console.log('FFmpeg binary already exists at', ffmpegTargetPath);
        // Make sure it's executable
        fs.chmodSync(ffmpegTargetPath, '755');
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
      console.log('Created FFmpeg wrapper script');
    }
    
    console.log('FFmpeg setup for Netlify completed successfully.');
  } catch (error) {
    console.error('Error setting up FFmpeg in Netlify:', error);
    // Don't fail the build if setup fails
  }
}

// Run the setup function
setupFFmpeg().then(() => {
  console.log('Netlify FFmpeg setup script completed.');
  process.exit(0);
}).catch(error => {
  console.error('Error in FFmpeg setup script:', error);
  process.exit(1);
}); 
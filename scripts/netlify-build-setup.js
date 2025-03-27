#!/usr/bin/env node

/**
 * This script sets up the Netlify build environment for FFmpeg and fonts
 * Run this as part of the build process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Netlify Build Setup for FFmpeg and Fonts ===');

// Check if we're in Netlify
if (process.env.NETLIFY !== 'true') {
  console.log('Not running in Netlify environment. Exiting.');
  process.exit(0);
}

// Create a folder to store the build output
console.log('\nCreating build directories...');
try {
  fs.mkdirSync(path.join(process.cwd(), '.netlify', 'bin'), { recursive: true });
  console.log('✅ Created .netlify/bin directory');
} catch (error) {
  console.error('Error creating directory:', error);
}

// Check FFmpeg installation
console.log('\nChecking FFmpeg installation...');
try {
  const ffmpegVersion = execSync('ffmpeg -version').toString();
  console.log('✅ FFmpeg is installed:');
  console.log(ffmpegVersion.split('\n')[0]);

  // Set the FFMPEG_PATH environment variable for the build
  process.env.FFMPEG_PATH = '/usr/bin/ffmpeg';
  process.env.NETLIFY_FFMPEG_PATH = '/usr/bin/ffmpeg';
  console.log(`✅ Set FFMPEG_PATH to ${process.env.FFMPEG_PATH}`);
} catch (error) {
  console.error('❌ FFmpeg is not installed or not found in PATH');
  console.error(error.message);
}

// Check font configuration
console.log('\nChecking font configuration...');
try {
  const fontList = execSync('fc-list | grep -i dejavu').toString();
  console.log('Available DejaVu fonts:');
  console.log(fontList);
  
  const fontPath = '/usr/share/fonts/dejavu/DejaVuSans.ttf';
  
  if (fs.existsSync(fontPath)) {
    console.log(`✅ Found DejaVu Sans font at ${fontPath}`);
    process.env.FONT_PATH = fontPath;
    process.env.FFMPEG_FONT_PATH = fontPath;
  } else {
    console.log('⚠️ DejaVu Sans font not found at expected path');
    
    // Try to find it using fc-match
    try {
      const matchedFont = execSync('fc-match "DejaVu Sans" --format="%{file}"').toString().trim();
      console.log(`✅ Found DejaVu Sans font using fc-match at ${matchedFont}`);
      process.env.FONT_PATH = matchedFont;
      process.env.FFMPEG_FONT_PATH = matchedFont;
    } catch (matchError) {
      console.error('❌ Error finding font with fc-match:', matchError.message);
    }
  }
} catch (error) {
  console.error('❌ Error checking font configuration:', error.message);
}

// Create a script that will run the Alpine font fix script after deployment
console.log('\nCreating post-deployment font fix script...');

const postDeployScript = `
#!/bin/bash
echo "Running font fix for deployed function"
cd /var/task
node scripts/alpine-font-fix.js
`;

try {
  fs.writeFileSync(
    path.join(process.cwd(), '.netlify', 'fix-fonts.sh'), 
    postDeployScript
  );
  execSync(`chmod +x ${path.join(process.cwd(), '.netlify', 'fix-fonts.sh')}`);
  console.log('✅ Created post-deployment font fix script');
} catch (error) {
  console.error('❌ Error creating post-deployment script:', error.message);
}

// Copy the font fix script to ensure it's available in the function
console.log('\nCopying font fix script to function directory...');
try {
  fs.mkdirSync(path.join(process.cwd(), '.netlify', 'functions-internal'), { recursive: true });
  fs.copyFileSync(
    path.join(process.cwd(), 'scripts', 'alpine-font-fix.js'),
    path.join(process.cwd(), '.netlify', 'functions-internal', 'alpine-font-fix.js')
  );
  fs.copyFileSync(
    path.join(process.cwd(), 'scripts', 'ffmpeg-fix-image.js'),
    path.join(process.cwd(), '.netlify', 'functions-internal', 'ffmpeg-fix-image.js')
  );
  console.log('✅ Copied fix scripts to functions directory');
} catch (error) {
  console.error('❌ Error copying scripts:', error.message);
}

// Create a temporary test to verify FFmpeg works
console.log('\nTesting FFmpeg functionality...');
try {
  execSync('node scripts/test-ffmpeg-image.js');
  console.log('✅ FFmpeg test passed');
} catch (error) {
  console.error('❌ FFmpeg test failed:', error.message);
}

console.log('\n=== Build setup complete ==='); 
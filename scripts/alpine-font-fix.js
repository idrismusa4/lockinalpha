#!/usr/bin/env node

/**
 * This script fixes the font path in Alpine Linux for FFmpeg
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== Alpine Linux Font Fix ===');
console.log(`Platform: ${os.platform()}, Release: ${os.release()}`);

// First, check if we're in Alpine Linux
let isAlpine = false;
try {
  const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
  isAlpine = osRelease.includes('Alpine');
  console.log(`Running in Alpine Linux: ${isAlpine}`);
} catch (error) {
  console.log('Not running in Alpine Linux');
}

if (!isAlpine) {
  console.log('This script is only for Alpine Linux environments.');
  process.exit(0);
}

// Install needed tools
try {
  console.log('\nMaking sure fontconfig is installed...');
  execSync('apk add --no-cache fontconfig');
  console.log('✅ fontconfig installed');
} catch (error) {
  console.log('⚠️ Error installing fontconfig:', error.message);
}

// List all installed fonts with fc-list
try {
  console.log('\nListing available fonts:');
  const fontList = execSync('fc-list | grep -i dejavu').toString();
  console.log(fontList);
} catch (error) {
  console.log('⚠️ Error listing fonts:', error.message);
}

// Check DejaVu Sans font locations
const possibleFontLocations = [
  '/usr/share/fonts/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/ttf-dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/TTF/DejaVuSans.ttf'
];

console.log('\nChecking DejaVu Sans font locations:');
let fontFound = false;
let validFontPath = '';

for (const fontPath of possibleFontLocations) {
  try {
    if (fs.existsSync(fontPath)) {
      console.log(`✅ Found at: ${fontPath}`);
      fontFound = true;
      validFontPath = fontPath;
    } else {
      console.log(`❌ Not found at: ${fontPath}`);
    }
  } catch (error) {
    console.log(`Error checking ${fontPath}:`, error.message);
  }
}

// Create symlinks if needed
if (fontFound) {
  console.log('\nCreating symlinks for compatibility:');
  try {
    // Create the directory structure if it doesn't exist
    execSync('mkdir -p /usr/share/fonts/truetype/dejavu');
    
    // Create a symlink from the found font to the expected location
    if (validFontPath !== '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf') {
      execSync(`ln -sf ${validFontPath} /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`);
      console.log('✅ Created symlink to /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');
    }
    
    // Update font cache
    execSync('fc-cache -f');
    console.log('✅ Updated font cache');
  } catch (error) {
    console.log('⚠️ Error creating symlinks:', error.message);
  }
} else {
  console.log('\n⚠️ DejaVu Sans font not found. Installing...');
  try {
    execSync('apk add --no-cache ttf-dejavu');
    console.log('✅ Installed DejaVu fonts');
    
    // Try to find the font again
    const fontListAfter = execSync('fc-list | grep -i dejavu').toString();
    console.log('Updated font list:');
    console.log(fontListAfter);
    
    // Create symlinks for compatibility
    execSync('mkdir -p /usr/share/fonts/truetype/dejavu');
    execSync('ln -sf /usr/share/fonts/dejavu/DejaVuSans.ttf /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');
    execSync('fc-cache -f');
    console.log('✅ Created symlink for compatibility');
  } catch (error) {
    console.log('⚠️ Error installing DejaVu fonts:', error.message);
  }
}

// Print environment variables that should be set
console.log('\n=== Font Fix Environment Variables ===');
console.log('Add these variables to your Docker environment:');
console.log('FONT_PATH=/usr/share/fonts/dejavu/DejaVuSans.ttf');
console.log('FONTCONFIG_PATH=/etc/fonts');

console.log('\n=== Font Fix Complete ==='); 
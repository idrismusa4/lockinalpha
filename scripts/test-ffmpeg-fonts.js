#!/usr/bin/env node

/**
 * This script tests if FFmpeg can render text with the installed fonts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== FFmpeg Font Rendering Test ===');
console.log(`Platform: ${os.platform()}, Release: ${os.release()}`);
console.log(`CPU architecture: ${os.arch()}`);

// List available fonts
try {
  console.log('\nListing available fonts:');
  const fontList = execSync('fc-list').toString();
  console.log(fontList.slice(0, 1000) + (fontList.length > 1000 ? '...' : ''));
} catch (error) {
  console.log('Error listing fonts:', error.message);
}

// Check available font directories
console.log('\nChecking font directories:');
const fontDirs = [
  '/usr/share/fonts',
  '/usr/share/fonts/truetype',
  '/usr/share/fonts/dejavu',
  '/usr/share/fonts/truetype/dejavu'
];

fontDirs.forEach(dir => {
  try {
    const exists = fs.existsSync(dir);
    if (exists) {
      const contents = fs.readdirSync(dir);
      console.log(`${dir} (exists): ${contents.join(', ')}`);
    } else {
      console.log(`${dir} (does not exist)`);
    }
  } catch (error) {
    console.log(`Error checking ${dir}:`, error.message);
  }
});

// Try to create a test image with text using different font paths
const testDir = path.join(os.tmpdir(), 'ffmpeg-font-test-' + Date.now());
fs.mkdirSync(testDir, { recursive: true });
const testImage = path.join(testDir, 'test.png');

const fontPaths = [
  '/usr/share/fonts/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/ttf-dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
];

let success = false;

for (const fontPath of fontPaths) {
  try {
    console.log(`\nTesting font path: ${fontPath}`);
    const command = `ffmpeg -f lavfi -i color=c=blue:s=640x360:d=1 -vf "drawtext=fontfile=${fontPath}:text='FFmpeg Font Test':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" ${testImage}`;
    
    execSync(command);
    
    const fileSize = fs.statSync(testImage).size;
    console.log(`✅ Successfully created test image (${fileSize} bytes)`);
    success = true;
    break;
  } catch (error) {
    console.error(`❌ Failed with font path ${fontPath}:`);
    console.error(error.message);
    if (error.stderr) console.error(error.stderr.toString().slice(0, 500));
  }
}

// Try with font family name if direct paths fail
if (!success) {
  try {
    console.log('\nTrying with font family name:');
    const command = `ffmpeg -f lavfi -i color=c=blue:s=640x360:d=1 -vf "drawtext=font=DejaVu Sans:text='FFmpeg Font Test':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" ${testImage}`;
    
    execSync(command);
    
    const fileSize = fs.statSync(testImage).size;
    console.log(`✅ Successfully created test image with font family (${fileSize} bytes)`);
    success = true;
  } catch (error) {
    console.error('❌ Failed with font family name:');
    console.error(error.message);
    if (error.stderr) console.error(error.stderr.toString().slice(0, 500));
  }
}

console.log(`\nFont rendering test ${success ? 'PASSED ✅' : 'FAILED ❌'}`);

// Clean up
try {
  fs.unlinkSync(testImage);
  fs.rmdirSync(testDir);
} catch (e) {
  // Ignore cleanup errors
}

process.exit(success ? 0 : 1); 
#!/usr/bin/env node

/**
 * This script tests FFmpeg image generation with the correct parameters
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== FFmpeg Image Generation Test ===');
console.log(`Platform: ${os.platform()}, Release: ${os.release()}`);
console.log(`CPU architecture: ${os.arch()}`);

// Create temp dir
const testDir = path.join(os.tmpdir(), 'ffmpeg-image-test-' + Date.now());
fs.mkdirSync(testDir, { recursive: true });
console.log(`Created test directory: ${testDir}`);

// Get available fonts
const fontPath = process.env.FONT_PATH || process.env.FFMPEG_FONT_PATH || '/usr/share/fonts/dejavu/DejaVuSans.ttf';
console.log(`Using font: ${fontPath}`);

// Verify font exists
if (fs.existsSync(fontPath)) {
  console.log(`✅ Font file exists: ${fontPath}`);
} else {
  console.log(`❌ Font file does not exist: ${fontPath}`);
}

// Test different image output methods
const tests = [
  {
    name: "Standard output",
    command: `ffmpeg -f lavfi -i color=c=blue:s=640x360:d=1 -vf "drawtext=fontfile=${fontPath}:text='Test1':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" ${path.join(testDir, 'test1.png')}`
  },
  {
    name: "Output with -frames:v 1",
    command: `ffmpeg -f lavfi -i color=c=blue:s=640x360:d=1 -vf "drawtext=fontfile=${fontPath}:text='Test2':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 ${path.join(testDir, 'test2.png')}`
  },
  {
    name: "Output with -update 1",
    command: `ffmpeg -f lavfi -i color=c=blue:s=640x360:d=1 -vf "drawtext=fontfile=${fontPath}:text='Test3':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" -update 1 ${path.join(testDir, 'test3.png')}`
  },
  {
    name: "Output with both -frames:v 1 and -update 1",
    command: `ffmpeg -f lavfi -i color=c=blue:s=640x360:d=1 -vf "drawtext=fontfile=${fontPath}:text='Test4':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 -update 1 ${path.join(testDir, 'test4.png')}`
  },
  {
    name: "Output with format pattern",
    command: `ffmpeg -f lavfi -i color=c=blue:s=640x360:d=1 -vf "drawtext=fontfile=${fontPath}:text='Test5':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" ${path.join(testDir, 'test5_%03d.png')}`
  },
  {
    name: "Output with font family",
    command: `ffmpeg -f lavfi -i color=c=blue:s=640x360:d=1 -vf "drawtext=font='DejaVu Sans':text='Test6':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 ${path.join(testDir, 'test6.png')}`
  }
];

// Run tests
console.log('\nRunning tests:');
let successCount = 0;

for (const test of tests) {
  console.log(`\n>> Test: ${test.name}`);
  console.log(`Command: ${test.command}`);
  
  try {
    execSync(test.command, { stdio: ['pipe', 'pipe', 'pipe'] });
    console.log(`✅ Command executed successfully`);
    
    // Check if files exist
    const outputPattern = test.command.split(' ').pop();
    const outputDir = path.dirname(outputPattern);
    
    const files = fs.readdirSync(outputDir)
      .filter(f => f.startsWith(path.basename(outputPattern).split('_')[0]));
    
    if (files.length > 0) {
      console.log(`Found ${files.length} output files:`);
      files.forEach(file => {
        const fullPath = path.join(outputDir, file);
        const stats = fs.statSync(fullPath);
        console.log(`- ${file} (${stats.size} bytes)`);
      });
      successCount++;
    } else {
      console.log('❌ No output files found');
    }
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    if (error.stderr) {
      console.error('Error output:');
      console.error(error.stderr.toString().slice(0, 500));
    }
  }
}

console.log(`\n=== Test Results ===`);
console.log(`${successCount} out of ${tests.length} tests passed`);

// Clean up
console.log(`\nCleaning up test directory...`);
try {
  fs.readdirSync(testDir).forEach(file => {
    try {
      fs.unlinkSync(path.join(testDir, file));
    } catch (e) {
      console.log(`Could not delete ${file}: ${e.message}`);
    }
  });
  fs.rmdirSync(testDir);
  console.log(`Test directory removed`);
} catch (e) {
  console.log(`Error cleaning up: ${e.message}`);
}

process.exit(successCount > 0 ? 0 : 1); 
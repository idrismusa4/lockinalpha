#!/usr/bin/env node

/**
 * This script specifically fixes the FFmpeg image creation issue
 * by patching the videoFallbackService.ts file
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== FFmpeg Image Creation Fix ===');

// First, let's test what works
const testDir = path.join(os.tmpdir(), 'ffmpeg-test-' + Date.now());
fs.mkdirSync(testDir, { recursive: true });

const fontPath = process.env.FONT_PATH || '/usr/share/fonts/dejavu/DejaVuSans.ttf';
console.log(`Using font: ${fontPath}`);

// Test different approaches
const tests = [
  {
    name: "Sequence pattern",
    command: `ffmpeg -f lavfi -i color=c=blue:s=640x360:d=1 -vf "drawtext=fontfile=${fontPath}:text='Test':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" ${path.join(testDir, 'test_%03d.png')}`
  },
  {
    name: "Single frame",
    command: `ffmpeg -f lavfi -i color=c=blue:s=640x360:d=1 -vf "drawtext=fontfile=${fontPath}:text='Test':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 ${path.join(testDir, 'test_single.png')}`
  }
];

let workingMethod = null;

for (const test of tests) {
  try {
    console.log(`Testing: ${test.name}`);
    execSync(test.command);
    console.log(`✓ Test ${test.name} succeeded`);
    
    // Check if files were created
    const files = fs.readdirSync(testDir);
    const matchingFiles = files.filter(f => f.startsWith(path.basename(test.command.split(' ').pop()).split('_')[0]));
    
    if (matchingFiles.length > 0) {
      console.log(`  Created files: ${matchingFiles.join(', ')}`);
      workingMethod = test.name;
    } else {
      console.log(`  No files created`);
    }
  } catch (error) {
    console.error(`✗ Test ${test.name} failed: ${error.message}`);
  }
}

// Try to find the videoFallbackService.ts file
const possibleLocations = [
  path.join(process.cwd(), 'app/services/videoFallbackService.ts'),
  path.join(process.cwd(), 'src/app/services/videoFallbackService.ts'),
  '/usr/src/app/app/services/videoFallbackService.ts'
];

let serviceFilePath = null;
for (const loc of possibleLocations) {
  if (fs.existsSync(loc)) {
    serviceFilePath = loc;
    break;
  }
}

if (serviceFilePath) {
  console.log(`Found videoFallbackService.ts at: ${serviceFilePath}`);
  
  // Read the file
  const fileContent = fs.readFileSync(serviceFilePath, 'utf8');
  
  // Create backup
  const backupPath = serviceFilePath + '.bak';
  fs.writeFileSync(backupPath, fileContent);
  console.log(`Created backup at: ${backupPath}`);
  
  // Modify the code based on what worked
  let updatedContent;
  
  if (workingMethod === "Sequence pattern") {
    // Update the createImageCmd to use sequence pattern
    updatedContent = fileContent.replace(
      /const createImageCmd = `(\${ffmpegPath}) -f lavfi -i color=c=blue:s=1280x720:d=\d+ -vf "drawtext=fontfile=[^"]+:text='[^']+':fontcolor=white:fontsize=\d+:x=\(w-text_w\)\/2:y=\(h-text_h\)\/2" (\${tempImgPath})`/,
      (match, ffmpegPath, tempImgPath) => {
        // Change the output path to use a sequence pattern
        const newImgPath = tempImgPath.replace('.png', '_%03d.png');
        return `const createImageCmd = \`${ffmpegPath} -f lavfi -i color=c=blue:s=1280x720:d=1 -vf "drawtext=fontfile=${fontPath}:text='\${script.substring(0, 100)}...':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" ${newImgPath}\``;
      }
    );
    
    // Update the video creation command to use the first image from the sequence
    updatedContent = updatedContent.replace(
      /const createVideoCmd = `(\${ffmpegPath}) -loop 1 -i (\${tempImgPath}) -i (\${audioPath}) -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest (\${outputPath})`/,
      (match, ffmpegPath, tempImgPath, audioPath, outputPath) => {
        // Change tempImgPath to use the first image in the sequence
        const newImgPath = tempImgPath.replace('.png', '_001.png');
        return `const createVideoCmd = \`${ffmpegPath} -loop 1 -i ${newImgPath} -i ${audioPath} -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest ${outputPath}\``;
      }
    );
    
    // Also update the cleanup to handle multiple files
    updatedContent = updatedContent.replace(
      /if \(fs\.existsSync\(tempImgPath\)\) {\s+fs\.unlinkSync\(tempImgPath\);\s+}/,
      `// Clean up all generated image files
      const imgDir = path.dirname(tempImgPath);
      const imgPrefix = path.basename(tempImgPath).replace('.png', '');
      try {
        // Find all files starting with the prefix
        const imgFiles = fs.readdirSync(imgDir)
          .filter(file => file.startsWith(imgPrefix));
        
        // Delete each file
        imgFiles.forEach(file => {
          const fullPath = path.join(imgDir, file);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(\`Removed temporary image: \${fullPath}\`);
          }
        });
      } catch (cleanupError) {
        console.warn('Error cleaning up temporary images:', cleanupError);
      }`
    );
  } else {
    // Default to using -frames:v 1 approach if sequence pattern didn't work
    updatedContent = fileContent.replace(
      /const createImageCmd = `(\${ffmpegPath}) -f lavfi -i color=c=blue:s=1280x720:d=\d+ -vf "drawtext=fontfile=[^"]+:text='[^']+':fontcolor=white:fontsize=\d+:x=\(w-text_w\)\/2:y=\(h-text_h\)\/2" (\${tempImgPath})`/,
      (match, ffmpegPath, tempImgPath) => {
        return `const createImageCmd = \`${ffmpegPath} -f lavfi -i color=c=blue:s=1280x720:d=1 -vf "drawtext=fontfile=${fontPath}:text='\${script.substring(0, 100)}...':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 ${tempImgPath}\``;
      }
    );
  }
  
  // Write the updated content
  fs.writeFileSync(serviceFilePath, updatedContent);
  console.log(`Updated ${serviceFilePath} with fixed FFmpeg commands`);
} else {
  console.log('Could not find videoFallbackService.ts to patch');
}

// Clean up test directory
try {
  fs.readdirSync(testDir).forEach(file => {
    fs.unlinkSync(path.join(testDir, file));
  });
  fs.rmdirSync(testDir);
} catch (e) {
  console.warn('Error cleaning up test directory:', e.message);
} 
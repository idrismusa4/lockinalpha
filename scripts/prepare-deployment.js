#!/usr/bin/env node

/**
 * This script prepares the repository for deployment to both Netlify and Vercel
 * Run this before pushing to your Git repository
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== Preparing Repository for Deployment ===');

// Check if all required files exist
const requiredFiles = [
  'netlify.toml',
  'vercel.json',
  'scripts/netlify-build-setup.js',
  'scripts/vercel-setup.js',
  'scripts/alpine-font-fix.js',
  'scripts/ffmpeg-fix-image.js',
  'scripts/test-ffmpeg-image.js'
];

let missingFiles = false;

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    console.error(`❌ Missing required file: ${file}`);
    missingFiles = true;
  }
}

if (missingFiles) {
  console.error('Please create all required files before proceeding.');
  process.exit(1);
}

console.log('✅ All required files exist');

// Make scripts executable
console.log('\nMaking scripts executable...');

try {
  if (os.platform() !== 'win32') {
    // On Linux/Mac, make scripts executable
    execSync('chmod +x scripts/*.js');
    execSync('chmod +x docker-entrypoint.sh');
    console.log('✅ Made scripts executable');
  } else {
    console.log('⚠️ Running on Windows - scripts will be made executable on deployment');
  }
} catch (error) {
  console.warn('⚠️ Could not make scripts executable:', error.message);
}

// Check if Remotion root file exists
const remotionDir = path.join(process.cwd(), 'app', 'remotion');
const rootTsxPath = path.join(remotionDir, 'root.tsx');

if (!fs.existsSync(rootTsxPath)) {
  console.log('\nCreating Remotion root.tsx file...');
  
  if (!fs.existsSync(remotionDir)) {
    fs.mkdirSync(remotionDir, { recursive: true });
  }
  
  const rootTsxContent = `import { registerRoot } from 'remotion';
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
  
  fs.writeFileSync(rootTsxPath, rootTsxContent);
  console.log('✅ Created Remotion root.tsx file');
} else {
  console.log('✅ Remotion root.tsx file already exists');
}

// Create placeholder video poster if not exists
const publicDir = path.join(process.cwd(), 'public');
const posterPath = path.join(publicDir, 'video-poster.png');

if (!fs.existsSync(posterPath)) {
  console.log('\nCreating placeholder video poster image...');
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  try {
    // Try to create a simple blue rectangle as a placeholder
    const placeholderCmd = `ffmpeg -f lavfi -i color=c=blue:s=640x360:d=1 -frames:v 1 "${posterPath}"`;
    execSync(placeholderCmd);
    console.log('✅ Created video poster image using FFmpeg');
  } catch (error) {
    // Fallback to empty file if FFmpeg not available
    fs.writeFileSync(posterPath, '');
    console.log('⚠️ Created empty video poster file (FFmpeg not available)');
  }
}

// Check package.json for required scripts
console.log('\nChecking package.json scripts...');

try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredScripts = [
    'netlify:build',
    'vercel:build',
    'prebuild',
    'vercel:prebuild'
  ];
  
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
  
  if (missingScripts.length > 0) {
    console.warn(`⚠️ Missing scripts in package.json: ${missingScripts.join(', ')}`);
    console.log('Please ensure all required scripts are defined in package.json');
  } else {
    console.log('✅ All required scripts exist in package.json');
  }
} catch (error) {
  console.error('❌ Error checking package.json:', error.message);
}

console.log('\n=== Repository prepared for deployment ===');
console.log('\nNext steps:');
console.log('1. Commit and push all changes to your Git repository');
console.log('2. Deploy to Netlify or Vercel following the instructions in README.md'); 
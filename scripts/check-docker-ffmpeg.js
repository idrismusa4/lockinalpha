#!/usr/bin/env node

/**
 * This script checks FFmpeg availability in the Docker environment
 */

const { execSync } = require('child_process');
const os = require('os');

console.log('===== Docker FFmpeg Availability Check =====');
console.log(`Running in Node.js ${process.version}`);
console.log(`Platform: ${os.platform()}, Architecture: ${os.arch()}`);
console.log(`Process environment: ${process.env.NODE_ENV || 'development'}`);

try {
  console.log('\nChecking system FFmpeg...');
  const ffmpegVersion = execSync('ffmpeg -version').toString();
  console.log('✅ FFmpeg is available!');
  console.log('Version info:');
  console.log(ffmpegVersion.split('\n')[0]);
  
  // Get ffmpeg location
  const ffmpegPath = execSync('which ffmpeg').toString().trim();
  console.log(`FFmpeg path: ${ffmpegPath}`);
  
  // Test a simple ffmpeg command
  console.log('\nTesting FFmpeg functionality...');
  const testCmd = 'ffmpeg -f lavfi -i testsrc=duration=1:size=320x240:rate=30 -f null -';
  execSync(testCmd);
  console.log('✅ FFmpeg test command executed successfully');
  
  console.log('\nEnvironment variables:');
  console.log(`NETLIFY_FFMPEG_PATH: ${process.env.NETLIFY_FFMPEG_PATH || 'not set'}`);
  
  console.log('\n===== FFmpeg is properly configured in Docker =====');
  process.exit(0);
} catch (error) {
  console.error('\n❌ FFmpeg check failed:');
  console.error(error.message);
  
  if (error.stdout) console.error('stdout:', error.stdout.toString());
  if (error.stderr) console.error('stderr:', error.stderr.toString());
  
  console.log('\nTrying to find FFmpeg in common locations...');
  const commonPaths = [
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/opt/ffmpeg/bin/ffmpeg'
  ];
  
  for (const path of commonPaths) {
    try {
      const exists = execSync(`ls -la ${path}`).toString();
      console.log(`Found at ${path}:`);
      console.log(exists);
    } catch (e) {
      console.log(`Not found at ${path}`);
    }
  }
  
  console.error('\n===== FFmpeg setup failed =====');
  process.exit(1);
} 
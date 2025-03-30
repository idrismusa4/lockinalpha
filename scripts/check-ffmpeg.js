#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== FFmpeg Availability Check ===');
console.log(`Running in environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Platform: ${os.platform()}, Release: ${os.release()}`);
console.log(`CPU architecture: ${os.arch()}`);

function checkFFmpeg() {
  try {
    // Check if FFmpeg is installed
    console.log('\nChecking FFmpeg installation...');
    const ffmpegVersion = execSync('ffmpeg -version').toString();
    console.log('✅ FFmpeg is installed!');
    console.log('Version info:');
    console.log(ffmpegVersion.split('\n')[0]);
    
    // Test basic FFmpeg functionality
    console.log('\nTesting FFmpeg functionality...');
    
    // Create a temporary directory
    const tempDir = path.join(os.tmpdir(), 'ffmpeg-test-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Create a simple text file to convert to an image
    const textFile = path.join(tempDir, 'test.txt');
    fs.writeFileSync(textFile, 'FFmpeg Test');
    
    // Create a test image
    const testImage = path.join(tempDir, 'test.png');
    execSync(`ffmpeg -f lavfi -i color=c=blue:s=320x240:d=5 -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='FFmpeg Test':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" ${testImage}`);
    console.log('✅ Created test image successfully');
    
    // Create a test audio
    const testAudio = path.join(tempDir, 'test.mp3');
    execSync(`ffmpeg -f lavfi -i "sine=frequency=1000:duration=5" ${testAudio}`);
    console.log('✅ Created test audio successfully');
    
    // Combine image and audio to create a video
    const testVideo = path.join(tempDir, 'test.mp4');
    execSync(`ffmpeg -loop 1 -i ${testImage} -i ${testAudio} -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest ${testVideo}`);
    console.log('✅ Created test video successfully');
    
    // Check file sizes to verify they were created properly
    const imageSize = fs.statSync(testImage).size;
    const audioSize = fs.statSync(testAudio).size;
    const videoSize = fs.statSync(testVideo).size;
    
    console.log(`\nFile sizes:`);
    console.log(`- Image: ${formatBytes(imageSize)}`);
    console.log(`- Audio: ${formatBytes(audioSize)}`);
    console.log(`- Video: ${formatBytes(videoSize)}`);
    
    // Clean up
    fs.unlinkSync(textFile);
    fs.unlinkSync(testImage);
    fs.unlinkSync(testAudio);
    fs.unlinkSync(testVideo);
    fs.rmdirSync(tempDir);
    
    console.log('\n✅ All FFmpeg tests passed successfully!');
    return true;
  } catch (error) {
    console.error('\n❌ FFmpeg test failed:');
    console.error(error.message);
    if (error.stdout) console.error('stdout:', error.stdout.toString());
    if (error.stderr) console.error('stderr:', error.stderr.toString());
    return false;
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

console.log('\n=== Results ===');
const result = checkFFmpeg();
console.log(`FFmpeg availability: ${result ? 'Available ✅' : 'Not available ❌'}`);

process.exit(result ? 0 : 1); 
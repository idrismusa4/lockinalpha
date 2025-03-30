#!/usr/bin/env node

/**
 * This script sets up basic configuration for Netlify builds
 */

const fs = require('fs');
const path = require('path');

console.log('=== Simple Netlify Build Setup ===');

// Set WebAssembly mode
process.env.FFMPEG_WASM_MODE = 'true';
console.log('✅ Set FFMPEG_WASM_MODE=true for WebAssembly FFmpeg');

// Create necessary directories
console.log('\nCreating build directories...');
try {
  fs.mkdirSync(path.join(process.cwd(), 'netlify', 'functions'), { recursive: true });
  console.log('✅ Created Netlify directories for functions');
} catch (error) {
  console.error('Error creating directories:', error);
}

// Create a simple WebAssembly FFmpeg initialization function
console.log('\nSetting up WebAssembly FFmpeg...');
try {
  const initFFmpegFunction = `
exports.handler = async function(event, context) {
  console.log('FFmpeg WebAssembly initialization function');
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'FFmpeg WASM ready' })
  };
};
`;
  
  const functionPath = path.join(process.cwd(), 'netlify', 'functions', 'ffmpeg-wasm-init.js');
  fs.writeFileSync(functionPath, initFFmpegFunction);
  console.log('✅ Created WebAssembly FFmpeg initialization function');
} catch (error) {
  console.error('Error creating FFmpeg function:', error);
}

console.log('\n=== Build setup complete ==='); 
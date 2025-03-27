#!/bin/sh

# Docker entrypoint script for LockIn Alpha
# This script runs before the application starts to ensure all dependencies are set up

echo "=== LockIn Alpha Docker Entry Point ==="

# Check and fix font configuration
echo "Checking font configuration..."
node scripts/alpine-font-fix.js

# Set environment variable for font path
export FONT_PATH=$(fc-match "DejaVu Sans" --format="%{file}")
echo "Using font: $FONT_PATH"

# Set environment variables for FFmpeg
export FFMPEG_PATH=$(which ffmpeg)
export FFMPEG_FONT_PATH=$FONT_PATH
echo "Using FFmpeg: $FFMPEG_PATH"

# Create necessary Remotion files
echo "Setting up Remotion..."
mkdir -p app/remotion

# Check if we need to create root.tsx for Remotion
if [ ! -f app/remotion/root.tsx ] && [ -f app/remotion/index.tsx ]; then
  echo "Creating Remotion root.tsx file..."
  cat > app/remotion/root.tsx << EOF
import { registerRoot } from 'remotion';
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
EOF
  echo "Remotion root.tsx created"
fi

# Ensure /tmp is writable
chmod 777 /tmp

# Enable FFmpeg debug logs
export FFMPEG_DEBUG=1

# Test and fix FFmpeg
echo "Testing and fixing FFmpeg image generation..."
if [ -f scripts/ffmpeg-fix-image.js ]; then
  # Make script executable
  chmod +x scripts/ffmpeg-fix-image.js
  node scripts/ffmpeg-fix-image.js
else
  echo "FFmpeg fix script not found, running manual test"
  # Test FFmpeg with image generation
  FFMPEG_TEST_DIR=$(mktemp -d)
  ffmpeg -f lavfi -i color=c=blue:s=640x360:d=1 -vf "drawtext=fontfile=$FONT_PATH:text='Test':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 $FFMPEG_TEST_DIR/test.png || echo "FFmpeg test image generation failed"

  if [ -f "$FFMPEG_TEST_DIR/test.png" ]; then
    echo "✅ FFmpeg image test successful"
    ls -la $FFMPEG_TEST_DIR/test.png
  else 
    echo "❌ FFmpeg image test failed"
  fi

  rm -rf $FFMPEG_TEST_DIR
fi

# Print system info
echo "System information:"
uname -a
echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"

# Start the application
echo "Starting application..."
exec "$@" 
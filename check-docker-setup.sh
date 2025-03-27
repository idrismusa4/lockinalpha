#!/bin/bash

# This script tests the Docker setup for ffmpeg and font support

echo "=== LockIn Alpha Docker Setup Check ==="
echo "Testing FFmpeg and font support for video generation"

# Check Docker is running
echo -e "\nChecking Docker..."
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop first."
  exit 1
else
  echo "✅ Docker is running"
fi

# Build the Docker image
echo -e "\nBuilding Docker image..."
echo "This may take a few minutes..."
docker build -t lockinalpha-test .

if [ $? -ne 0 ]; then
  echo "❌ Docker build failed"
  exit 1
else
  echo "✅ Docker image built successfully"
fi

# Run the Alpine font fix script
echo -e "\nRunning font fix script in Docker container..."
docker run --rm lockinalpha-test node scripts/alpine-font-fix.js

# Run the font test script
echo -e "\nRunning font test script in Docker container..."
docker run --rm lockinalpha-test node scripts/test-ffmpeg-fonts.js

# Run the FFmpeg check script
echo -e "\nRunning FFmpeg check script in Docker container..."
docker run --rm lockinalpha-test node scripts/check-docker-ffmpeg.js

# If all tests pass, run the application
echo -e "\nAll tests completed. You can now run the application with:"
echo "docker run -p 3000:3000 lockinalpha-test" 
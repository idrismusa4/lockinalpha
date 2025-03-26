#!/bin/bash

# This script builds the application inside a Docker container for Netlify deployment

# Exit on any error
set -e

echo "=== Building the application using Docker for Netlify ==="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker to continue."
    exit 1
fi

echo "1. Building Docker image..."
docker build -t lockin-app:netlify .

echo "2. Creating a container to extract the build output..."
CONTAINER_ID=$(docker create lockin-app:netlify)

echo "3. Container created with ID: $CONTAINER_ID"

# Create the output directory if it doesn't exist
mkdir -p .next

echo "4. Extracting .next directory from container..."
docker cp $CONTAINER_ID:/app/.next/. .next/

echo "5. Cleaning up container..."
docker rm $CONTAINER_ID

echo "=== Build completed successfully ==="
echo "The .next directory has been populated with the build output from Docker."
echo "Netlify can now deploy this build."

exit 0 
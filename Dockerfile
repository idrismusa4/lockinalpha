FROM node:18

# Install FFmpeg and other required tools
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with legacy peer deps for compatibility
RUN npm ci --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Make scripts executable
RUN chmod +x scripts/*.js

# Verify FFmpeg installation and log the version
RUN ffmpeg -version
RUN echo "FFmpeg path: $(which ffmpeg)"
RUN node scripts/check-docker-ffmpeg.js

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NETLIFY_FFMPEG_PATH=/usr/bin/ffmpeg

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 
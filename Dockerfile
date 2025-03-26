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

# Make the FFmpeg check script executable
RUN chmod +x scripts/check-ffmpeg.js

# Build the application
RUN npm run build

# Verify FFmpeg installation
RUN npm run check-ffmpeg

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 
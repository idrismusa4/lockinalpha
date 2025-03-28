# ---------- Stage 1: Builder ----------
FROM node:18-bullseye-slim AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the Next.js application (this creates the .next folder)
RUN npm run build

# ---------- Stage 2: Production ----------
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install required fonts and FFmpeg dependencies
RUN apk update && \
    apk add --no-cache ffmpeg fontconfig ttf-dejavu ttf-liberation ttf-opensans && \
    mkdir -p /usr/share/fonts/truetype/dejavu && \
    ln -s /usr/share/fonts/dejavu/DejaVuSans.ttf /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf && \
    fc-cache -f

# Copy built assets from the builder stage (including the .next folder)
COPY --from=builder /usr/src/app ./

# Make entry point script executable
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set environment variables for font paths
ENV FONTCONFIG_PATH=/etc/fonts
ENV REMOTION_FONT_FAMILY=DejaVuSans
ENV NODE_ENV=production
ENV FONT_PATH=/usr/share/fonts/dejavu/DejaVuSans.ttf
ENV FFMPEG_FONT_PATH=/usr/share/fonts/dejavu/DejaVuSans.ttf

# Expose the port your app uses
EXPOSE 3000

# Set the entry point
ENTRYPOINT ["/docker-entrypoint.sh"]

# Start the Next.js production server
CMD ["npm", "start"]
    
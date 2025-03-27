# ---------- Stage 1: Builder ----------
    FROM node:18-alpine AS builder

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
    
    # Update apk repositories and install FFmpeg without cache
    RUN apk update && apk add --no-cache ffmpeg
    
    # Copy built assets from the builder stage (including the .next folder)
    COPY --from=builder /usr/src/app ./
    
    # Expose the port your app uses
    EXPOSE 3000
    
    # Start the Next.js production server
    CMD ["npm", "start"]
    
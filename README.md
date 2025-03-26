# LockIn Auto Video Lecture MVP

An AI-powered system for automatically generating video lectures from study materials.

## Features

- **Document Upload**: Upload study materials in various formats (PDF, DOCX, TXT)
- **AI Script Generation**: Convert study materials into well-structured lecture scripts
- **Video Generation**: Transform scripts into engaging video lectures
- **Dashboard Interface**: User-friendly interface for managing the entire process

## Tech Stack

- **Frontend**: Next.js
- **Backend**: Next.js API Routes
- **Storage**: Supabase Storage
- **AI**: API integration for script generation
- **Video Processing**: Remotion for React-based video generation
- **Hosting**: Vercel (deployment platform)

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/lockin-auto-video-lecture.git
cd lockin-auto-video-lecture
```

2. Install dependencies
```bash
npm install
```

3. Create a Supabase project
   - Go to the [Supabase Dashboard](https://app.supabase.com/)
   - Create a new project
   - Make note of your Project URL and Project API key (anon, public)
   - Navigate to Storage in the Supabase dashboard
   - **Important**: Create two storage buckets:
     - `documents` - For storing uploaded study materials
     - `videos` - For storing generated video lectures
   - Set the privacy settings for both buckets to public (required for this MVP)
   - **Critical**: Configure Row-Level Security (RLS) policies:
     - Go to the "Policies" tab in Storage
     - Add a policy for each bucket that allows anonymous uploads
     - Set the policy definition to `true` to allow all operations
     - Without this step, uploads will fail due to RLS restrictions

4. Set up environment variables
   - Create a `.env.local` file in the root directory
   - Add your Supabase config:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Add AI API keys (when implementing actual AI integration)
```
AI_API_KEY=your_ai_api_key
```

### Running the Application

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment

Deploy to Vercel:
```bash
vercel deploy
```

## Project Structure

- `/app`: Next.js app directory
  - `/components`: React components
  - `/api`: API routes
  - `/remotion`: Remotion video components
- `/public`: Static assets

## Notes for Production

- Implement proper text extraction from documents
- Connect to a real AI service (Claude, DeepSeek, or OpenAI)
- Implement actual Remotion video rendering
- Add proper error handling and validation
- Implement authentication (planned for next phase)
- Set up proper database storage instead of in-memory storage

## License

[MIT](LICENSE)

## Deployment to Vercel

### Prerequisites

Before deploying to Vercel, you'll need:

1. **AWS Account** - For AWS Polly text-to-speech service
   - Create an AWS IAM user with Polly permissions
   - Generate access key and secret key

2. **Supabase Account** - For storage
   - Create a new Supabase project
   - Create two storage buckets:
     - `videos` - For storing generated video files
     - `audios` - For storing audio files (when FFmpeg is not available)
   - Set both buckets to be publicly accessible for downloads

### Deployment Steps

1. **Fork or Clone this Repository**

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add the following environment variables in the Vercel project settings:
     ```
     MY_AWS_ACCESS_KEY_ID=your_MY_AWS_access_key_here
     MY_AWS_SECRET_ACCESS_KEY=your_MY_AWS_secret_key_here
     MY_AWS_REGION=us-east-1
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
     NODE_ENV=production
     VERCEL=1
     ```
   - Deploy the project

3. **Verify Deployment**
   - Test video generation functionality
   - Note: On Vercel, FFmpeg might not be available, so the application will fall back to generating audio-only files in MP3 format.

## Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lockin.git
   cd lockin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.local.example` to `.env.local` and fill in your credentials

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Install FFmpeg (optional)**
   - For video generation, install FFmpeg on your local machine
   - Windows: Install using Chocolatey `choco install ffmpeg`
   - Mac: Install using Homebrew `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`

## Architecture Notes

- This application uses AWS Polly for text-to-speech conversion
- In local environments with FFmpeg installed, full video generation will work
- In serverless environments (Vercel), the system checks for FFmpeg availability:
  - If available, it generates videos with audio
  - If not available, it generates audio files only

## Deployment Options

### Vercel Deployment

When deploying to Vercel, note that:
- FFmpeg is not available by default in the serverless environment
- The application will fall back to audio-only mode
- Video generation will be limited

### Netlify Deployment

For improved video generation capabilities, we recommend deploying to Netlify:

1. **Prerequisites**
   - Netlify account
   - Same environment variables as described in the Vercel deployment section

2. **Deployment Steps**
   - Push your code to your GitHub repository
   - Connect your repository to Netlify
   - In the Netlify site settings, navigate to "Build & deploy" > "Environment" and add the following environment variables:
     ```
     MY_AWS_ACCESS_KEY_ID=your_MY_AWS_access_key_here
     MY_AWS_SECRET_ACCESS_KEY=your_MY_AWS_secret_key_here
     MY_AWS_REGION=us-east-1
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
     NODE_ENV=production
     NETLIFY=true
     ```
   - In Netlify site settings, go to "Build & deploy" > "Continuous Deployment" > "Build settings" and set:
     - Base directory: not set (or leave blank)
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Deploy the site

3. **Enhanced FFmpeg Support**
   - The application now includes a custom FFmpeg plugin for Netlify
   - The plugin will attempt to download and install FFmpeg during the build process
   - The `netlify.toml` configuration file specifies longer function timeouts to accommodate video processing
   - Function bundling is configured to include WebAssembly and FFmpeg modules

4. **How it Works**
   - The Netlify plugin runs during the build process and attempts to set up FFmpeg
   - The application has multiple fallback mechanisms:
     1. First attempts to use system FFmpeg if available in the Netlify environment
     2. Falls back to WebAssembly-based FFmpeg if system FFmpeg is not available
     3. As a last resort, falls back to audio-only mode

5. **Verify Installation**
   - After deployment, create a new video in your application
   - Check the function logs in Netlify to see detailed information about which FFmpeg approach was used
   - If you see messages like "Using system FFmpeg", it means the plugin successfully installed FFmpeg

### Docker Local Development

You can also use Docker for local development to ensure your environment matches production:

1. **Build the Docker image**
   ```bash
   docker build -t lockin-app .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 -e NODE_ENV=production lockin-app
   ```

3. **Test FFmpeg**
   ```bash
   docker exec -it <container_id> npm run check-ffmpeg
   ```

## Technical Considerations

### Serverless Limitations

When deploying to Vercel or similar serverless platforms:

1. **Execution Timeout**: Some processes may exceed the 10-second timeout limit for serverless functions. The code is designed to handle this by using background processing.

2. **FFmpeg Dependency**: FFmpeg might not be available in the serverless environment. The code gracefully degrades to audio-only mode in this case.

3. **Storage**: Temporary storage in `/tmp` is limited to 512MB on Vercel. Large video generation might be limited.

### Local vs Production

- In local development, full video generation is supported when FFmpeg is installed
- In production (Vercel), the application might fall back to audio-only mode

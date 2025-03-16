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

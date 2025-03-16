import React from 'react';
import VideoForm from '@/components/VideoForm';

export const metadata = {
  title: 'Create Video Lecture | LockIn',
  description: 'Generate video lectures from your scripts with LockIn',
};

export default function VideoPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Video Lecture Generator</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-2xl mx-auto">
        Enter your script below and we'll generate a professional video lecture.
        Our AI will create a visually engaging presentation based on your content.
      </p>
      
      <VideoForm />
      
      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-card p-6 rounded-lg border">
            <div className="font-bold text-xl mb-2">1. Write Your Script</div>
            <p>Enter the text content for your video lecture. You can use markdown formatting for better structure.</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="font-bold text-xl mb-2">2. Generate</div>
            <p>Click the generate button and our system will transform your script into a video presentation.</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="font-bold text-xl mb-2">3. Share or Download</div>
            <p>Once generation is complete, you can play the video directly in your browser or download it.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
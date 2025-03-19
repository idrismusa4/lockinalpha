import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="container py-12">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Transform Your Study Materials
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          LockIn helps you create engaging video lectures from your study materials.
          Upload your content or write a script, and we'll do the rest.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="px-8">
            <Link href="/video">Create Video</Link>
          </Button>
          <Button asChild variant="outline" className="px-8">
            <Link href="/dashboard">Upload Files</Link>
          </Button>
        </div>
      </div>

      <div className="mt-24 grid gap-12 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col items-center space-y-2 border-t pt-8">
          <div className="font-semibold text-xl">AI-Powered Video Generation</div>
          <p className="text-center text-muted-foreground">
            Our advanced AI transforms your scripts into professional video lectures
            with animations and visuals.
          </p>
        </div>
        <div className="flex flex-col items-center space-y-2 border-t pt-8">
          <div className="font-semibold text-xl">Import Your Materials</div>
          <p className="text-center text-muted-foreground">
            Upload lecture notes, slides, or documents, and we'll extract the content
            to create your videos.
          </p>
        </div>
        <div className="flex flex-col items-center space-y-2 border-t pt-8">
          <div className="font-semibold text-xl">Share and Download</div>
          <p className="text-center text-muted-foreground">
            Easily share your video lectures with students or colleagues, or download
            them for offline use.
          </p>
        </div>
      </div>
    </div>
  );
}

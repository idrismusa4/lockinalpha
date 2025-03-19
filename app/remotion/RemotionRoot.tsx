import React from 'react';
import { Composition } from 'remotion';
import { VideoLecture } from './VideoLecture';

// Define the props interface matching what VideoLecture expects
export interface VideoLectureProps {
  script: string;
  audioUrl?: string;
}

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VideoLecture"
      component={VideoLecture}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        title: "Sample Lecture",
        content: "This is a sample lecture content.",
        audioUrl: "https://example.com/audio.mp3"
      }}
    />
  );
}; 
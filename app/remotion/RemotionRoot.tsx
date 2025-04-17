import React from 'react';
import { Composition } from 'remotion';
import { VideoLecture } from './VideoLecture';
import { FPS, WIDTH, HEIGHT } from './constants';

// Define the props interface matching what VideoLecture expects
export interface VideoLectureProps {
  script: string;
  audioUrl?: string;
  media?: any[][];
  customIntroPath?: string; // Path to custom intro video
}

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VideoLecture"
      component={VideoLecture}
      durationInFrames={1200}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{
        script: "# Sample Lecture\n\nThis is a placeholder script for the video lecture.",
        audioUrl: "",
        customIntroPath: "/intro.mp4" // Default intro path
      }}
    />
  );
}; 
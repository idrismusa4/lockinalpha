import React from 'react';
import { Composition, registerRoot } from '@remotion/core';
import { VideoLecture } from './VideoLecture';

// Define the props interface matching what VideoLecture expects
export interface VideoLectureProps {
  script: string;
  audioUrl?: string;
}

const RemotionVideo: React.FC = () => {
  return (
    <Composition
      id="VideoLecture"
      component={VideoLecture}
      durationInFrames={1200}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        script: "# Sample Lecture\n\nThis is a placeholder script for the video lecture. The actual content will be generated based on the user's uploaded materials.",
        audioUrl: ""
      }}
    />
  );
};

registerRoot(RemotionVideo); 
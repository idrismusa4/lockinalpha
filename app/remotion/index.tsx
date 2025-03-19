import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { VideoLecture } from './VideoLecture';

// Define the props interface matching what VideoLecture expects
export interface VideoLectureProps {
  title: string;
  content: string;
  audioUrl: string;
}

const RemotionVideo: React.FC = () => {
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

registerRoot(RemotionVideo); 
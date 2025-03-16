import { AbsoluteFill, Sequence, Series, useVideoConfig } from 'remotion';
import React from 'react';
import { VideoLectureProps } from './index';

// Component to display text with animation
const TextSlide: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  return (
    <Sequence from={delay} durationInFrames={150}>
      <AbsoluteFill
        style={{
          backgroundColor: '#0B3131',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '5%',
          fontFamily: 'Lexend, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: '2.5rem',
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

// Title slide component
const TitleSlide: React.FC<{ title: string }> = ({ title }) => {
  return (
    <Sequence durationInFrames={90}>
      <AbsoluteFill
        style={{
          backgroundColor: '#0B3131',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Lexend, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: '4rem',
            fontWeight: 'bold',
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          LockIn Lecture
        </div>
        <div
          style={{
            fontSize: '2.5rem',
            marginTop: '2rem',
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          {title}
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

// Component to display the LockIn logo
const LogoSlide: React.FC = () => {
  return (
    <Sequence durationInFrames={60}>
      <AbsoluteFill
        style={{
          backgroundColor: '#0B3131',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: '6rem',
            fontWeight: 'bold',
            color: '#FFFFFF',
            fontFamily: 'Lexend, sans-serif',
          }}
        >
          LockIn
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

// Main video component
export const VideoLecture: React.FC<VideoLectureProps> = ({ script }) => {
  const { fps } = useVideoConfig();
  
  // Extract a title from the first line of the script
  const title = script.split('\n')[0].replace(/^#+\s*/, '');
  
  // Break script into chunks for slides (roughly 20 words per slide)
  const scriptChunks = script
    .split('\n\n')
    .filter(chunk => chunk.trim().length > 0);
  
  return (
    <AbsoluteFill>
      <Series>
        {/* Start with logo */}
        <Series.Sequence durationInFrames={60}>
          <LogoSlide />
        </Series.Sequence>
        
        {/* Title slide */}
        <Series.Sequence durationInFrames={90}>
          <TitleSlide title={title} />
        </Series.Sequence>
        
        {/* Content slides */}
        {scriptChunks.map((chunk, index) => (
          <Series.Sequence key={index} durationInFrames={150}>
            <TextSlide text={chunk} />
          </Series.Sequence>
        ))}
        
        {/* End with logo */}
        <Series.Sequence durationInFrames={60}>
          <LogoSlide />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}; 
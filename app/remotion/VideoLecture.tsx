import { AbsoluteFill, Sequence, Series } from 'remotion';
import { useVideoConfig, useCurrentFrame } from '@remotion/core';
import { Audio } from '@remotion/player';
import { spring } from '@remotion/motion';
import React from 'react';
import { VideoLectureProps } from './index';

// Component to display text with animation
const TextSlide: React.FC<{ text: string; index: number; audioStart?: number }> = ({ 
  text, 
  index,
  audioStart = 0
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Animation timing
  const entryDuration = 15; // frames for entry animation
  const slideDuration = 150; // total duration of this slide
  
  // Calculate animation progress (0 to 1)
  const entryProgress = spring({
    frame,
    from: 0,
    to: 1,
    fps,
    config: {
      damping: 15,
      stiffness: 150,
    }
  });
  
  // Calculate text opacity
  const opacity = spring({
    frame,
    from: 0,
    to: 1,
    fps,
    config: {
      damping: 20,
      mass: 0.6,
    }
  });
  
  // Split text into lines for animation
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  return (
    <Sequence from={index * slideDuration} durationInFrames={slideDuration}>
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
            fontSize: '2.2rem',
            textAlign: 'left',
            maxWidth: '80%',
            transform: `translateY(${(1 - entryProgress) * 50}px)`,
            opacity,
          }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                marginBottom: '1rem',
                opacity: frame > i * 5 ? 1 : 0.3,
                transform: `translateX(${frame > i * 5 ? 0 : -20}px)`,
                transition: 'all 0.5s ease-out',
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

// Title slide component
const TitleSlide: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: {
      damping: 20,
    }
  });
  
  const scale = spring({
    frame,
    fps,
    from: 0.8,
    to: 1,
    config: {
      damping: 15,
      stiffness: 80
    }
  });
  
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
            opacity: opacity,
            transform: `scale(${scale})`,
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
            opacity: frame > 30 ? opacity : 0,
            transform: `translateY(${frame > 30 ? 0 : 30}px)`,
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
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: {
      mass: 1,
      damping: 15
    }
  });
  
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
            transform: `scale(${scale})`,
          }}
        >
          LockIn
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

// Main video component
export const VideoLecture: React.FC<VideoLectureProps> = ({ script, audioUrl }) => {
  const { fps } = useVideoConfig();
  
  // Extract a title from the first line of the script
  const title = script.split('\n')[0].replace(/^#+\s*/, '');
  
  // Break script into chunks for slides (roughly 20 words per slide)
  const scriptChunks = script
    .split('\n\n')
    .filter(chunk => chunk.trim().length > 0);
  
  // Calculate total frames needed
  const logoFrames = 60;
  const titleFrames = 90;
  const slideFrames = scriptChunks.length * 150;
  const endLogoFrames = 60;
  const totalFrames = logoFrames + titleFrames + slideFrames + endLogoFrames;
  
  return (
    <AbsoluteFill>
      {/* Background audio for the entire video */}
      {audioUrl && (
        <Audio src={audioUrl} />
      )}
      
      <Series>
        {/* Start with logo */}
        <Series.Sequence durationInFrames={logoFrames}>
          <LogoSlide />
        </Series.Sequence>
        
        {/* Title slide */}
        <Series.Sequence durationInFrames={titleFrames}>
          <TitleSlide title={title} />
        </Series.Sequence>
        
        {/* Content slides */}
        {scriptChunks.map((chunk, index) => (
          <Series.Sequence key={index} durationInFrames={150}>
            <TextSlide 
              text={chunk} 
              index={index} 
              audioStart={logoFrames + titleFrames + (index * 150)} 
            />
          </Series.Sequence>
        ))}
        
        {/* End with logo */}
        <Series.Sequence durationInFrames={endLogoFrames}>
          <LogoSlide />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}; 
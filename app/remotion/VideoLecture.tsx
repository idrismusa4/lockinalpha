import React, { useMemo } from 'react';
import { 
  AbsoluteFill, 
  Sequence, 
  useCurrentFrame, 
  useVideoConfig, 
  spring, 
  Audio, 
  interpolate,
  Easing
} from 'remotion';
import { VideoLectureProps } from './index';
import { parseMarkdown } from './utils/parser';
import { BACKGROUND_COLOR, COLORS, LOGO_DURATION, TITLE_DURATION, SLIDE_DURATION, END_LOGO_DURATION, STICKMAN, HEADING_FONT, BODY_FONT } from './constants';

// Utility function to generate random within range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Animation timing constants
const LOGO_DURATION = 90; // frames
const TITLE_DURATION = 120; // frames
const SLIDE_DURATION = 300; // frames for each content slide
const END_LOGO_DURATION = 90; // frames

// Stickman animations component
const Stickman: React.FC<{pose?: string; style?: React.CSSProperties}> = ({ 
  pose = 'thinking',
  style = {}
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const bounce = Math.sin(frame / 10) * 5;
  
  // Base dimensions
  const headRadius = STICKMAN.headRadius;
  const bodyLength = STICKMAN.bodyLength;
  const armLength = STICKMAN.armLength;
  const legLength = STICKMAN.legLength;
  
  // Different poses based on context
  const poses: Record<string, React.CSSProperties> = {
    thinking: {
      rightArmRotation: -45 + Math.sin(frame / 15) * 5,
      leftArmRotation: 20,
      rightLegRotation: 0,
      leftLegRotation: 0,
      headTilt: Math.sin(frame / 20) * 5,
    },
    explaining: {
      rightArmRotation: 30 + Math.sin(frame / 10) * 15,
      leftArmRotation: -30 - Math.sin(frame / 10) * 15,
      rightLegRotation: 0,
      leftLegRotation: 0,
      headTilt: Math.sin(frame / 25) * 8,
    },
    pointing: {
      rightArmRotation: -60,
      leftArmRotation: 20,
      rightLegRotation: 0,
      leftLegRotation: 0,
      headTilt: -10,
    },
    walking: {
      rightArmRotation: Math.sin(frame / 8) * 30,
      leftArmRotation: -Math.sin(frame / 8) * 30,
      rightLegRotation: -Math.sin(frame / 8) * 25,
      leftLegRotation: Math.sin(frame / 8) * 25,
      headTilt: Math.sin(frame / 16) * 5,
    },
    jumping: {
      rightArmRotation: -45 + Math.sin(frame / 5) * 10,
      leftArmRotation: 45 - Math.sin(frame / 5) * 10,
      rightLegRotation: -20 + Math.sin(frame / 5) * 10,
      leftLegRotation: 20 - Math.sin(frame / 5) * 10,
      headTilt: 0,
      translateY: Math.abs(Math.sin(frame / 10) * 20) - 10,
    },
    sitting: {
      rightArmRotation: 10,
      leftArmRotation: 10,
      rightLegRotation: 90,
      leftLegRotation: 90,
      headTilt: 0,
    },
  };
  
  const currentPose = poses[pose] || poses.thinking;
  
  return (
    <div
      style={{
        position: 'relative',
        width: headRadius * 2 + 100,
        height: headRadius * 2 + bodyLength + legLength + 20,
        transform: `translateY(${currentPose.translateY || 0}px)`,
        ...style,
      }}
    >
      {/* Head */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: headRadius * 2,
          height: headRadius * 2,
          borderRadius: '50%',
          backgroundColor: 'white',
          transform: `translate(-50%, 0) rotate(${currentPose.headTilt}deg)`,
        }}
      >
        {/* Face - simple dots for eyes */}
        <div
          style={{
            position: 'absolute',
            top: headRadius - 5,
            left: headRadius - 10,
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'black',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: headRadius - 5,
            left: headRadius + 6,
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'black',
          }}
        />
        {/* Smile */}
        <div
          style={{
            position: 'absolute',
            top: headRadius + 5,
            left: headRadius - 8,
            width: 16,
            height: 8,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            border: '2px solid black',
            borderTop: 'none',
          }}
        />
      </div>
      
      {/* Body */}
      <div
        style={{
          position: 'absolute',
          top: headRadius * 2,
          left: '50%',
          width: 4,
          height: bodyLength,
          backgroundColor: 'white',
          transform: 'translate(-50%, 0)',
        }}
      />
      
      {/* Arms */}
      <div
        style={{
          position: 'absolute',
          top: headRadius * 2 + 20,
          left: '50%',
          width: armLength,
          height: 4,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: `translate(-50%, 0) rotate(${currentPose.rightArmRotation}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: headRadius * 2 + 20,
          left: '50%',
          width: armLength,
          height: 4,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: `translate(-50%, 0) rotate(${currentPose.leftArmRotation}deg)`,
        }}
      />
      
      {/* Legs */}
      <div
        style={{
          position: 'absolute',
          top: headRadius * 2 + bodyLength,
          left: '50%',
          width: legLength,
          height: 4,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: `translate(-50%, 0) rotate(${currentPose.rightLegRotation}deg)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: headRadius * 2 + bodyLength,
          left: '50%',
          width: legLength,
          height: 4,
          backgroundColor: 'white',
          transformOrigin: 'left center',
          transform: `translate(-50%, 0) rotate(${currentPose.leftLegRotation}deg)`,
        }}
      />
    </div>
  );
};

// Graph visualization component
const GraphVisualization: React.FC<{ type?: string; style?: React.CSSProperties }> = ({
  type = 'bar',
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  
  // Animation progress
  const progress = spring({
    frame,
    fps: 30,
    from: 0,
    to: 1,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });
  
  // Generate random bar heights
  const bars = useMemo(() => {
    return Array.from({ length: 5 }, () => random(30, 150));
  }, []);
  
  // Generate random line points
  const linePoints = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      x: i * 50,
      y: random(20, 100),
    }));
  }, []);
  
  const renderGraph = () => {
    if (type === 'bar') {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: 'space-around',
          height: 150, 
          width: 300
        }}>
          {bars.map((height, index) => (
            <div
              key={index}
              style={{
                width: 30,
                height: height * progress,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                margin: '0 5px',
              }}
            />
          ))}
        </div>
      );
    } else if (type === 'line') {
      // Creating SVG line
      const points = linePoints
        .map(point => `${point.x},${100 - point.y * progress}`)
        .join(' ');

      return (
        <svg width="350" height="120">
          <polyline
            points={points}
            style={{
              fill: 'none',
              stroke: 'rgba(255, 255, 255, 0.8)',
              strokeWidth: 4,
            }}
          />
          {linePoints.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={100 - point.y * progress}
              r={5}
              fill="white"
            />
          ))}
        </svg>
      );
    } else if (type === 'pie') {
      // Simple pie chart
      return (
        <svg width="150" height="150" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="20"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth="20"
            strokeDasharray={`${progress * 251.2} 251.2`}
            transform="rotate(-90 50 50)"
          />
        </svg>
      );
    }
    
    return null;
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      ...style 
    }}>
      {renderGraph()}
    </div>
  );
};

// Component to display text with animation
const TextSlide: React.FC<{ 
  text: string; 
  index: number; 
  includeAnimation?: boolean;
  includeGraph?: boolean;
}> = ({ 
  text, 
  index,
  includeAnimation = true,
  includeGraph = false
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Determine if this slide should show a stickman based on the text content
  const shouldShowStickman = useMemo(() => {
    return includeAnimation && (text.toLowerCase().includes('example') || 
           text.toLowerCase().includes('consider') ||
           text.toLowerCase().includes('imagine') ||
           index % 2 === 0); // Show on every other slide
  }, [text, index, includeAnimation]);
  
  // Determine stickman pose based on text content
  const stickmanPose = useMemo(() => {
    if (text.toLowerCase().includes('point') || text.toLowerCase().includes('highlight')) {
      return 'pointing';
    }
    if (text.toLowerCase().includes('walk') || text.toLowerCase().includes('move')) {
      return 'walking';
    }
    if (text.toLowerCase().includes('jump') || text.toLowerCase().includes('increase')) {
      return 'jumping';
    }
    if (text.toLowerCase().includes('sit') || text.toLowerCase().includes('rest')) {
      return 'sitting';
    }
    if (text.toLowerCase().includes('explain') || text.toLowerCase().includes('breakdown')) {
      return 'explaining';
    }
    return 'thinking';
  }, [text]);
  
  // Determine if we should show a graph visualization
  const shouldShowGraph = useMemo(() => {
    return includeGraph && (text.toLowerCase().includes('graph') || 
           text.toLowerCase().includes('chart') ||
           text.toLowerCase().includes('data') ||
           text.toLowerCase().includes('statistics') ||
           text.toLowerCase().includes('increase') ||
           text.toLowerCase().includes('decrease'));
  }, [text, includeGraph]);
  
  // Determine graph type based on content
  const graphType = useMemo(() => {
    if (text.toLowerCase().includes('bar') || text.toLowerCase().includes('histogram')) {
      return 'bar';
    }
    if (text.toLowerCase().includes('line') || text.toLowerCase().includes('trend')) {
      return 'line';
    }
    if (text.toLowerCase().includes('pie') || text.toLowerCase().includes('percentage')) {
      return 'pie';
    }
    return 'bar'; // Default
  }, [text]);
  
  // Animation for the slide - initial scaling and fade in
  const slideAnimation = spring({
    frame,
    from: 0,
    to: 1,
    fps,
    config: {
      damping: 15,
      stiffness: 80,
    },
  });
  
  // Animation for the text - letter-by-letter appearance
  const textAnimationProgress = Math.min(1, frame / (text.length * 0.5));
  
  // Split text for animation - show characters one by one
  const animatedText = text
    .split('')
    .map((char, i) => {
      const charProgress = Math.max(0, Math.min(1, (textAnimationProgress * text.length - i) * 0.3));
      
      return (
        <span
          key={i}
          style={{
            opacity: charProgress,
            transform: `translateY(${(1 - charProgress) * 20}px)`,
            display: 'inline-block',
          }}
        >
          {char}
        </span>
      );
    });
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        background: COLORS.backgroundGradient,
        transform: `scale(${slideAnimation})`,
        opacity: slideAnimation,
        fontFamily: BODY_FONT,
      }}
    >
      <div 
        style={{
          display: 'flex',
          flexDirection: shouldShowStickman ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {shouldShowStickman && (
          <Stickman 
            pose={stickmanPose} 
            style={{ 
              marginRight: 40,
              marginLeft: 20, 
              flex: '0 0 auto'
            }} 
          />
        )}
        
        <div 
          style={{ 
            backgroundColor: COLORS.dark,
            padding: '20px 30px',
            borderRadius: 15,
            backdropFilter: 'blur(10px)',
            maxWidth: shouldShowStickman ? '60%' : '80%',
          }}
        >
          <h2 
            style={{ 
              fontSize: 36,
              fontWeight: 'bold',
              color: COLORS.text,
              marginBottom: 20,
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            }}
          >
            {animatedText}
          </h2>
          
          {shouldShowGraph && (
            <GraphVisualization 
              type={graphType} 
              style={{ 
                marginTop: 30,
                marginBottom: 20,
              }} 
            />
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Title slide component
const TitleSlide: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = spring({
    frame,
    from: 0,
    to: 1,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
    },
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
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        background: COLORS.backgroundGradient,
        fontFamily: HEADING_FONT,
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: 'center',
          padding: 40,
        }}
      >
        <h1
          style={{
            fontSize: 60,
            fontWeight: 'bold',
            color: COLORS.text,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            marginBottom: 20,
          }}
        >
          {title}
        </h1>
        <h2
          style={{
            fontSize: 30,
            fontWeight: 'normal',
            color: COLORS.textSecondary,
          }}
        >
          Generated by LockIn AI
        </h2>
      </div>
    </AbsoluteFill>
  );
};

// Component to display the LockIn logo intro
const LogoIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const logoScale = spring({
    frame,
    from: 0,
    to: 1,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });
  
  const studioOpacity = spring({
    frame: frame - 30,
    from: 0,
    to: 1,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        background: COLORS.backgroundGradient,
        fontFamily: HEADING_FONT,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 120,
            fontWeight: 'bold',
            color: COLORS.text,
            transform: `scale(${logoScale})`,
            marginBottom: 20,
          }}
        >
          LockIn
        </h1>
        <div
          style={{
            opacity: studioOpacity,
            transform: `translateY(${(1 - studioOpacity) * 20}px)`,
          }}
        >
          <h2
            style={{
              fontSize: 60,
              fontWeight: 'normal',
              color: COLORS.textSecondary,
            }}
          >
            Studios
          </h2>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// End logo animation
const LogoOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const progress = spring({
    frame,
    from: 0,
    to: 1,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });
  
  // Create a floating effect
  const floatY = Math.sin(frame / 15) * 10;
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        justifyContent: 'center',
        alignItems: 'center',
        background: COLORS.backgroundGradient,
        fontFamily: HEADING_FONT,
      }}
    >
      <div 
        style={{ 
          textAlign: 'center',
          transform: `translateY(${floatY}px)`,
        }}
      >
        <h1
          style={{
            fontSize: 100,
            fontWeight: 'bold',
            color: COLORS.text,
            marginBottom: 20,
            opacity: progress,
          }}
        >
          LockIn Studios
        </h1>
        <p
          style={{
            fontSize: 24,
            color: COLORS.textSecondary,
            opacity: Math.max(0, progress - 0.3) * 1.4,
            transform: `translateY(${(1 - Math.max(0, progress - 0.3)) * 20}px)`,
          }}
        >
          AI-Generated Video Lecture
        </p>
      </div>
      
      {/* Particle effects */}
      <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
        {[...Array(20)].map((_, i) => {
          const size = random(3, 8);
          const x = random(-50, 50);
          const y = random(-100, 100);
          const delay = random(0, 30);
          const duration = random(150, 250);
          const animatedY = interpolate(
            frame - delay,
            [0, duration],
            [0, -200],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );
          
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                transform: `translateY(${animatedY}px)`,
                opacity: interpolate(
                  frame - delay,
                  [0, duration, duration + 30],
                  [1, 1, 0],
                  {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }
                ),
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Main video component
export const VideoLecture: React.FC<VideoLectureProps> = ({ script, audioUrl }) => {
  const { fps } = useVideoConfig();
  
  // Parse the Markdown script
  const { title, paragraphs } = useMemo(() => {
    return parseMarkdown(script);
  }, [script]);
  
  // Calculate total frames needed
  const logoFrames = LOGO_DURATION;
  const titleFrames = TITLE_DURATION;
  const slideFrames = paragraphs.length * SLIDE_DURATION;
  const endLogoFrames = END_LOGO_DURATION;
  const totalFrames = logoFrames + titleFrames + slideFrames + endLogoFrames;
  
  return (
    <AbsoluteFill>
      {/* Background audio for the entire video */}
      {audioUrl && (
        <Audio src={audioUrl} />
      )}
      
      {/* Start with logo animation */}
      <Sequence durationInFrames={LOGO_DURATION}>
        <LogoIntro />
      </Sequence>
      
      {/* Title slide */}
      <Sequence from={LOGO_DURATION} durationInFrames={TITLE_DURATION}>
        <TitleSlide title={title} />
      </Sequence>
      
      {/* Content slides */}
      {paragraphs.map((paragraph, i) => (
        <Sequence
          key={i}
          from={LOGO_DURATION + TITLE_DURATION + i * SLIDE_DURATION}
          durationInFrames={SLIDE_DURATION}
        >
          <TextSlide 
            text={paragraph} 
            index={i} 
            includeAnimation={true}
            includeGraph={true}
          />
        </Sequence>
      ))}
      
      {/* End with logo */}
      <Sequence 
        from={LOGO_DURATION + TITLE_DURATION + slideFrames} 
        durationInFrames={END_LOGO_DURATION}
      >
        <LogoOutro />
      </Sequence>
    </AbsoluteFill>
  );
}; 
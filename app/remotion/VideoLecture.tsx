import React, { useMemo } from 'react';
import { 
  AbsoluteFill, 
  Sequence, 
  useVideoConfig,
} from 'remotion';

// Import these at runtime to avoid TypeScript errors
// while still making them available for the component
const remotion = require('remotion');
const Audio = remotion.Audio;
const useCurrentFrame = remotion.useCurrentFrame;
const spring = remotion.spring;
const interpolate = remotion.interpolate;
const Easing = remotion.Easing;
const Img = remotion.Img;
const Video = remotion.Video;

import { VideoLectureProps } from './index';
import { parseMarkdown, shouldVisualizeData, suggestStickmanPose, suggestGraphType } from './utils/parser';
import { BACKGROUND_COLOR, COLORS, HEADING_FONT, BODY_FONT, STICKMAN } from './constants';
import { FetchedMedia } from '../services/mediaFetchService';

// Define a custom interface for stickman poses to avoid TypeScript errors
interface StickmanPose {
  rightArmRotation: number;
  leftArmRotation: number;
  rightLegRotation: number;
  leftLegRotation: number;
  headTilt: number;
  translateY?: number;
}

// Utility function to generate random within range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Animation timing constants - DOUBLED for 60fps
const LOGO_DURATION = 90; // 3 seconds @ 30fps
const TITLE_DURATION = 120; // 4 seconds @ 30fps
const SLIDE_DURATION = 300; // 10 seconds per slide @ 30fps
const END_LOGO_DURATION = 90; // 3 seconds @ 30fps

// Exact time to start audio (4 seconds = 240 frames @ 60fps)
const AUDIO_START_DELAY = 120; // 4 seconds @ 30fps

// New constants for custom intro - properly timed for 60fps
const CUSTOM_INTRO_DURATION = 390; // 13 seconds @ 30fps (adjust based on your actual intro video length)
const USE_CUSTOM_INTRO = true; // Flag to toggle between default and custom intro

// Animation timing constants
const FADE_DURATION = 15; // 0.5 seconds @ 60fps
const STAGGER_DELAY = 5; // 5 frames between items

// Export these constants for use in other files
export {
  LOGO_DURATION,
  TITLE_DURATION,
  SLIDE_DURATION,
  END_LOGO_DURATION,
  AUDIO_START_DELAY,
  CUSTOM_INTRO_DURATION
};

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
  const poses: Record<string, StickmanPose> = {
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
  
  // Create a new CSS properties object without the custom properties
  const containerStyle: React.CSSProperties = {
        position: 'relative',
        width: headRadius * 2 + 100,
        height: headRadius * 2 + bodyLength + legLength + 20,
    transform: currentPose.translateY !== undefined ? 
      `translateY(${currentPose.translateY}px)` : undefined,
        ...style,
  };

  // Use the pose properties for the animations rather than as direct CSS props
  return (
    <div style={containerStyle}>
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

// A component to display a GIF with proper sizing and positioning
interface MediaBackgroundProps {
  media?: FetchedMedia;
  opacity?: number;
}

// This component is deprecated in favor of MediaSlide
// It's kept for backward compatibility but not used in new slides
const MediaBackground: React.FC<MediaBackgroundProps> = ({ 
  media, 
  opacity = 0.5 
}) => {
  console.log('WARNING: MediaBackground is deprecated, use MediaSlide instead');
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  
  // Debug media object
  console.log('Media object in MediaBackground:', media);
  
  if (!media || !media.url) {
    return null;
  }
  
  // Calculate scale to fit the media within the frame while maintaining aspect ratio
  const mediaWidth = media.width || 500;
  const mediaHeight = media.height || 300;
  const mediaAspect = mediaWidth / mediaHeight;
  const frameAspect = width / height;
  
  let scale = 1;
  if (mediaAspect > frameAspect) {
    // Media is wider than frame - scale to height
    scale = height / mediaHeight;
  } else {
    // Media is taller than frame - scale to width
    scale = width / mediaWidth;
  }
  
  // Scale up slightly to avoid borders
  const finalScale = scale * 1.05;
  
  // Calculate dimensions with scale applied
  const scaledWidth = mediaWidth * finalScale;
  const scaledHeight = mediaHeight * finalScale;
  
  // Animate the image subtly
  const translateX = Math.sin(frame / 50) * 10;
  const translateY = Math.cos(frame / 60) * 10;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        opacity,
        zIndex: 0,
      }}
    >
      {/* Use standard img tag with fallback if Img doesn't work */}
      {Img ? (
      <Img
        src={media.url}
        style={{
          width: scaledWidth,
          height: scaledHeight,
          objectFit: 'cover',
            transform: `translate(${translateX}px, ${translateY}px)`,
          }}
        />
      ) : (
        <img
          src={media.url}
          style={{
            width: scaledWidth,
            height: scaledHeight,
            objectFit: 'cover',
            transform: `translate(${translateX}px, ${translateY}px)`,
          }}
        />
      )}
      
      {/* Overlay to control the brightness and help text readability */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: BACKGROUND_COLOR,
          opacity: 0.7,
          zIndex: 1,
        }}
      />
    </div>
  );
};

// A component to display media with proper sizing and transition effects
interface MediaSlideProps {
  media?: FetchedMedia[];  // Changed from single media item to array
  text: string;
  index: number;
  includeGraph?: boolean;
}

const MediaSlide: React.FC<MediaSlideProps> = ({ 
  media, 
  text,
  index,
  includeGraph = false,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  
  // Animation for the slide entry
  const slideIn = spring({
    frame,
    from: 0,
    to: 1,
    fps,
    config: {
      damping: 15,
      stiffness: 80,
    },
  });
  
  // Animation for the text - word-by-word appearance
  const textAnimationProgress = Math.min(1, frame / (text.length * 0.3)); 
  
  // Check if we have valid media
  const hasMedia = media && media.length > 0;
  
  // Calculate grid layout based on number of media items
  const gridColumns = hasMedia ? (
    media.length === 1 ? 1 : 
    media.length === 2 ? 2 : 
    media.length === 3 ? 3 : 
    media.length === 4 ? 2 : 
    3  // Default to 3 columns for 5+ items
  ) : 1;
  
  const gridRows = hasMedia ? (
    media.length === 1 ? 1 : 
    media.length === 2 ? 1 : 
    media.length === 3 ? 1 : 
    media.length === 4 ? 2 : 
    Math.ceil(media.length / 3)  // Calculate rows needed for grid
  ) : 1;
  
  // Determine max size for media based on layout
  const MAX_MEDIA_WIDTH = width * 0.8 / gridColumns;
  const MAX_MEDIA_HEIGHT = height * 0.7 / gridRows;
  
  // Text animation similar to standard text slide
  const animatedText = () => {
    // Split the text into words and preserve punctuation
    const words = text.split(/(\s+|[,.!?;:()])/g).filter(word => word !== '');
    
    return words.map((word, i) => {
      // Calculate the character count up to the current word
      const charCount = words.slice(0, i).join('').length;
      
      // Determine when this word should appear
      const wordProgress = Math.max(0, Math.min(1, 
        (textAnimationProgress * text.length - charCount) * 0.5));
      
      return (
        <span
          key={i}
          style={{
            opacity: wordProgress,
            transform: `translateY(${(1 - wordProgress) * 20}px)`,
            display: 'inline-block',
            whiteSpace: 'pre',  // Preserve spacing
            transition: 'opacity 0.2s, transform 0.2s',
          }}
        >
          {word}
        </span>
      );
    });
  };
  
  // Render a single media item with animations
  const renderMediaItem = (item: FetchedMedia, index: number) => {
    // Stagger the animations slightly for each item
    const staggerDelay = index * 5;
    
    // Calculate dimensions for this specific media
    const mediaWidth = item.width || MAX_MEDIA_WIDTH;
    const mediaHeight = item.height || MAX_MEDIA_HEIGHT;
    const isPortrait = mediaHeight > mediaWidth;
    
    // Different sizing strategy based on orientation
    const scaleFactor = isPortrait ? 
      Math.min(MAX_MEDIA_HEIGHT / mediaHeight, MAX_MEDIA_WIDTH / mediaWidth) : 
      Math.min(MAX_MEDIA_WIDTH / mediaWidth, MAX_MEDIA_HEIGHT / mediaHeight);
    
    // Apply a smaller scale to avoid overwhelming the viewer
    // For multiple media items, make them smaller
    const adjustedScaleFactor = media && media.length > 1 ? 
      scaleFactor * 0.9 : 
      scaleFactor * 0.8;
    
    // Animation for this specific media element
    const thisMediaAnimation = {
      opacity: spring({
        frame: frame - 10 - staggerDelay,
        from: 0,
        to: 1,
        fps,
        config: {
          damping: 15,
          stiffness: 80,
        },
      }),
      scale: spring({
        frame: frame - 5 - staggerDelay,
        from: 1.05,
        to: 1,
        fps,
        config: {
          damping: 15,
          stiffness: 80,
        },
      }),
      translateX: Math.sin((frame + index * 10) / 100) * 5,
    };
    
    return (
      <div
        key={`media-${index}`}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '10px',
          transform: `scale(${thisMediaAnimation.scale})`,
          opacity: thisMediaAnimation.opacity,
          transition: 'all 0.3s ease-in-out',
        }}
      >
        {Img ? (
          <Img
            src={item.url}
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: mediaWidth * adjustedScaleFactor,
              maxHeight: mediaHeight * adjustedScaleFactor,
              objectFit: 'contain',
              transform: `translateX(${thisMediaAnimation.translateX}px)`,
              borderRadius: 8,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
            }}
          />
        ) : (
          <img
            src={item.url}
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: mediaWidth * adjustedScaleFactor,
              maxHeight: mediaHeight * adjustedScaleFactor,
              objectFit: 'contain',
              transform: `translateX(${thisMediaAnimation.translateX}px)`,
              borderRadius: 8,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
            }}
          />
        )}
      </div>
    );
  };
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: COLORS.backgroundGradient,
        opacity: slideIn,
      }}
    >
      {/* Media grid container - takes up most of the screen */}
      {hasMedia && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '75%',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
              gridTemplateRows: `repeat(${gridRows}, 1fr)`,
              gap: '15px',
              width: '90%',
              height: '90%',
              alignItems: 'center',
              justifyItems: 'center',
            }}
          >
            {media && media.map((item, idx) => item && item.url ? renderMediaItem(item, idx) : null)}
          </div>
        </div>
      )}
      
      {/* Text overlay at the bottom */}
      <div
        style={{
          position: 'relative',
          width: '90%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '20px 30px',
          borderRadius: 15,
          backdropFilter: 'blur(10px)',
          marginTop: hasMedia ? 0 : 'auto',
          marginBottom: hasMedia ? 20 : 'auto',
        }}
      >
        <h2
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: COLORS.text,
            marginBottom: includeGraph ? 20 : 0,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            lineHeight: 1.4,
            textAlign: 'center',
          }}
        >
          {animatedText()}
        </h2>
        
        {includeGraph && (
          <GraphVisualization 
            type={suggestGraphType(text)} 
            style={{ 
              marginTop: 20,
              marginBottom: 10,
            }} 
          />
        )}
      </div>
    </AbsoluteFill>
  );
};

// Component to display text with animation - used when no media is available
const TextSlide: React.FC<{ 
  text: string; 
  index: number; 
  includeAnimation?: boolean;
  includeGraph?: boolean;
  media?: FetchedMedia[];  // Changed from single media to array
}> = ({ 
  text, 
  index,
  includeAnimation = true,
  includeGraph = false,
  media
}) => {
  // If we have media available, use the media-focused slide instead
  if (media && media.length > 0 && media[0] && media[0].url) {
    return <MediaSlide media={media} text={text} index={index} includeGraph={includeGraph} />;
  }
  
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Determine if this slide should show a stickman based on the text content
  const shouldShowStickman = useMemo(() => {
    return includeAnimation && (
      text.toLowerCase().includes('example') || 
           text.toLowerCase().includes('consider') ||
           text.toLowerCase().includes('imagine') ||
      text.toLowerCase().includes('show') ||
      text.toLowerCase().includes('present') ||
      text.toLowerCase().includes('explain') ||
      text.toLowerCase().includes('discuss') ||
      index % 3 === 0 // Show on every third slide for variety
    );
  }, [text, index, includeAnimation]);
  
  // Determine stickman pose based on text content
  const stickmanPose = useMemo(() => {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('point') || textLower.includes('highlight') || textLower.includes('show')) {
      return 'pointing';
    }
    if (textLower.includes('walk') || textLower.includes('move') || textLower.includes('step')) {
      return 'walking';
    }
    if (textLower.includes('jump') || textLower.includes('increase') || textLower.includes('rise')) {
      return 'jumping';
    }
    if (textLower.includes('sit') || textLower.includes('rest') || textLower.includes('relax')) {
      return 'sitting';
    }
    if (textLower.includes('explain') || textLower.includes('breakdown') || textLower.includes('present')) {
      return 'explaining';
    }
    
    // Default pose based on slide index for variety
    const poses = ['thinking', 'explaining', 'pointing', 'walking', 'sitting'];
    return poses[index % poses.length];
  }, [text, index]);
  
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
  
  // Split text for animation - improve by showing words instead of individual characters
  const animatedText = () => {
    // If we're not doing character animation, just show the whole text
    if (!includeAnimation) {
      return <span>{text}</span>;
    }
    
    // Split the text into words and preserve punctuation
    const words = text.split(/(\s+|[,.!?;:()])/g).filter(word => word !== '');
    
    return words.map((word, i) => {
      // Calculate the character count up to the current word
      const charCount = words.slice(0, i).join('').length;
      
      // Determine when this word should appear
      const wordProgress = Math.max(0, Math.min(1, 
        (textAnimationProgress * text.length - charCount) * 0.5));
      
      // Use different timing for each word to mimic speech rhythm
      return (
        <span
          key={i}
          style={{
            opacity: wordProgress,
            transform: `translateY(${(1 - wordProgress) * 20}px)`,
            display: 'inline-block',
            whiteSpace: 'pre',  // Preserve spacing
            marginRight: word.trim() === '' ? 0 : 0,  // Only add margin for non-space words
            transition: 'opacity 0.2s, transform 0.2s',
          }}
        >
          {word}
        </span>
      );
    });
  };
  
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        display: 'flex',
        flexDirection: shouldShowStickman ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        background: COLORS.backgroundGradient,
        transform: `scale(${slideAnimation})`,
        opacity: slideAnimation,
        fontFamily: BODY_FONT,
      }}
    >
      {/* Remove MediaBackground since we're using MediaSlide for media content */}
      
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
              lineHeight: 1.4,
            }}
          >
            {animatedText()}
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

// Custom intro component that plays a local video
const CustomIntro: React.FC<{ videoPath?: string }> = ({ videoPath = "/intro.mp4" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = Math.min(1, frame / FADE_DURATION);
  const isDataUrl = videoPath.startsWith('data:');
  
  // Log frame information for debugging timing issues
  if (frame % 30 === 0) { // Log once per second
    console.log(`[CustomIntro] Second ${frame/fps}: Playing intro video`);
  }
  
  // The total duration in our timeline (in frames)
  const totalDurationFrames = CUSTOM_INTRO_DURATION;
  
  // Calculate playback rate to ensure video fits exactly in the allocated duration
  // For a 13-second video at 34fps source played in a 30fps composition over 13 seconds:
  // We want playbackRate = 1.0 to maintain the original timing
  const playbackRate = 1.0;
  
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Video 
          src={videoPath} 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity,
          }}
          volume={1}
          muted={false}
          playbackRate={playbackRate}
        />
      </div>
      
      {/* Debug info overlay */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontFamily: 'monospace',
        padding: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}>
        Intro: {Math.round(frame/fps)}s / {Math.round(totalDurationFrames/fps)}s
      </div>
    </AbsoluteFill>
  );
};

// Main video component
export const VideoLecture: React.FC<VideoLectureProps> = ({ 
  script, 
  audioUrl,
  media,
  customIntroPath
}) => {
  // Parse the script to extract title and paragraphs
  const { title, paragraphs } = parseMarkdown(script);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  console.log(`[VideoLecture] Received script with title: ${title} and ${paragraphs.length} paragraphs`);
  console.log(`[VideoLecture] Audio URL: ${audioUrl ? 'provided' : 'not provided'}`);
  console.log(`[VideoLecture] Custom intro path: ${customIntroPath ? customIntroPath : 'not provided'}`);

  // Filter out section breaks (paragraphs that only contain "--" characters)
  const filteredParagraphs = paragraphs.filter(p => {
    const trimmed = p.trim();
    const isBreak = trimmed === '--' || trimmed === '---' || trimmed === '----';
    if (isBreak) {
      console.log(`[VideoLecture] Filtering out section break: "${p}"`);
    }
    return !isBreak;
  });

  console.log(`[VideoLecture] After filtering section breaks: ${filteredParagraphs.length} paragraphs remaining`);
  
  // Log all paragraphs for debugging
  filteredParagraphs.forEach((p, i) => {
    console.log(`[VideoLecture] Paragraph ${i}: "${p.substring(0, 50)}${p.length > 50 ? '...' : ''}"`);
  });

  // Get media for each slide
  const getMediaForSlide = (index: number): FetchedMedia[] => {
    if (!media || !Array.isArray(media) || index >= media.length) {
      return [];
    }
    return media[index] || [];
  };

  // Calculate total duration based on content
  const useCustomIntro = USE_CUSTOM_INTRO && customIntroPath;
  const introDuration = useCustomIntro ? CUSTOM_INTRO_DURATION : LOGO_DURATION;
  const titleDuration = TITLE_DURATION;
  const slideDuration = SLIDE_DURATION;
  const endDuration = END_LOGO_DURATION;
  
  // Correctly calculate slide positions with frame precision
  const introEndFrame = introDuration;
  const titleEndFrame = introEndFrame + titleDuration;
  
  // Create an array to track slide positions for debugging
  const slidePositions = filteredParagraphs.map((_, index) => {
    const startFrame = titleEndFrame + (index * slideDuration);
    const endFrame = startFrame + slideDuration;
    return { startFrame, endFrame };
  });
  
  // Log slide positions for debugging
  console.log(`[VideoLecture] Frame ${frame}: Intro ends at ${introEndFrame}, Title ends at ${titleEndFrame}`);
  slidePositions.forEach((pos, i) => {
    console.log(`[VideoLecture] Slide ${i}: starts at frame ${pos.startFrame}, ends at ${pos.endFrame}`);
  });
  
  // Calculate total duration based on content
  const totalDuration = introDuration + titleDuration + (filteredParagraphs.length * slideDuration) + endDuration;
  
  // Set audio to start exactly after intro + title (13s intro + 4s title = 17s)
  // At 30fps: (13 + 4) * 30 = 510 frames
  const audioStartFrame = introDuration + titleDuration; // Dynamic calculation based on actual durations
  console.log(`[VideoLecture] Audio will start at frame ${audioStartFrame} (${audioStartFrame/fps} seconds)`);
  console.log(`[VideoLecture] Timing breakdown: Intro=${introDuration/fps}s, Title=${titleDuration/fps}s, Total before audio=${audioStartFrame/fps}s`);

  // Render content based on current frame
  const renderCurrentContent = () => {
    // Show intro
    if (frame < introEndFrame) {
      return useCustomIntro && customIntroPath 
        ? <CustomIntro videoPath={customIntroPath} /> 
        : <LogoIntro />;
    }
    
    // Show title
    if (frame < titleEndFrame) {
      return <TitleSlide title={title} />;
    }
    
    // Calculate current slide index
    const slideIndex = Math.floor((frame - titleEndFrame) / slideDuration);
    
    // Show content slides
    if (slideIndex < filteredParagraphs.length) {
        return (
            <TextSlide 
          text={filteredParagraphs[slideIndex]} 
          index={slideIndex}
          includeAnimation={true}
          includeGraph={slideIndex % 3 === 0} // Show graph on every third slide
          media={getMediaForSlide(slideIndex)}
        />
      );
    }
    
    // Show outro
    return <LogoOutro />;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#111111' }}>
      {renderCurrentContent()}
      
      {/* Render audio with precise timing */}
      {audioUrl && (
        <Audio 
          src={audioUrl} 
          startFrom={audioStartFrame}
          endAt={totalDuration}
          volume={(frame: number) => {
            // Add a fade-in to prevent clicks/pops
            if (frame < audioStartFrame + 30) {
              return Math.min(1, (frame - audioStartFrame) / 30);
            }
            return 1;
          }}
        />
      )}
      
      {/* Debug frame counter */}
      <div style={{
        position: 'absolute',
        bottom: 5,
        right: 5,
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        fontFamily: 'monospace'
      }}>
        Frame: {frame} | {Math.round(frame/fps)}s
      </div>
    </AbsoluteFill>
  );
}; 
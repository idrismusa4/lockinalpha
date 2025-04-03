import { registerRoot } from 'remotion';
import { VideoLecture } from './VideoLecture';
import { Composition } from 'remotion';
import { 
  LOGO_DURATION, 
  TITLE_DURATION, 
  SLIDE_DURATION, 
  END_LOGO_DURATION 
} from './constants';

// Define the props interface for VideoLecture
export interface VideoLectureProps {
  script: string;
  audioUrl: string;
}

/**
 * Calculates the total duration for a video based on script length
 * @param script The text script
 * @returns Duration in frames (at 30fps)
 */
const calculateDuration = (script: string): number => {
  // Parse script to estimate number of slides
  const paragraphs = script.split('\n\n').filter(p => p.trim().length > 0);
  const numSlides = Math.max(1, paragraphs.length);
  
  // Calculate total duration
  const totalDuration = LOGO_DURATION + TITLE_DURATION + (numSlides * SLIDE_DURATION) + END_LOGO_DURATION;
  
  // Ensure minimum duration of 10 seconds
  return Math.max(300, totalDuration);
};

// This is the composition to render
const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoLecture"
        component={VideoLecture}
        durationInFrames={calculateDuration("Placeholder script")}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          script: "This is a placeholder script. Replace with actual content.",
          audioUrl: "",
        }}
      />
    </>
  );
};

// Register the root component
registerRoot(RemotionRoot);

// Export components for direct import
export { VideoLecture }; 
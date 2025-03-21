import { Composition } from 'remotion';
import { VideoLecture } from './VideoLecture';
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

/**
 * This is the entry point for the Remotion bundler
 */
export const RemotionVideo = () => {
  return (
    <>
      <Composition
        id="VideoLecture"
        component={VideoLecture}
        durationInFrames={1800} // Default 60 seconds (will be overridden by props)
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          script: "# Sample Video Lecture\n\nThis is a sample video lecture script.\n\nIt demonstrates how the video will look with multiple paragraphs.\n\nYou can include data that will show as graphs and charts.\n\nThe stickman will animate differently based on the content and context.",
          audioUrl: "",
        }}
      />
    </>
  );
}; 
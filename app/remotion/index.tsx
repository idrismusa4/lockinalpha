import { Composition } from 'remotion';
import { VideoLecture } from './VideoLecture';
import { 
  LOGO_DURATION, 
  TITLE_DURATION, 
  SLIDE_DURATION, 
  END_LOGO_DURATION 
} from './constants';
import { FetchedMedia } from '../services/mediaFetchService';

// Define the props interface for VideoLecture
export interface VideoLectureProps {
  script: string;
  audioUrl: string;
  media?: FetchedMedia[][];  // Array of media arrays, one per paragraph
  customIntroPath?: string;  // Path to a custom intro video from public folder
}

/**
 * Calculates the total duration for a video based on script length
 * @param script The text script
 * @returns Duration in frames (at 60fps)
 */
const calculateDuration = (script: string): number => {
  // Parse script to estimate number of slides
  const paragraphs = script.split('\n\n').filter(p => p.trim().length > 0);
  const numSlides = Math.max(1, paragraphs.length);
  
  // Calculate total duration (doubled for 60fps)
  const totalDuration = (LOGO_DURATION + TITLE_DURATION + (numSlides * SLIDE_DURATION) + END_LOGO_DURATION) * 2;
  
  // Ensure minimum duration of 10 seconds at 60fps
  return Math.max(600, totalDuration);
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
        durationInFrames={3600} // Default 60 seconds at 60fps (will be overridden by props)
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{
          script: "# Sample Video Lecture\n\nThis is a sample video lecture script.\n\nIt demonstrates how the video will look with multiple paragraphs.\n\nYou can include data that will show as graphs and charts.\n\nThe stickman will animate differently based on the content and context.",
          audioUrl: "",
        }}
      />
    </>
  );
}; 
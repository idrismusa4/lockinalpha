/**
 * Remotion Video Constants
 * 
 * This file contains configuration constants used across the video generation system.
 * These are used both in the UI components and in the server-side rendering service.
 */

// Video configuration
export const FPS = 30; // Reduced from 60fps to 30fps for faster rendering
export const WIDTH = 1280; // Reduced from 1920 for faster rendering
export const HEIGHT = 720; // Reduced from 1080 for faster rendering

// Duration constants (in frames at 30fps)
export const LOGO_DURATION = 90; // 3 seconds @ 30fps
export const TITLE_DURATION = 120; // 4 seconds @ 30fps
export const SLIDE_DURATION = 300; // 10 seconds per slide @ 30fps
export const END_LOGO_DURATION = 90; // 3 seconds @ 30fps

// Exact time to start audio (4 seconds = 120 frames @ 30fps)
export const AUDIO_START_DELAY = 120; // 4 seconds @ 30fps

// Custom intro constants - based on actual 13-second video
// For a 13-second video at 30fps: 13 * 30 = 390 frames
export const CUSTOM_INTRO_DURATION = 390; // 13 seconds @ 30fps (fixed value regardless of source fps)
export const USE_CUSTOM_INTRO = true;

// Background color for the video (kept for backward compatibility)
export const BACKGROUND_COLOR = '#111111';

// UI constants
export const COLORS = {
  primary: '#4285F4',
  secondary: '#34A853',
  accent: '#FBBC05',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#CCCCCC',
  lightGray: '#F5F5F5',
  darkGray: '#333333',
  background: '#111111',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  backgroundGradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 50%, #FBBC05 100%)',
  dark: 'rgba(0, 0, 0, 0.5)',
};

// Font settings
export const FONT_FAMILY = 'Inter, system-ui, -apple-system, sans-serif';
export const HEADING_FONT = 'Georgia, serif';
export const TEXT_FONT = 'Inter, system-ui, -apple-system, sans-serif';
export const BODY_FONT = 'Inter, system-ui, -apple-system, sans-serif'; // Keeping for backward compatibility

// Animation timing
export const FADE_DURATION = 15; // 0.5 seconds @ 30fps
export const STAGGER_DELAY = 3; // frames between items (adjusted for 30fps)

// Stickman dimensions
export const STICKMAN = {
  headRadius: 20,
  bodyLength: 50,
  armLength: 40,
  legLength: 45,
};

// Media constants
export const MEDIA_TRANSITION_DURATION = 30; // 1 second @ 30fps
export const MEDIA_COVER_PERCENTAGE = 85; // Percentage of screen the media should cover

// Quality settings for rendering
export const VIDEO_BITRATE = '8M'; // Reduced from 10M to 8M for faster rendering
export const AUDIO_BITRATE = '320k';
export const VIDEO_CRF = 22; // Lower CRF = better quality (18-23 is visually lossless) 
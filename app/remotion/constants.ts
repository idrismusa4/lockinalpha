/**
 * Remotion Video Constants
 * 
 * This file contains configuration constants used across the video generation system.
 * These are used both in the UI components and in the server-side rendering service.
 */

// Video configuration
export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Duration constants (in frames at 60fps)
export const LOGO_DURATION = 180; // 3 seconds @ 60fps
export const TITLE_DURATION = 240; // 4 seconds @ 60fps
export const SLIDE_DURATION = 600; // 10 seconds per slide @ 60fps
export const END_LOGO_DURATION = 180; // 3 seconds @ 60fps

// Exact time to start audio (4 seconds = 240 frames @ 60fps)
export const AUDIO_START_DELAY = 240; // 4 seconds @ 60fps

// Custom intro constants
export const CUSTOM_INTRO_DURATION = 780; // 13 seconds @ 60fps
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
export const FADE_DURATION = 30; // 0.5 seconds @ 60fps
export const STAGGER_DELAY = 5; // 5 frames between items

// Stickman dimensions
export const STICKMAN = {
  headRadius: 20,
  bodyLength: 50,
  armLength: 40,
  legLength: 45,
};

// Media constants
export const MEDIA_TRANSITION_DURATION = 60; // 1 second @ 60fps
export const MEDIA_COVER_PERCENTAGE = 85; // Percentage of screen the media should cover

// Quality settings for rendering
export const VIDEO_BITRATE = '10M';
export const AUDIO_BITRATE = '320k';
export const VIDEO_CRF = 18; // Lower CRF = better quality (18-23 is visually lossless) 
// Type declarations to help with compatibility issues

// Fix for esbuild TypeScript definitions
declare module 'esbuild' {
  // Just declare the module to prevent TypeScript from trying to read the real declaration file
  export const version: string;
}

declare module 'esbuild/lib/main.js' {
  // Just declare the module to prevent TypeScript from trying to read the real declaration file
  export const version: string;
}

// Fix for Remotion component type issues
declare module 'remotion' {
  import React from 'react';
  
  export interface RemotionVideoProps {
    script: string;
  }
  
  export interface CompositionProps<T> {
    id: string;
    component: React.ComponentType<T>;
    durationInFrames: number;
    fps: number;
    width: number;
    height: number;
    defaultProps: T;
  }
  
  export function Composition<T>(props: CompositionProps<T>): React.ReactElement;
  
  // Additional Remotion components and functions
  export const AbsoluteFill: React.FC<React.HTMLProps<HTMLDivElement>>;
  export interface SequenceProps {
    from?: number;
    durationInFrames?: number;
    children?: React.ReactNode;
  }
  export const Sequence: React.FC<SequenceProps>;
  
  export interface SeriesProps {
    children: React.ReactNode;
  }
  export const Series: React.FC<SeriesProps> & {
    Sequence: React.FC<{
      durationInFrames: number;
      children: React.ReactNode;
    }>;
  };
  
  export function useVideoConfig(): {
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    frame: number;
    composition: {
      id: string;
      width: number;
      height: number;
      fps: number;
      durationInFrames: number;
    };
  };
  
  export function registerRoot(component: React.ComponentType): void;
}

// Declare module for bundle/render functions
declare module '@remotion/bundler' {
  export function bundle(options: {
    entryPoint: string;
    webpackOverride?: (config: any) => any;
  }): Promise<string>;
}

declare module '@remotion/renderer' {
  export function renderMedia(options: {
    composition: {
      id: string;
      defaultProps?: any;
      width: number;
      height: number;
      fps: number;
      durationInFrames: number;
    };
    serveUrl: string;
    codec?: string;
    outputLocation: string;
    imageFormat?: string;
    onProgress?: (progress: { progress: number }) => void;
  }): Promise<void>;
  
  export function selectComposition(options: {
    serveUrl: string;
    id: string;
    inputProps?: any;
  }): Promise<{
    id: string;
    defaultProps?: any;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
  }>;
} 
import { NextResponse } from 'next/server';
import path from 'path';
import { bundle } from '@remotion/bundler';
import { getCompositionsFromServer } from '@remotion/renderer';

export async function GET() {
  try {
    // Bundle the Remotion project in memory
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'app/remotion/index.tsx'),
      // If necessary, add webpack config override
      // webpackOverride: (config) => config,
    });
    
    // Get all available compositions
    const compositions = await getCompositionsFromServer(bundleLocation);
    
    // Return compositions as JSON
    return NextResponse.json({
      success: true,
      bundleLocation,
      compositions: compositions.map(c => ({
        id: c.id,
        width: c.width,
        height: c.height,
        durationInFrames: c.durationInFrames,
        fps: c.fps,
      })),
    });
  } catch (error) {
    console.error('Error creating Remotion bundle:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
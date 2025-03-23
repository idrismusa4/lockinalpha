/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Disable TypeScript build errors
  },
  // Configure webpack to handle problematic packages
  webpack: (config, { isServer }) => {
    // Handle esbuild issue
    config.resolve.alias = {
      ...config.resolve.alias,
      esbuild: 'esbuild/lib/main.js',
    };

    // Explicitly exclude esbuild type files from being processed by webpack
    config.module.rules.push({
      test: /\.d\.ts$/,
      include: /[/\\]node_modules[/\\]esbuild[/\\]/,
      type: 'javascript/auto',
    });

    // Avoid issues with Node.js specific modules on the client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        child_process: false,
        util: false,
        worker_threads: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        canvas: false,
      };

      // Ignore pdf.js-extract on the client-side
      config.resolve.alias['pdf.js-extract'] = false;
    }

    // Handle optional dependencies that might not be available
    config.externals = [...(config.externals || []), 
      '@remotion/bundler',
      '@remotion/renderer'
    ];
    
    // Add fallbacks for Node.js modules used by Remotion
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
      child_process: false,
    };

    return config;
  },
  // Increase serverless function timeout for media generation
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
  // External packages for serverless environment
  experimental: {
    serverComponentsExternalPackages: ['ffmpeg-static', 'fluent-ffmpeg', 'pdf.js-extract'],
  },
  // Optionally increase memory limit for builds if needed
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 4,
  },
  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    VERCEL: process.env.VERCEL || '0',
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
    GOOGLE_TTS_API_KEY: process.env.GOOGLE_TTS_API_KEY,
  },
  // Configure images to support remote patterns for Supabase storage
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Set output directory for deployed build
  distDir: '.next',
  // Minimize output to reduce file operations
  output: 'standalone',
};

module.exports = nextConfig;
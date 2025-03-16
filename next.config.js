/** @type {import('next').NextConfig} */
const nextConfig = {
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
      };
    }

    return config;
  },
  // Optionally increase memory limit for builds if needed
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 4,
  },
};

module.exports = nextConfig; 
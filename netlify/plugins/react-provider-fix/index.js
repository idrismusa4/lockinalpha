// Simple plugin to ensure React providers are loaded properly during build

const fs = require('fs');
const path = require('path');

module.exports = {
  onPreBuild: ({ utils }) => {
    console.log('Running React Provider Fix plugin');
    
    // Check if providers.tsx exists
    const providersPath = path.join(process.cwd(), 'app', 'providers.tsx');
    if (!fs.existsSync(providersPath)) {
      utils.build.failBuild('providers.tsx file not found in app directory');
      return;
    }
    
    console.log('✅ Found providers.tsx file');
    
    // Ensure the client directive is present
    const providerContent = fs.readFileSync(providersPath, 'utf8');
    if (!providerContent.includes("'use client'")) {
      utils.build.failBuild("providers.tsx must include 'use client' directive");
      return;
    }
    
    console.log('✅ providers.tsx has correct client directive');
    
    // Check the layout.tsx file to ensure it's using the providers
    const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');
    if (fs.existsSync(layoutPath)) {
      const layoutContent = fs.readFileSync(layoutPath, 'utf8');
      if (!layoutContent.includes('<Providers>')) {
        utils.build.failBuild('layout.tsx must use the <Providers> component');
        return;
      }
      console.log('✅ layout.tsx is correctly using the Providers component');
    } else {
      utils.build.failBuild('layout.tsx file not found in app directory');
      return;
    }
    
    console.log('✅ React Provider Fix checks passed');
  }
}; 
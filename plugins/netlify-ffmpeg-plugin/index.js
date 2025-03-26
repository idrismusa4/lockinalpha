// Custom Netlify plugin to handle FFmpeg setup

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = {
  async onPreBuild({ utils, constants }) {
    console.log('Running FFmpeg setup pre-build plugin');
    try {
      // Ensure the scripts directory exists
      if (!fs.existsSync('scripts')) {
        utils.build.failBuild('Scripts directory not found');
        return;
      }
      
      // Ensure the netlify-post-install.js script exists
      const postInstallScript = path.resolve('scripts/netlify-post-install.js');
      if (!fs.existsSync(postInstallScript)) {
        utils.build.failBuild('Netlify post-install script not found');
        return;
      }
      
      // Run the post-install script
      console.log('Running netlify-post-install.js...');
      execSync(`node ${postInstallScript}`, { stdio: 'inherit' });
      console.log('FFmpeg pre-build setup completed');
    } catch (error) {
      console.error('Error in FFmpeg pre-build setup:', error);
      // Don't fail the build
    }
  },
  
  async onFunctionsPackage({ utils, constants }) {
    console.log('Running FFmpeg post-functions-package plugin');
    try {
      // Ensure the fix-netlify-functions.js script exists
      const fixScript = path.resolve('scripts/fix-netlify-functions.js');
      if (!fs.existsSync(fixScript)) {
        utils.build.failBuild('Fix Netlify functions script not found');
        return;
      }
      
      // Run the fix script
      console.log('Running fix-netlify-functions.js...');
      execSync(`node ${fixScript}`, { stdio: 'inherit' });
      console.log('FFmpeg functions fix completed');
    } catch (error) {
      console.error('Error in FFmpeg functions fix:', error);
      // Don't fail the build
    }
  }
}; 
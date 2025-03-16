import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vojaajwajdvaftuqsftm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvamFhandhamR2YWZ0dXFzZnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjkzNzUsImV4cCI6MjA1NzY0NTM3NX0.CI0vNEy9RBXHC6mKbxDQ0qANjP85Y_xwLNLtMomDS-4';

// Check if Supabase config is provided
const checkSupabaseConfig = () => {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Missing Supabase configuration variables: ${missingVars.join(', ')}`);
    console.error('Please check your .env.local file or environment variables');
    console.warn('Using placeholder values. Please update with your actual Supabase credentials.');
  }
};

// Log a warning if Supabase config is missing
checkSupabaseConfig();

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize Supabase storage
export const storage = supabase.storage;

// Create necessary storage buckets if they don't exist
export const initializeSupabaseStorage = async () => {
  try {
    // Create videos bucket if it doesn't exist
    const { error: checkVideoBucketError } = await storage.getBucket('videos');
    
    if (checkVideoBucketError && checkVideoBucketError.message.includes('does not exist')) {
      const { error: createVideoBucketError } = await storage.createBucket('videos', {
        public: true,
        fileSizeLimit: 100 * 1024 * 1024, // 100MB limit
        allowedMimeTypes: ['video/mp4']
      });
      
      if (createVideoBucketError) {
        console.error('Error creating videos bucket:', createVideoBucketError);
      } else {
        console.log('Created videos bucket successfully');
      }
    }
    
    console.log('Supabase storage initialized');
  } catch (error) {
    console.error('Error initializing Supabase storage:', error);
  }
}; 
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vojaajwajdvaftuqsftm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvamFhandhamR2YWZ0dXFzZnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjkzNzUsImV4cCI6MjA1NzY0NTM3NX0.CI0vNEy9RBXHC6mKbxDQ0qANjP85Y_xwLNLtMomDS-4';

// Check if Supabase config is provided
const checkSupabaseConfig = () => {
  if (typeof window === 'undefined') { // Only log on server-side
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
    // Skip in development client side to prevent unnecessary requests
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      console.log('Skipping Supabase storage initialization on client in development mode');
      return;
    }
    
    console.log('Initializing Supabase storage buckets...');
    
    // Create documents bucket if it doesn't exist
    try {
      const { data: documentsData, error: checkDocumentsBucketError } = await storage.getBucket('documents');
      
      if (checkDocumentsBucketError && checkDocumentsBucketError.message.includes('does not exist')) {
        console.log('Creating documents bucket...');
        const { error: createDocumentsBucketError } = await storage.createBucket('documents', {
          public: true,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
          allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
        });
        
        if (createDocumentsBucketError) {
          console.error('Error creating documents bucket:', createDocumentsBucketError);
        } else {
          console.log('Created documents bucket successfully');
        }
      } else if (documentsData) {
        console.log('Documents bucket already exists');
      }
    } catch (docError) {
      console.error('Error checking/creating documents bucket:', docError);
    }
    
    // Create videos bucket if it doesn't exist
    try {
      const { data: videosData, error: checkVideoBucketError } = await storage.getBucket('videos');
      
      if (checkVideoBucketError && checkVideoBucketError.message.includes('does not exist')) {
        console.log('Creating videos bucket...');
        const { error: createVideoBucketError } = await storage.createBucket('videos', {
          public: true, 
          fileSizeLimit: 100 * 1024 * 1024, // 100MB limit
          allowedMimeTypes: ['video/mp4']
        });
        
        if (createVideoBucketError) {
          console.error('Error creating videos bucket:', createVideoBucketError);
        } else {
          console.log('Created videos bucket successfully');
          
          // Add public access policy
          try {
            const { error: policyError } = await storage.from('videos').createSignedUrl('policy', 31536000);
            if (policyError) {
              console.error('Error creating public policy for videos bucket:', policyError);
            }
          } catch (policyError) {
            console.error('Error setting public policy for videos bucket:', policyError);
          }
        }
      } else if (videosData) {
        console.log('Videos bucket already exists');
      }
    } catch (videoError) {
      console.error('Error checking/creating videos bucket:', videoError);
    }
    
    console.log('Supabase storage initialization completed');
  } catch (error) {
    console.error('Error initializing Supabase storage:', error);
  }
};

// Only initialize buckets on server side or in production
if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') {  
  initializeSupabaseStorage().catch(err => {
    console.error('Failed to initialize Supabase storage on load:', err);
  });
} 
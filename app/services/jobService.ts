import fs from 'fs';
import path from 'path';
import os from 'os';

export interface Job {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  script: string;
  videoUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// Path for persisted jobs (a JSON file)
const JOBS_FILE_PATH = path.join(os.tmpdir(), 'lockin-jobs.json');

// In-memory cache of jobs
const jobsCache = new Map<string, Job>();

/**
 * Initialize jobs from file system if exists
 */
function initializeJobs(): void {
  try {
    if (fs.existsSync(JOBS_FILE_PATH)) {
      const jobsData = fs.readFileSync(JOBS_FILE_PATH, 'utf8');
      const parsedJobs = JSON.parse(jobsData) as Record<string, Job>;
      
      // Clear and repopulate the cache
      jobsCache.clear();
      Object.values(parsedJobs).forEach(job => {
        jobsCache.set(job.id, job);
      });
      
      console.log(`Loaded ${jobsCache.size} jobs from storage`);
    } else {
      console.log('No jobs file found, starting with empty jobs');
      saveJobs(); // Create the initial empty file
    }
  } catch (error) {
    console.error('Error initializing jobs:', error);
    // If there's an error loading jobs, we'll start with an empty state
  }
}

// Initialize on module load
initializeJobs();

/**
 * Save jobs to persistent storage
 */
function saveJobs(): void {
  try {
    const jobsObject: Record<string, Job> = {};
    jobsCache.forEach((job, id) => {
      jobsObject[id] = job;
    });
    
    fs.writeFileSync(JOBS_FILE_PATH, JSON.stringify(jobsObject, null, 2));
    console.log(`Saved ${jobsCache.size} jobs to storage`);
  } catch (error) {
    console.error('Error saving jobs:', error);
  }
}

/**
 * Create a new rendering job
 */
export async function createJob(jobId: string, script: string): Promise<Job> {
  const now = new Date().toISOString();
  
  const job: Job = {
    id: jobId,
    status: 'pending',
    progress: 0,
    script,
    createdAt: now,
    updatedAt: now,
  };
  
  // Save to in-memory cache
  jobsCache.set(jobId, job);
  console.log(`Job created: ${jobId}. Total jobs in memory: ${jobsCache.size}`);
  
  // Persist to storage
  saveJobs();
  
  return job;
}

/**
 * Update a job's status and progress
 */
export async function updateJobStatus(
  jobId: string, 
  updates: Partial<Omit<Job, 'id' | 'createdAt'>>
): Promise<Job | null> {
  try {
    const job = jobsCache.get(jobId);
    
    if (!job) {
      console.log(`Job not found when updating: ${jobId}`);
      return null;
    }
    
    const updatedJob = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    // Update in memory cache
    jobsCache.set(jobId, updatedJob);
    console.log(`Job updated: ${jobId}, new status: ${updatedJob.status}, progress: ${updatedJob.progress}`);
    
    // Persist changes
    saveJobs();
    
    return updatedJob;
  } catch (error) {
    console.error(`Error updating job ${jobId}:`, error);
    throw new Error(`Failed to update job: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get a job's current status - make sure to reload from disk first
 */
export async function getJobStatus(jobId: string): Promise<Job | null> {
  try {
    // Always reload from storage first to ensure we have the latest data
    initializeJobs();
    
    // Check in-memory cache
    const job = jobsCache.get(jobId);
    
    if (!job) {
      console.log(`Job not found: ${jobId}. Total jobs in memory: ${jobsCache.size}`);
      // List all job IDs for debugging
      console.log('Available job IDs:', Array.from(jobsCache.keys()));
      return null;
    }
    
    console.log(`Retrieved job: ${jobId}, status: ${job.status}, progress: ${job.progress}`);
    return job;
  } catch (error) {
    console.error(`Error getting job ${jobId}:`, error);
    throw new Error(`Failed to get job status: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Update job progress
 */
export async function updateJobProgress(jobId: string, progress: number): Promise<void> {
  try {
    await updateJobStatus(jobId, { progress });
    console.log(`Job progress updated: ${jobId}, progress: ${progress}%`);
  } catch (error) {
    console.error(`Error updating job progress for ${jobId}:`, error);
    // Don't throw here to avoid crashing the rendering process
  }
}

/**
 * Mark a job as completed with a video URL
 */
export async function completeJob(jobId: string, videoUrl: string): Promise<void> {
  try {
    await updateJobStatus(jobId, {
      status: 'completed',
      progress: 100,
      videoUrl,
    });
    console.log(`Job completed: ${jobId}, videoUrl: ${videoUrl}`);
  } catch (error) {
    console.error(`Error completing job ${jobId}:`, error);
    throw new Error(`Failed to complete job: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Mark a job as failed with an error message
 */
export async function failJob(jobId: string, error: string): Promise<void> {
  try {
    await updateJobStatus(jobId, {
      status: 'failed',
      error,
    });
    console.log(`Job failed: ${jobId}, error: ${error}`);
  } catch (err) {
    console.error(`Error marking job ${jobId} as failed:`, err);
    // Don't throw here to avoid double errors
  }
} 
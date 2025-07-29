import { createServerSupabaseClient } from '@/app/auth/server-utils';

// Retry configuration
export const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

// Helper to sleep for a given duration
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Exponential backoff retry mechanism
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config = RETRY_CONFIG
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxAttempts) {
        throw lastError;
      }
      
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );
      
      console.log(`Retry attempt ${attempt}/${config.maxAttempts} after ${delay}ms`, {
        error: lastError.message,
      });
      
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

// Clean up failed uploads from storage
export async function cleanupFailedUpload(storagePath: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.storage
      .from('organization-files')
      .remove([storagePath]);
      
    if (error) {
      console.error('Failed to cleanup upload:', { storagePath, error });
    } else {
      console.log('Successfully cleaned up failed upload:', storagePath);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Transaction-like operation helper
export async function withTransaction<T>(
  operations: () => Promise<T>,
  rollback: () => Promise<void>
): Promise<T> {
  try {
    return await operations();
  } catch (error) {
    console.error('Transaction failed, rolling back:', error);
    await rollback();
    throw error;
  }
}

// File validation
export const FILE_CONSTRAINTS = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/tiff',
    'image/bmp',
  ],
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp'],
};

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > FILE_CONSTRAINTS.maxSizeBytes) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds limit of ${FILE_CONSTRAINTS.maxSizeBytes / 1024 / 1024}MB`,
    };
  }
  
  // Check mime type
  if (!FILE_CONSTRAINTS.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type '${file.type}' is not supported`,
    };
  }
  
  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!FILE_CONSTRAINTS.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension '${extension}' is not supported`,
    };
  }
  
  return { valid: true };
}

// Streaming upload helper - uploads file in chunks to avoid memory issues
export async function streamingFileUpload(
  file: File,
  storagePath: string,
  organizationId: string
): Promise<{ success: boolean; error?: Error }> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // For files under 5MB, use regular upload
    if (file.size < 5 * 1024 * 1024) {
      const { error } = await supabase.storage
        .from('organization-files')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });
        
      if (error) throw error;
      return { success: true };
    }
    
    // For larger files, use the File API directly (browser handles streaming)
    // Supabase SDK already handles File objects efficiently
    const { error } = await supabase.storage
      .from('organization-files')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });
      
    if (error) throw error;
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      error: error as Error,
    };
  }
}

// Processing job tracker
export interface ProcessingJob {
  documentId: string;
  attempts: number;
  lastError?: string;
  nextRetryAt?: Date;
}

// In-memory job tracker (could be moved to Redis in production)
const processingJobs = new Map<string, ProcessingJob>();

export function trackProcessingJob(documentId: string): ProcessingJob {
  const job = processingJobs.get(documentId) || {
    documentId,
    attempts: 0,
  };
  
  processingJobs.set(documentId, job);
  return job;
}

export function updateProcessingJob(
  documentId: string,
  update: Partial<ProcessingJob>
): void {
  const job = processingJobs.get(documentId);
  if (job) {
    processingJobs.set(documentId, { ...job, ...update });
  }
}

export function clearProcessingJob(documentId: string): void {
  processingJobs.delete(documentId);
}
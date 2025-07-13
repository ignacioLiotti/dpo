import { revalidatePath } from 'next/cache';

// =============================================================================
// ERROR TYPES
// =============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'User not authenticated') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

// =============================================================================
// ERROR RESPONSE TYPE
// =============================================================================

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  warnings?: string[];
}

export type ActionResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// =============================================================================
// ERROR HANDLING WRAPPER
// =============================================================================

/**
 * Wrap an async function with standardized error handling
 */
export function withErrorHandling<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options?: {
    revalidatePaths?: string[];
    logErrors?: boolean;
    defaultErrorMessage?: string;
  }
): (...args: TArgs) => Promise<ActionResponse<TResult>> {
  return async (...args: TArgs): Promise<ActionResponse<TResult>> => {
    try {
      const result = await fn(...args);
      
      // Revalidate paths on success if specified
      if (options?.revalidatePaths) {
        options.revalidatePaths.forEach(path => revalidatePath(path));
      }
      
      return { success: true, data: result };
    } catch (error) {
      // Log error if enabled
      if (options?.logErrors !== false) {
        console.error(`Error in ${fn.name || 'anonymous function'}:`, error);
      }

      // Handle different error types
      if (error instanceof AppError) {
        return {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        };
      }

      if (error instanceof Error) {
        // Check for Supabase errors
        if ('code' in error && typeof error.code === 'string') {
          return handleSupabaseError(error);
        }

        return {
          success: false,
          error: error.message || options?.defaultErrorMessage || 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR'
        };
      }

      return {
        success: false,
        error: options?.defaultErrorMessage || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      };
    }
  };
}

/**
 * Handle Supabase-specific errors
 */
function handleSupabaseError(error: any): ErrorResponse {
  const code = error.code;
  const message = error.message;

  // Common Supabase error codes
  switch (code) {
    case 'PGRST301':
      return {
        success: false,
        error: 'No data found',
        code: 'NOT_FOUND'
      };
    
    case '23505': // Unique violation
      return {
        success: false,
        error: 'This record already exists',
        code: 'DUPLICATE_ENTRY',
        details: { originalMessage: message }
      };
    
    case '23503': // Foreign key violation
      return {
        success: false,
        error: 'Related record not found',
        code: 'FOREIGN_KEY_VIOLATION',
        details: { originalMessage: message }
      };
    
    case '42501': // Insufficient privilege
      return {
        success: false,
        error: 'Insufficient permissions',
        code: 'AUTHORIZATION_ERROR'
      };
    
    case 'PGRST202': // No rows returned
      return {
        success: false,
        error: 'No matching records found',
        code: 'NOT_FOUND'
      };
    
    default:
      return {
        success: false,
        error: message || 'Database operation failed',
        code: code || 'DATABASE_ERROR'
      };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a safe server action with error handling
 */
export function createSafeAction<TInput, TOutput>(
  handler: (input: TInput) => Promise<TOutput>,
  options?: {
    revalidatePaths?: string[];
    requireAuth?: boolean;
    requireRole?: 'owner' | 'admin' | 'member';
  }
) {
  return withErrorHandling(async (input: TInput) => {
    // Add authentication check if required
    if (options?.requireAuth) {
      const { getUserOrganization } = await import('./auth-utils');
      await getUserOrganization(); // Will throw if not authenticated
    }

    // Add role check if required
    if (options?.requireRole) {
      const { requireOrganizationRole } = await import('./auth-utils');
      await requireOrganizationRole(options.requireRole);
    }

    return handler(input);
  }, {
    revalidatePaths: options?.revalidatePaths,
    logErrors: true
  });
}

/**
 * Batch error collector for operations that shouldn't fail entirely
 */
export class ErrorCollector {
  private errors: Array<{ item: string; error: string }> = [];
  private successes = 0;

  addError(item: string, error: Error | string) {
    this.errors.push({
      item,
      error: error instanceof Error ? error.message : error
    });
  }

  addSuccess() {
    this.successes++;
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  getResult() {
    return {
      success: this.successes > 0,
      successCount: this.successes,
      errorCount: this.errors.length,
      errors: this.errors,
      warnings: this.hasErrors() 
        ? this.errors.map(e => `${e.item}: ${e.error}`)
        : undefined
    };
  }
}

/**
 * Retry wrapper for flaky operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = true } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxAttempts) {
        const waitTime = backoff ? delay * attempt : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('Max retry attempts reached');
}

/**
 * Format error messages for user display
 */
export function formatErrorForUser(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message;
  }
  
  if (error instanceof AuthenticationError) {
    return 'Please sign in to continue';
  }
  
  if (error instanceof AuthorizationError) {
    return 'You do not have permission to perform this action';
  }
  
  if (error instanceof NotFoundError) {
    return error.message;
  }
  
  if (error instanceof Error && error.message) {
    // Remove technical details from error messages
    const userMessage = error.message
      .replace(/\b(uuid|id|constraint|relation|column)\b/gi, '')
      .replace(/['"]/g, '')
      .trim();
    
    return userMessage || 'An error occurred. Please try again.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}
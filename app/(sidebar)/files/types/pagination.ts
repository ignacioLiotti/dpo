// Pagination types and utilities for files management system

export interface PaginationParams {
  page?: number;           // 1-based page number
  limit?: number;          // Items per page (max 100)
  offset?: number;         // Alternative to page, 0-based offset
  cursor?: string;         // Cursor-based pagination (for large datasets)
}

export interface PaginationMeta {
  page: number;            // Current page (1-based)
  limit: number;           // Items per page
  total: number;           // Total items available
  totalPages: number;      // Total pages available
  hasNext: boolean;        // Whether there's a next page
  hasPrev: boolean;        // Whether there's a previous page
  nextCursor?: string;     // Next cursor for cursor-based pagination
  prevCursor?: string;     // Previous cursor for cursor-based pagination
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  error?: string;
}

export interface SortOptions {
  field: string;           // Field to sort by
  direction: 'asc' | 'desc'; // Sort direction
}

export interface FilterOptions {
  search?: string;         // Text search query
  folder_id?: string;      // Filter by folder
  file_type?: string;      // Filter by MIME type
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  date_from?: string;      // ISO date string
  date_to?: string;        // ISO date string
  user_id?: string;        // Filter by uploader
  min_confidence?: number; // Minimum AI confidence score
  has_extraction?: boolean; // Whether file has extracted data
  is_verified?: boolean;   // Whether extraction is verified
}

export interface QueryOptions extends PaginationParams {
  sort?: SortOptions;
  filters?: FilterOptions;
}

// =============================================================================
// PAGINATION UTILITIES
// =============================================================================

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  maxLimit: 100
} as const;

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev
  };
}

/**
 * Normalize pagination parameters
 */
export function normalizePagination(params: PaginationParams): {
  limit: number;
  offset: number;
  page: number;
} {
  // Determine limit (with max constraint)
  const limit = Math.min(
    params.limit || DEFAULT_PAGINATION.limit,
    DEFAULT_PAGINATION.maxLimit
  );

  // Calculate offset and page
  let offset: number;
  let page: number;

  if (params.offset !== undefined) {
    // Use offset directly if provided
    offset = Math.max(0, params.offset);
    page = Math.floor(offset / limit) + 1;
  } else {
    // Use page-based calculation
    page = Math.max(1, params.page || DEFAULT_PAGINATION.page);
    offset = (page - 1) * limit;
  }

  return { limit, offset, page };
}

/**
 * Build Supabase query with pagination
 */
export function applyPagination<T>(
  query: any,
  pagination: PaginationParams
) {
  const { limit, offset } = normalizePagination(pagination);
  
  return query
    .range(offset, offset + limit - 1)
    .limit(limit);
}

/**
 * Apply sorting to Supabase query
 */
export function applySorting(query: any, sort?: SortOptions) {
  if (sort?.field && sort?.direction) {
    return query.order(sort.field, { ascending: sort.direction === 'asc' });
  }
  
  // Default sorting by created_at desc
  return query.order('created_at', { ascending: false });
}

/**
 * Apply filters to documents query
 */
export function applyDocumentFilters(query: any, filters?: FilterOptions) {
  if (!filters) return query;

  // Text search (using full-text search)
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,ai_description.ilike.%${filters.search}%,ocr_text.ilike.%${filters.search}%`);
  }

  // Folder filter
  if (filters.folder_id) {
    query = query.eq('folder_id', filters.folder_id);
  }

  // File type filter
  if (filters.file_type) {
    query = query.eq('file_type', filters.file_type);
  }

  // Processing status filter
  if (filters.processing_status) {
    query = query.eq('processing_status', filters.processing_status);
  }

  // Date range filters
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  // User filter
  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  // AI confidence filter
  if (filters.min_confidence !== undefined) {
    query = query.gte('analysis_confidence', filters.min_confidence);
  }

  // Extraction status filters
  if (filters.has_extraction !== undefined) {
    if (filters.has_extraction) {
      query = query.gt('extracted_fields_count', 0);
    } else {
      query = query.eq('extracted_fields_count', 0);
    }
  }

  if (filters.is_verified !== undefined) {
    if (filters.is_verified) {
      query = query.gt('verified_fields_count', 0);
    } else {
      query = query.eq('verified_fields_count', 0);
    }
  }

  return query;
}

// =============================================================================
// CURSOR-BASED PAGINATION (for very large datasets)
// =============================================================================

export interface CursorPaginationParams {
  limit?: number;
  cursor?: string;         // Base64 encoded cursor
  direction?: 'next' | 'prev';
}

export interface CursorMeta {
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  prevCursor?: string;
  limit: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: CursorMeta;
  error?: string;
}

/**
 * Create cursor from record
 */
export function createCursor(record: any, field = 'created_at'): string {
  const cursorData = {
    field,
    value: record[field],
    id: record.id
  };
  
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
}

/**
 * Parse cursor
 */
export function parseCursor(cursor: string): {
  field: string;
  value: any;
  id: string;
} | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Apply cursor pagination to query
 */
export function applyCursorPagination(
  query: any,
  params: CursorPaginationParams,
  sortField = 'created_at'
) {
  const limit = Math.min(params.limit || 20, 100);
  
  if (params.cursor) {
    const cursorData = parseCursor(params.cursor);
    
    if (cursorData && cursorData.field === sortField) {
      if (params.direction === 'prev') {
        query = query.gt(sortField, cursorData.value);
      } else {
        query = query.lt(sortField, cursorData.value);
      }
    }
  }
  
  return query.limit(limit + 1); // Fetch one extra to check for next page
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
  cursor: z.string().optional()
});

export const sortSchema = z.object({
  field: z.string().min(1),
  direction: z.enum(['asc', 'desc'])
});

export const documentFiltersSchema = z.object({
  search: z.string().optional(),
  folder_id: z.string().uuid().optional(),
  file_type: z.string().optional(),
  processing_status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  user_id: z.string().uuid().optional(),
  min_confidence: z.number().min(0).max(1).optional(),
  has_extraction: z.boolean().optional(),
  is_verified: z.boolean().optional()
});

export const queryOptionsSchema = z.object({
  ...paginationSchema.shape,
  sort: sortSchema.optional(),
  filters: documentFiltersSchema.optional()
});

export type ValidatedQueryOptions = z.infer<typeof queryOptionsSchema>;
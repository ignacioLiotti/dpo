'use server';

import { createClient } from '@/supabase/server';
import { 
  PaginatedResponse, 
  QueryOptions, 
  calculatePaginationMeta, 
  normalizePagination,
  applyDocumentFilters,
  applySorting,
  queryOptionsSchema
} from '../types/pagination';
import type { ObraDocument, Folder } from '../types';

// =============================================================================
// SHARED UTILITIES
// =============================================================================

async function getUserOrganization(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const { data: orgId } = await supabase.rpc('get_user_organization_id');
  if (!orgId) {
    throw new Error('User is not a member of any organization');
  }

  return { user, organizationId: orgId };
}

/**
 * Get total count for pagination metadata
 */
async function getTotalCount(supabase: any, tableName: string, organizationId: string, filters?: any): Promise<number> {
  let countQuery = supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if (filters) {
    countQuery = applyDocumentFilters(countQuery, filters);
  }

  const { count, error } = await countQuery;
  
  if (error) {
    console.error('Error getting count:', error);
    return 0;
  }

  return count || 0;
}

// =============================================================================
// PAGINATED DOCUMENT QUERIES
// =============================================================================

/**
 * Get documents with full pagination support
 */
export async function getDocumentsPaginated(
  options: QueryOptions = {}
): Promise<PaginatedResponse<ObraDocument>> {
  try {
    // Validate input
    const validatedOptions = queryOptionsSchema.parse(options);
    const { limit, offset, page } = normalizePagination(validatedOptions);
    
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);

    // Get total count for pagination metadata
    const total = await getTotalCount(
      supabase, 
      'documents_with_folders', 
      organizationId, 
      validatedOptions.filters
    );

    // Build main query
    let query = supabase
      .from('documents_with_folders')
      .select('*')
      .eq('organization_id', organizationId);

    // Apply filters
    query = applyDocumentFilters(query, validatedOptions.filters);

    // Apply sorting
    query = applySorting(query, validatedOptions.sort);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error fetching paginated documents:', error);
      return {
        data: [],
        meta: calculatePaginationMeta(page, limit, 0),
        error: error.message
      };
    }

    // Calculate pagination metadata
    const meta = calculatePaginationMeta(page, limit, total);

    return {
      data: documents || [],
      meta,
      error: undefined
    };

  } catch (error) {
    console.error('Error in getDocumentsPaginated:', error);
    return {
      data: [],
      meta: calculatePaginationMeta(1, 20, 0),
      error: error instanceof Error ? error.message : 'Failed to fetch documents'
    };
  }
}

/**
 * Get folders with pagination support
 */
export async function getFoldersPaginated(
  options: QueryOptions = {}
): Promise<PaginatedResponse<Folder>> {
  try {
    const validatedOptions = queryOptionsSchema.parse(options);
    const { limit, offset, page } = normalizePagination(validatedOptions);
    
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);

    // Get total count
    const total = await getTotalCount(supabase, 'folders_with_counts', organizationId);

    // Build query
    let query = supabase
      .from('folders_with_counts')
      .select('*')
      .eq('organization_id', organizationId);

    // Apply search filter for folders
    if (validatedOptions.filters?.search) {
      query = query.ilike('name', `%${validatedOptions.filters.search}%`);
    }

    // Apply sorting (default by sort_order)
    const sort = validatedOptions.sort || { field: 'sort_order', direction: 'asc' };
    query = applySorting(query, sort);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: folders, error } = await query;

    if (error) {
      console.error('Error fetching paginated folders:', error);
      return {
        data: [],
        meta: calculatePaginationMeta(page, limit, 0),
        error: error.message
      };
    }

    const meta = calculatePaginationMeta(page, limit, total);

    return {
      data: folders || [],
      meta,
      error: undefined
    };

  } catch (error) {
    console.error('Error in getFoldersPaginated:', error);
    return {
      data: [],
      meta: calculatePaginationMeta(1, 20, 0),
      error: error instanceof Error ? error.message : 'Failed to fetch folders'
    };
  }
}

/**
 * Search documents with advanced pagination and filtering
 */
export async function searchDocumentsPaginated(
  searchQuery: string,
  options: QueryOptions = {}
): Promise<PaginatedResponse<ObraDocument>> {
  try {
    const validatedOptions = queryOptionsSchema.parse({
      ...options,
      filters: {
        ...options.filters,
        search: searchQuery
      }
    });

    // Use the existing getDocumentsPaginated function with search filter
    return await getDocumentsPaginated(validatedOptions);

  } catch (error) {
    console.error('Error in searchDocumentsPaginated:', error);
    return {
      data: [],
      meta: calculatePaginationMeta(1, 20, 0),
      error: error instanceof Error ? error.message : 'Failed to search documents'
    };
  }
}

// =============================================================================
// SPECIALIZED PAGINATED QUERIES
// =============================================================================

/**
 * Get documents by processing status with pagination
 */
export async function getDocumentsByStatusPaginated(
  status: 'pending' | 'processing' | 'completed' | 'failed',
  options: QueryOptions = {}
): Promise<PaginatedResponse<ObraDocument>> {
  return getDocumentsPaginated({
    ...options,
    filters: {
      ...options.filters,
      processing_status: status
    }
  });
}

/**
 * Get documents by folder with pagination
 */
export async function getDocumentsByFolderPaginated(
  folderId: string,
  options: QueryOptions = {}
): Promise<PaginatedResponse<ObraDocument>> {
  return getDocumentsPaginated({
    ...options,
    filters: {
      ...options.filters,
      folder_id: folderId
    }
  });
}

/**
 * Get documents by file type with pagination
 */
export async function getDocumentsByTypePaginated(
  fileType: string,
  options: QueryOptions = {}
): Promise<PaginatedResponse<ObraDocument>> {
  return getDocumentsPaginated({
    ...options,
    filters: {
      ...options.filters,
      file_type: fileType
    }
  });
}

/**
 * Get recently uploaded documents with pagination
 */
export async function getRecentDocumentsPaginated(
  days: number = 7,
  options: QueryOptions = {}
): Promise<PaginatedResponse<ObraDocument>> {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  return getDocumentsPaginated({
    ...options,
    filters: {
      ...options.filters,
      date_from: dateFrom.toISOString()
    },
    sort: {
      field: 'created_at',
      direction: 'desc'
    }
  });
}

/**
 * Get documents requiring review (low confidence) with pagination
 */
export async function getDocumentsRequiringReviewPaginated(
  maxConfidence: number = 0.7,
  options: QueryOptions = {}
): Promise<PaginatedResponse<ObraDocument>> {
  return getDocumentsPaginated({
    ...options,
    filters: {
      ...options.filters,
      min_confidence: 0, // Include all documents
      has_extraction: true // Only documents with extractions
    },
    sort: {
      field: 'analysis_confidence',
      direction: 'asc' // Lowest confidence first
    }
  });
}

// =============================================================================
// ANALYTICS WITH PAGINATION
// =============================================================================

/**
 * Get file statistics by type
 */
export async function getFileTypeStatistics() {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);

    const { data, error } = await supabase
      .from('files')
      .select('file_type, file_size')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      return { data: [], error: error.message };
    }

    // Group by file type and calculate statistics
    const stats = (data || []).reduce((acc: any, file: any) => {
      if (!acc[file.file_type]) {
        acc[file.file_type] = {
          file_type: file.file_type,
          count: 0,
          total_size: 0,
          avg_size: 0
        };
      }

      acc[file.file_type].count += 1;
      acc[file.file_type].total_size += file.file_size;
      acc[file.file_type].avg_size = acc[file.file_type].total_size / acc[file.file_type].count;

      return acc;
    }, {});

    return {
      data: Object.values(stats),
      error: null
    };

  } catch (error) {
    console.error('Error in getFileTypeStatistics:', error);
    return {
      data: [],
      error: 'Failed to fetch file type statistics'
    };
  }
}

/**
 * Get upload activity by date range
 */
export async function getUploadActivity(days: number = 30) {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const { data, error } = await supabase
      .from('files')
      .select('created_at, file_size, processing_status')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .gte('created_at', dateFrom.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    // Group by date
    const dailyStats = (data || []).reduce((acc: any, file: any) => {
      const date = new Date(file.created_at).toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          uploads: 0,
          total_size: 0,
          completed: 0,
          failed: 0,
          pending: 0
        };
      }

      acc[date].uploads += 1;
      acc[date].total_size += file.file_size;
      
      if (file.processing_status === 'completed') acc[date].completed += 1;
      else if (file.processing_status === 'failed') acc[date].failed += 1;
      else acc[date].pending += 1;

      return acc;
    }, {});

    return {
      data: Object.values(dailyStats),
      error: null
    };

  } catch (error) {
    console.error('Error in getUploadActivity:', error);
    return {
      data: [],
      error: 'Failed to fetch upload activity'
    };
  }
}

// =============================================================================
// EXPORT FOR BACKWARD COMPATIBILITY
// =============================================================================

export {
  getDocumentsPaginated as getDocuments,
  getFoldersPaginated as getFolders,
  searchDocumentsPaginated as searchDocuments
};
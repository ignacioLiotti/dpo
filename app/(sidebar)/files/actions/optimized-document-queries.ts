'use server';

import { createClient } from '@/supabase/server';
import type { ObraDocument, Folder } from '../types';

// Helper function to get user's organization (will be moved to shared utility later)
async function getUserOrganization(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Get user's organization
  const { data: orgId } = await supabase.rpc('get_user_organization_id');
  if (!orgId) {
    throw new Error('User is not a member of any organization');
  }

  return { user, organizationId: orgId };
}

// =============================================================================
// OPTIMIZED DOCUMENT QUERIES USING NEW VIEWS
// =============================================================================

/**
 * Get all documents for an organization with folder information - OPTIMIZED VERSION
 * Uses the new documents_with_folders view instead of complex nested queries
 */
export async function getOrganizationDocumentsWithFoldersOptimized(options?: {
  limit?: number;
  offset?: number;
  search?: string;
  folder_id?: string;
  processing_status?: string;
  file_type?: string;
}) {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);
    
    // Start with the optimized view
    let query = supabase
      .from('documents_with_folders')
      .select('*')
      .eq('organization_id', organizationId);

    // Apply filters
    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,ai_description.ilike.%${options.search}%`);
    }

    if (options?.folder_id) {
      query = query.eq('folder_id', options.folder_id);
    }

    if (options?.processing_status) {
      query = query.eq('processing_status', options.processing_status);
    }

    if (options?.file_type) {
      query = query.eq('file_type', options.file_type);
    }

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options?.limit || 50)) - 1);
    }

    // Order by creation date (most recent first)
    query = query.order('created_at', { ascending: false });

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      return { documents: [], error: error.message };
    }

    return { documents: documents || [], error: null };

  } catch (error) {
    console.error('Error in getOrganizationDocumentsWithFoldersOptimized:', error);
    return { documents: [], error: 'Failed to fetch documents' };
  }
}

/**
 * Get organization folders with counts - OPTIMIZED VERSION
 * Uses the new folders_with_counts view
 */
export async function getOrganizationFoldersOptimized() {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);
    
    const { data: folders, error } = await supabase
      .from('folders_with_counts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching folders:', error);
      return { folders: [], error: error.message };
    }

    return { folders: folders || [], error: null };

  } catch (error) {
    console.error('Error in getOrganizationFoldersOptimized:', error);
    return { folders: [], error: 'Failed to fetch folders' };
  }
}

/**
 * Get extraction overview for a folder - OPTIMIZED VERSION
 * Uses the new extraction_overview view
 */
export async function getFolderExtractionOverviewOptimized(folderId: string) {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);
    
    const { data: extractionData, error } = await supabase
      .from('extraction_overview')
      .select('*')
      .eq('folder_id', folderId)
      .eq('organization_id', organizationId)
      .order('file_created_at', { ascending: false });

    if (error) {
      console.error('Error fetching extraction overview:', error);
      return { data: [], error: error.message };
    }

    return { data: extractionData || [], error: null };

  } catch (error) {
    console.error('Error in getFolderExtractionOverviewOptimized:', error);
    return { data: [], error: 'Failed to fetch extraction overview' };
  }
}

/**
 * Get processing status overview - NEW FEATURE
 * Uses the new processing_status_overview view
 */
export async function getProcessingStatusOverview() {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);
    
    const { data: statusData, error } = await supabase
      .from('processing_status_overview')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error fetching processing status:', error);
      return { data: [], error: error.message };
    }

    return { data: statusData || [], error: null };

  } catch (error) {
    console.error('Error in getProcessingStatusOverview:', error);
    return { data: [], error: 'Failed to fetch processing status' };
  }
}

/**
 * Get user activity summary - NEW FEATURE
 * Uses the new user_activity_summary view
 */
export async function getUserActivitySummary() {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);
    
    const { data: activityData, error } = await supabase
      .from('user_activity_summary')
      .select('*')
      .eq('organization_id', organizationId)
      .order('total_files_uploaded', { ascending: false });

    if (error) {
      console.error('Error fetching user activity:', error);
      return { data: [], error: error.message };
    }

    return { data: activityData || [], error: null };

  } catch (error) {
    console.error('Error in getUserActivitySummary:', error);
    return { data: [], error: 'Failed to fetch user activity' };
  }
}

// =============================================================================
// BATCH OPERATIONS - NEW OPTIMIZED FUNCTIONS
// =============================================================================

/**
 * Batch update documents - OPTIMIZED VERSION
 * Updates multiple documents in a single transaction
 */
export async function batchUpdateDocuments(updates: Array<{
  id: string;
  name?: string;
  folder_id?: string;
  processing_status?: string;
}>) {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);
    
    // Use a transaction for batch updates
    const { data, error } = await supabase.rpc('batch_update_files', {
      file_updates: updates,
      organization_id: organizationId
    });

    if (error) {
      console.error('Error in batch update:', error);
      return { success: false, error: error.message };
    }

    return { success: true, updated_count: updates.length, error: null };

  } catch (error) {
    console.error('Error in batchUpdateDocuments:', error);
    return { success: false, error: 'Failed to batch update documents' };
  }
}

/**
 * Batch move documents to folder - OPTIMIZED VERSION
 */
export async function batchMoveDocumentsToFolder(documentIds: string[], targetFolderId: string) {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);
    
    // First, remove existing folder assignments
    await supabase
      .from('file_folder_assignments')
      .delete()
      .in('file_id', documentIds);

    // Then create new assignments in batch
    const assignments = documentIds.map(fileId => ({
      file_id: fileId,
      folder_id: targetFolderId,
      user_id: user.id,
      sort_order: 0
    }));

    const { data, error } = await supabase
      .from('file_folder_assignments')
      .insert(assignments);

    if (error) {
      console.error('Error in batch move:', error);
      return { success: false, error: error.message };
    }

    return { success: true, moved_count: documentIds.length, error: null };

  } catch (error) {
    console.error('Error in batchMoveDocumentsToFolder:', error);
    return { success: false, error: 'Failed to batch move documents' };
  }
}

/**
 * Batch delete documents - OPTIMIZED VERSION (soft delete)
 */
export async function batchDeleteDocuments(documentIds: string[]) {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);
    
    const { data, error } = await supabase
      .from('files')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('id', documentIds)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error in batch delete:', error);
      return { success: false, error: error.message };
    }

    return { success: true, deleted_count: documentIds.length, error: null };

  } catch (error) {
    console.error('Error in batchDeleteDocuments:', error);
    return { success: false, error: 'Failed to batch delete documents' };
  }
}

// =============================================================================
// SEARCH OPTIMIZATIONS
// =============================================================================

/**
 * Advanced search with full-text capabilities - OPTIMIZED VERSION
 * Uses PostgreSQL full-text search indexes
 */
export async function searchDocumentsAdvanced(searchOptions: {
  query: string;
  folder_id?: string;
  file_type?: string;
  date_from?: string;
  date_to?: string;
  min_confidence?: number;
  limit?: number;
  offset?: number;
}) {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);
    
    let query = supabase
      .from('documents_with_folders')
      .select('*')
      .eq('organization_id', organizationId);

    // Full-text search using the GIN index
    if (searchOptions.query) {
      query = query.or(`name.fts.${searchOptions.query},ocr_text.fts.${searchOptions.query},ai_description.fts.${searchOptions.query}`);
    }

    // Apply filters
    if (searchOptions.folder_id) {
      query = query.eq('folder_id', searchOptions.folder_id);
    }

    if (searchOptions.file_type) {
      query = query.eq('file_type', searchOptions.file_type);
    }

    if (searchOptions.date_from) {
      query = query.gte('created_at', searchOptions.date_from);
    }

    if (searchOptions.date_to) {
      query = query.lte('created_at', searchOptions.date_to);
    }

    if (searchOptions.min_confidence) {
      query = query.gte('analysis_confidence', searchOptions.min_confidence);
    }

    // Apply pagination
    if (searchOptions.limit) {
      query = query.limit(searchOptions.limit);
    }

    if (searchOptions.offset) {
      query = query.range(searchOptions.offset, (searchOptions.offset + (searchOptions.limit || 50)) - 1);
    }

    // Order by relevance and date
    query = query.order('analysis_confidence', { ascending: false })
                  .order('created_at', { ascending: false });

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error in advanced search:', error);
      return { documents: [], error: error.message };
    }

    return { documents: documents || [], error: null };

  } catch (error) {
    console.error('Error in searchDocumentsAdvanced:', error);
    return { documents: [], error: 'Failed to search documents' };
  }
}

// =============================================================================
// ANALYTICS QUERIES
// =============================================================================

/**
 * Get organization analytics - NEW FEATURE
 */
export async function getOrganizationAnalytics() {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);
    
    // Get various analytics in parallel
    const [
      { data: processingStatus },
      { data: userActivity },
      { data: folderStats }
    ] = await Promise.all([
      supabase.from('processing_status_overview').select('*').eq('organization_id', organizationId),
      supabase.from('user_activity_summary').select('*').eq('organization_id', organizationId),
      supabase.from('folders_with_counts').select('*').eq('organization_id', organizationId)
    ]);

    // Calculate total statistics
    const totalFiles = processingStatus?.reduce((sum, status) => sum + status.file_count, 0) || 0;
    const totalSize = processingStatus?.reduce((sum, status) => sum + status.total_size_bytes, 0) || 0;
    const totalFolders = folderStats?.length || 0;
    const activeUsers = userActivity?.length || 0;

    return {
      data: {
        overview: {
          total_files: totalFiles,
          total_size_bytes: totalSize,
          total_folders: totalFolders,
          active_users: activeUsers
        },
        processing_status: processingStatus || [],
        user_activity: userActivity || [],
        folder_statistics: folderStats || []
      },
      error: null
    };

  } catch (error) {
    console.error('Error in getOrganizationAnalytics:', error);
    return { data: null, error: 'Failed to fetch analytics' };
  }
}

// =============================================================================
// EXPORT UTILITY
// =============================================================================

/**
 * Export functions for backward compatibility and gradual migration
 */
export {
  getOrganizationDocumentsWithFoldersOptimized as getDocumentsOptimized,
  getOrganizationFoldersOptimized as getFoldersOptimized,
  getFolderExtractionOverviewOptimized as getExtractionOptimized,
  searchDocumentsAdvanced as searchAdvanced
};
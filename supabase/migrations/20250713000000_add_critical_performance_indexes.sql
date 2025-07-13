-- Critical performance indexes for files management system
-- Migration: 20250713000000_add_critical_performance_indexes.sql

-- =============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- =============================================================================

-- Files with organization + status (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_files_org_status ON public.files(organization_id, processing_status) WHERE is_active = true;

-- Files with organization + active status (for main listings)
CREATE INDEX IF NOT EXISTS idx_files_org_active ON public.files(organization_id, is_active, created_at DESC);

-- Folders with organization + active status
CREATE INDEX IF NOT EXISTS idx_folders_org_active ON public.folders(organization_id, is_active, sort_order);

-- File folder assignments for quick folder->files lookups
CREATE INDEX IF NOT EXISTS idx_file_folder_assignments_folder_files ON public.file_folder_assignments(folder_id, file_id);

-- =============================================================================
-- SEARCH AND FILTERING INDEXES
-- =============================================================================

-- Full-text search on file names (for search functionality)
CREATE INDEX IF NOT EXISTS idx_files_name_search ON public.files USING gin(to_tsvector('english', name)) WHERE is_active = true;

-- File type filtering (common in UI)
CREATE INDEX IF NOT EXISTS idx_files_type_org ON public.files(file_type, organization_id) WHERE is_active = true;

-- File size for statistics and cleanup
CREATE INDEX IF NOT EXISTS idx_files_size_created ON public.files(file_size, created_at) WHERE is_active = true;

-- =============================================================================
-- AI ANALYSIS AND EXTRACTION INDEXES
-- =============================================================================

-- File analysis lookup optimization
CREATE INDEX IF NOT EXISTS idx_file_analysis_confidence ON public.file_analysis(confidence_score, created_at DESC);

-- Extracted data by folder (for extraction views)
CREATE INDEX IF NOT EXISTS idx_extracted_data_folder_verified ON public.extracted_data(folder_id, is_verified, created_at DESC);

-- Extracted data confidence for quality metrics
CREATE INDEX IF NOT EXISTS idx_extracted_data_confidence ON public.extracted_data(confidence_score, is_verified);

-- Folder extraction configs active lookup
CREATE INDEX IF NOT EXISTS idx_folder_extraction_configs_active ON public.folder_extraction_configs(folder_id, is_active, sort_order);

-- Folder field definitions active lookup
CREATE INDEX IF NOT EXISTS idx_folder_field_definitions_active ON public.folder_field_definitions(folder_id, is_active, sort_order);

-- =============================================================================
-- ORGANIZATION MEMBERSHIP OPTIMIZATIONS
-- =============================================================================

-- Faster organization membership checks (used in RLS policies)
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_active ON public.organization_memberships(user_id, is_active, organization_id);

-- =============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERING
-- =============================================================================

-- Only index active files (most queries filter by is_active = true)
CREATE INDEX IF NOT EXISTS idx_files_active_only ON public.files(organization_id, created_at DESC) WHERE is_active = true;

-- Only index active folders
CREATE INDEX IF NOT EXISTS idx_folders_active_only ON public.folders(organization_id, sort_order) WHERE is_active = true;

-- Only index pending/processing files (for background job processing)
CREATE INDEX IF NOT EXISTS idx_files_processing ON public.files(processing_status, created_at) 
WHERE processing_status IN ('pending', 'processing');

-- =============================================================================
-- CLEANUP AND ANALYTICS INDEXES
-- =============================================================================

-- Files by creation date for cleanup jobs
CREATE INDEX IF NOT EXISTS idx_files_created_cleanup ON public.files(created_at, is_active, file_size);

-- Analysis metadata for debugging
CREATE INDEX IF NOT EXISTS idx_file_analysis_metadata ON public.file_analysis USING gin(analysis_metadata);

-- Extracted data metadata for quality analysis
CREATE INDEX IF NOT EXISTS idx_extracted_data_metadata ON public.extracted_data USING gin(extraction_metadata);

-- =============================================================================
-- FOREIGN KEY OPTIMIZATION
-- =============================================================================

-- Ensure all foreign key lookups are optimized
CREATE INDEX IF NOT EXISTS idx_extracted_data_extraction_config ON public.extracted_data(extraction_config_id);

-- User-based queries (for user activity tracking)
CREATE INDEX IF NOT EXISTS idx_files_user_created ON public.files(user_id, created_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_folders_user_created ON public.folders(user_id, created_at DESC) WHERE is_active = true;

-- =============================================================================
-- ANALYZE TABLES FOR STATISTICS UPDATE
-- =============================================================================

-- Update table statistics for query planner optimization
ANALYZE public.files;
ANALYZE public.folders;
ANALYZE public.file_folder_assignments;
ANALYZE public.file_analysis;
ANALYZE public.extracted_data;
ANALYZE public.folder_extraction_configs;
ANALYZE public.folder_field_definitions;
ANALYZE public.organization_memberships;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON INDEX idx_files_org_status IS 'Critical index for main document listings with status filtering';
COMMENT ON INDEX idx_files_name_search IS 'Full-text search index for document name searching';
COMMENT ON INDEX idx_file_folder_assignments_folder_files IS 'Optimizes folder->documents queries';
COMMENT ON INDEX idx_extracted_data_folder_verified IS 'Optimizes extraction data views and reporting';
COMMENT ON INDEX idx_files_processing IS 'Optimizes background job processing of pending files';
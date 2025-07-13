-- Create optimized database views for common query patterns
-- Migration: 20250713000002_create_optimized_views.sql

-- =============================================================================
-- MAIN DOCUMENTS VIEW WITH ALL RELATED DATA
-- =============================================================================

-- This view replaces the complex nested query in getOrganizationDocumentsWithFolders
CREATE OR REPLACE VIEW documents_with_folders AS
SELECT 
    -- File information
    f.id,
    f.organization_id,
    f.user_id,
    f.name,
    f.original_name,
    f.file_type,
    f.file_size,
    f.storage_path,
    f.checksum,
    f.is_active,
    f.processing_status,
    f.created_at,
    f.updated_at,
    
    -- Folder information (flattened)
    fo.id as folder_id,
    fo.name as folder_name,
    fo.color as folder_color,
    fo.icon as folder_icon,
    fo.extract_data as folder_extract_data,
    ffa.sort_order as folder_sort_order,
    
    -- Analysis information (flattened)
    fa.id as analysis_id,
    fa.ocr_text,
    fa.ai_description,
    fa.ai_category,
    fa.ai_tags,
    fa.confidence_score as analysis_confidence,
    fa.analysis_metadata,
    
    -- Extracted data counts and status
    (
        SELECT COUNT(*) 
        FROM public.extracted_data ed 
        WHERE ed.file_id = f.id
    ) as extracted_fields_count,
    (
        SELECT COUNT(*) 
        FROM public.extracted_data ed 
        WHERE ed.file_id = f.id AND ed.is_verified = true
    ) as verified_fields_count,
    (
        SELECT AVG(ed.confidence_score) 
        FROM public.extracted_data ed 
        WHERE ed.file_id = f.id
    ) as avg_extraction_confidence

FROM public.files f
LEFT JOIN public.file_folder_assignments ffa ON f.id = ffa.file_id
LEFT JOIN public.folders fo ON ffa.folder_id = fo.id
LEFT JOIN public.file_analysis fa ON f.id = fa.file_id
WHERE f.is_active = true;

-- =============================================================================
-- FOLDER SUMMARY VIEW WITH DOCUMENT COUNTS
-- =============================================================================

CREATE OR REPLACE VIEW folders_with_counts AS
SELECT 
    f.id,
    f.organization_id,
    f.user_id,
    f.name,
    f.description,
    f.color,
    f.icon,
    f.sort_order,
    f.is_active,
    f.extract_data,
    f.created_at,
    f.updated_at,
    
    -- Document counts
    COALESCE(doc_counts.total_documents, 0) as total_documents,
    COALESCE(doc_counts.processing_documents, 0) as processing_documents,
    COALESCE(doc_counts.completed_documents, 0) as completed_documents,
    COALESCE(doc_counts.total_size_bytes, 0) as total_size_bytes,
    
    -- Extraction statistics
    COALESCE(ext_stats.total_extracted_fields, 0) as total_extracted_fields,
    COALESCE(ext_stats.verified_fields, 0) as verified_fields,
    COALESCE(ext_stats.avg_confidence, 0) as avg_extraction_confidence,
    
    -- Field definitions count
    COALESCE(field_counts.field_definitions, 0) as field_definitions_count

FROM public.folders f
LEFT JOIN (
    -- Document counts and sizes per folder
    SELECT 
        ffa.folder_id,
        COUNT(files.id) as total_documents,
        COUNT(CASE WHEN files.processing_status IN ('pending', 'processing') THEN 1 END) as processing_documents,
        COUNT(CASE WHEN files.processing_status = 'completed' THEN 1 END) as completed_documents,
        SUM(files.file_size) as total_size_bytes
    FROM public.file_folder_assignments ffa
    JOIN public.files files ON ffa.file_id = files.id
    WHERE files.is_active = true
    GROUP BY ffa.folder_id
) doc_counts ON f.id = doc_counts.folder_id
LEFT JOIN (
    -- Extraction statistics per folder
    SELECT 
        ed.folder_id,
        COUNT(ed.id) as total_extracted_fields,
        COUNT(CASE WHEN ed.is_verified = true THEN 1 END) as verified_fields,
        AVG(ed.confidence_score) as avg_confidence
    FROM public.extracted_data ed
    GROUP BY ed.folder_id
) ext_stats ON f.id = ext_stats.folder_id
LEFT JOIN (
    -- Field definitions count per folder
    SELECT 
        ffd.folder_id,
        COUNT(ffd.id) as field_definitions
    FROM public.folder_field_definitions ffd
    WHERE ffd.is_active = true
    GROUP BY ffd.folder_id
) field_counts ON f.id = field_counts.folder_id
WHERE f.is_active = true;

-- =============================================================================
-- EXTRACTION OVERVIEW VIEW
-- =============================================================================

CREATE OR REPLACE VIEW extraction_overview AS
SELECT 
    f.id as folder_id,
    f.name as folder_name,
    f.organization_id,
    files.id as file_id,
    files.name as file_name,
    files.file_type,
    files.created_at as file_created_at,
    
    -- Field definition info
    ffd.id as field_definition_id,
    ffd.field_name,
    ffd.field_label,
    ffd.field_type,
    ffd.extraction_method,
    ffd.is_required,
    
    -- Extracted data info
    ed.id as extracted_data_id,
    ed.extracted_value,
    ed.confidence_score,
    ed.is_verified,
    ed.verification_notes,
    ed.extraction_metadata,
    ed.created_at as extraction_created_at,
    
    -- Analysis info
    fa.ocr_text IS NOT NULL as has_ocr_text,
    fa.confidence_score as analysis_confidence

FROM public.folders f
JOIN public.folder_field_definitions ffd ON f.id = ffd.folder_id
JOIN public.file_folder_assignments ffa ON f.id = ffa.folder_id
JOIN public.files files ON ffa.file_id = files.id
LEFT JOIN public.extracted_data ed ON (files.id = ed.file_id AND ffd.id = ed.field_definition_id)
LEFT JOIN public.file_analysis fa ON files.id = fa.file_id
WHERE f.extract_data = true 
AND f.is_active = true 
AND files.is_active = true 
AND ffd.is_active = true;

-- =============================================================================
-- PROCESSING STATUS VIEW
-- =============================================================================

CREATE OR REPLACE VIEW processing_status_overview AS
SELECT 
    f.organization_id,
    f.processing_status,
    COUNT(*) as file_count,
    SUM(f.file_size) as total_size_bytes,
    AVG(f.file_size) as avg_size_bytes,
    MIN(f.created_at) as oldest_file,
    MAX(f.created_at) as newest_file,
    
    -- Processing time estimates (for pending/processing files)
    AVG(
        CASE 
            WHEN f.processing_status IN ('pending', 'processing') THEN
                EXTRACT(EPOCH FROM (NOW() - f.created_at)) / 60
            ELSE NULL
        END
    ) as avg_processing_minutes

FROM public.files f
WHERE f.is_active = true
GROUP BY f.organization_id, f.processing_status;

-- =============================================================================
-- USER ACTIVITY VIEW
-- =============================================================================

CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    f.user_id,
    f.organization_id,
    
    -- File upload activity
    COUNT(f.id) as total_files_uploaded,
    SUM(f.file_size) as total_bytes_uploaded,
    MIN(f.created_at) as first_upload,
    MAX(f.created_at) as last_upload,
    
    -- Processing status breakdown
    COUNT(CASE WHEN f.processing_status = 'completed' THEN 1 END) as completed_files,
    COUNT(CASE WHEN f.processing_status = 'failed' THEN 1 END) as failed_files,
    COUNT(CASE WHEN f.processing_status IN ('pending', 'processing') THEN 1 END) as pending_files,
    
    -- Folder activity
    (SELECT COUNT(DISTINCT fo.id) FROM public.folders fo WHERE fo.user_id = f.user_id AND fo.is_active = true) as folders_created,
    
    -- Extraction activity
    (SELECT COUNT(*) FROM public.extracted_data ed WHERE ed.user_id = f.user_id AND ed.is_verified = true) as fields_verified

FROM public.files f
WHERE f.is_active = true
GROUP BY f.user_id, f.organization_id;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON documents_with_folders TO authenticated;
GRANT SELECT ON folders_with_counts TO authenticated;
GRANT SELECT ON extraction_overview TO authenticated;
GRANT SELECT ON processing_status_overview TO authenticated;
GRANT SELECT ON user_activity_summary TO authenticated;

-- =============================================================================
-- CREATE INDEXES ON VIEWS WHERE NEEDED
-- =============================================================================

-- Note: Indexes on views are not directly possible in PostgreSQL, 
-- but the underlying table indexes we created in the previous migration will be used

-- =============================================================================
-- NOTE: RLS POLICIES FOR VIEWS
-- =============================================================================

-- Views in PostgreSQL inherit RLS policies from their underlying tables automatically.
-- We don't need to create separate RLS policies for views as they will be filtered
-- by the RLS policies on the base tables (files, folders, etc.)
-- This provides security while maintaining performance.

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON VIEW documents_with_folders IS 'Optimized view that replaces complex nested queries in getOrganizationDocumentsWithFolders';
COMMENT ON VIEW folders_with_counts IS 'Folder summary with document counts and extraction statistics';
COMMENT ON VIEW extraction_overview IS 'Complete overview of data extraction status per folder';
COMMENT ON VIEW processing_status_overview IS 'File processing status summary for monitoring';
COMMENT ON VIEW user_activity_summary IS 'User activity statistics for analytics and monitoring';
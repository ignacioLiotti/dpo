-- Complete the extraction table consolidation by removing legacy structures
-- Migration: 20250713000003_complete_extraction_cleanup.sql

-- =============================================================================
-- STEP 1: UPDATE EXTRACTED_DATA TO USE FIELD_DEFINITION_ID
-- =============================================================================

-- First, ensure all extracted_data records have field_definition_id populated
UPDATE public.extracted_data ed
SET field_definition_id = (
    SELECT ffd.id 
    FROM public.folder_field_definitions ffd
    WHERE ffd.folder_id = ed.folder_id
    LIMIT 1
)
WHERE ed.field_definition_id IS NULL 
AND ed.extraction_config_id IS NOT NULL;

-- =============================================================================
-- STEP 2: DROP OLD COLUMN AND CONSTRAINTS
-- =============================================================================

-- Drop the old foreign key constraint if it exists
ALTER TABLE public.extracted_data 
DROP CONSTRAINT IF EXISTS extracted_data_extraction_config_id_fkey;

-- Drop the old column
ALTER TABLE public.extracted_data 
DROP COLUMN IF EXISTS extraction_config_id;

-- Make field_definition_id NOT NULL for future records
-- (allowing NULL temporarily for migration)
ALTER TABLE public.extracted_data 
ALTER COLUMN field_definition_id SET NOT NULL;

-- =============================================================================
-- STEP 3: DROP LEGACY TABLE AND VIEW
-- =============================================================================

-- Drop the compatibility view
DROP VIEW IF EXISTS public.folder_extraction_configs_compat;

-- Drop the old table
DROP TABLE IF EXISTS public.folder_extraction_configs CASCADE;

-- =============================================================================
-- STEP 4: UPDATE UNIQUE CONSTRAINT
-- =============================================================================

-- Drop old unique constraint if exists
ALTER TABLE public.extracted_data 
DROP CONSTRAINT IF EXISTS extracted_data_file_id_extraction_config_id_key;

-- Add new unique constraint for field_definition_id
ALTER TABLE public.extracted_data 
ADD CONSTRAINT extracted_data_file_field_unique 
UNIQUE (file_id, field_definition_id);

-- =============================================================================
-- STEP 5: CLEAN UP INDEXES
-- =============================================================================

-- Drop old index if exists
DROP INDEX IF EXISTS idx_extracted_data_extraction_config;

-- Ensure new index exists
CREATE INDEX IF NOT EXISTS idx_extracted_data_field_definition 
ON public.extracted_data(field_definition_id);

-- =============================================================================
-- STEP 6: UPDATE COMMENTS
-- =============================================================================

COMMENT ON TABLE public.folder_field_definitions IS 'Unified table for folder field extraction definitions (replaces folder_extraction_configs)';
COMMENT ON COLUMN public.extracted_data.field_definition_id IS 'Reference to field definition (required)';

-- =============================================================================
-- STEP 7: ANALYZE AFFECTED TABLES
-- =============================================================================

ANALYZE public.extracted_data;
ANALYZE public.folder_field_definitions;
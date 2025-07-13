-- Consolidate duplicate extraction configuration tables
-- Migration: 20250713000001_consolidate_extraction_tables.sql
-- This migration consolidates folder_extraction_configs into folder_field_definitions

-- =============================================================================
-- DATA MIGRATION FROM OLD TABLE TO NEW TABLE
-- =============================================================================

-- First, migrate any existing data from folder_extraction_configs to folder_field_definitions
-- Only migrate if the field doesn't already exist in folder_field_definitions
INSERT INTO public.folder_field_definitions (
    folder_id,
    organization_id,
    user_id,
    field_name,
    field_label,
    field_type,
    field_description,
    extraction_method,
    extraction_pattern,
    validation_pattern,
    default_value,
    is_required,
    is_active,
    sort_order,
    created_at,
    updated_at
)
SELECT 
    fec.folder_id,
    f.organization_id, -- Get organization_id from the folder
    fec.user_id,
    fec.field_name,
    fec.field_label,
    fec.field_type,
    'Migrated from folder_extraction_configs' as field_description,
    'ai' as extraction_method, -- Default to 'ai' since old table used AI prompts
    fec.extraction_pattern,
    NULL as validation_pattern, -- Old table didn't have validation patterns
    fec.default_value,
    fec.is_required,
    fec.is_active,
    fec.sort_order,
    fec.created_at,
    fec.updated_at
FROM public.folder_extraction_configs fec
JOIN public.folders f ON f.id = fec.folder_id
WHERE NOT EXISTS (
    -- Only migrate if the field doesn't already exist in the new table
    SELECT 1 FROM public.folder_field_definitions ffd 
    WHERE ffd.folder_id = fec.folder_id 
    AND ffd.field_name = fec.field_name
);

-- =============================================================================
-- UPDATE extracted_data REFERENCES
-- =============================================================================

-- Update extracted_data table to reference folder_field_definitions instead of folder_extraction_configs
-- We need to add a new column and update references

-- Add new column to reference folder_field_definitions
ALTER TABLE public.extracted_data 
ADD COLUMN IF NOT EXISTS field_definition_id UUID REFERENCES public.folder_field_definitions(id) ON DELETE CASCADE;

-- Update the field_definition_id for existing records
UPDATE public.extracted_data 
SET field_definition_id = ffd.id
FROM public.folder_extraction_configs fec
JOIN public.folder_field_definitions ffd ON (
    ffd.folder_id = fec.folder_id 
    AND ffd.field_name = fec.field_name
)
WHERE extracted_data.extraction_config_id = fec.id;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_extracted_data_field_definition ON public.extracted_data(field_definition_id);

-- =============================================================================
-- CREATE NEW OPTIMIZED VIEW FOR BACKWARD COMPATIBILITY
-- =============================================================================

-- Create a view that maintains backward compatibility for any code still using the old structure
CREATE OR REPLACE VIEW folder_extraction_configs_compat AS
SELECT 
    ffd.id,
    ffd.folder_id,
    ffd.user_id,
    ffd.field_name,
    ffd.field_label,
    ffd.field_type,
    ffd.extraction_pattern,
    ffd.is_required,
    ffd.default_value,
    ffd.sort_order,
    ffd.is_active,
    ffd.created_at,
    ffd.updated_at
FROM public.folder_field_definitions ffd;

-- Grant appropriate permissions on the view
GRANT SELECT ON folder_extraction_configs_compat TO authenticated;

-- =============================================================================
-- CLEAN UP OLD DATA (COMMENTED OUT FOR SAFETY)
-- =============================================================================

-- After verifying the migration worked correctly, uncomment these lines:

-- Remove the old foreign key constraint (after updating all references)
-- ALTER TABLE public.extracted_data DROP CONSTRAINT IF EXISTS extracted_data_extraction_config_id_fkey;

-- Drop the old column (after confirming field_definition_id is populated)
-- ALTER TABLE public.extracted_data DROP COLUMN IF EXISTS extraction_config_id;

-- Drop the old table (after confirming all data migrated successfully)
-- DROP TABLE IF EXISTS public.folder_extraction_configs CASCADE;

-- =============================================================================
-- ADD ENHANCED CONSTRAINTS AND INDEXES
-- =============================================================================

-- Add constraint to ensure field_definition_id is not null for new records
-- (Allow existing records to have NULL during migration)
-- This will be enforced after the migration is complete and old column is dropped

-- Add unique constraint to prevent duplicate field names per folder
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_folder_field_name'
    ) THEN
        ALTER TABLE public.folder_field_definitions 
        ADD CONSTRAINT unique_folder_field_name UNIQUE (folder_id, field_name);
    END IF;
END $$;

-- Add check constraint for valid field types
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_field_type'
    ) THEN
        ALTER TABLE public.folder_field_definitions 
        ADD CONSTRAINT valid_field_type CHECK (
            field_type IN ('text', 'number', 'date', 'currency', 'boolean', 'email', 'phone', 'textarea', 'select', 'multiselect')
        );
    END IF;
END $$;

-- Add check constraint for valid extraction methods
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_extraction_method'
    ) THEN
        ALTER TABLE public.folder_field_definitions 
        ADD CONSTRAINT valid_extraction_method CHECK (
            extraction_method IN ('regex', 'ai', 'hybrid', 'manual')
        );
    END IF;
END $$;

-- =============================================================================
-- UPDATE RLS POLICIES
-- =============================================================================

-- Ensure extracted_data policies work with both old and new foreign keys during transition
DROP POLICY IF EXISTS "Users can view extracted data in their organization" ON public.extracted_data;

CREATE POLICY "Users can view extracted data in their organization" ON public.extracted_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_memberships om
            JOIN public.folders f ON f.organization_id = om.organization_id
            WHERE f.id = extracted_data.folder_id
            AND om.user_id = auth.uid()
            AND om.is_active = true
        )
    );

-- =============================================================================
-- ANALYZE UPDATED TABLES
-- =============================================================================

ANALYZE public.folder_field_definitions;
ANALYZE public.extracted_data;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN public.extracted_data.field_definition_id IS 'New reference to folder_field_definitions (replaces extraction_config_id)';
COMMENT ON VIEW folder_extraction_configs_compat IS 'Backward compatibility view for folder_extraction_configs table';
COMMENT ON CONSTRAINT unique_folder_field_name ON public.folder_field_definitions IS 'Ensures unique field names per folder';

-- =============================================================================
-- VERIFICATION QUERIES (FOR MANUAL TESTING)
-- =============================================================================

-- Uncomment these queries to verify the migration:

-- Check data migration was successful:
-- SELECT 'folder_field_definitions' as table_name, COUNT(*) as count FROM public.folder_field_definitions
-- UNION ALL
-- SELECT 'folder_extraction_configs' as table_name, COUNT(*) as count FROM public.folder_extraction_configs;

-- Check extracted_data references are updated:
-- SELECT 
--     COUNT(*) as total_records,
--     COUNT(extraction_config_id) as old_references,
--     COUNT(field_definition_id) as new_references
-- FROM public.extracted_data;

-- Check for any orphaned records:
-- SELECT ed.id, ed.file_id, ed.folder_id 
-- FROM public.extracted_data ed
-- LEFT JOIN public.folder_field_definitions ffd ON ffd.id = ed.field_definition_id
-- WHERE ed.field_definition_id IS NOT NULL AND ffd.id IS NULL;
-- Fix duplicate constraints on extracted_data table
-- The old constraint without row_index conflicts with tabular data

-- Drop the old constraint that doesn't include row_index
ALTER TABLE extracted_data 
DROP CONSTRAINT IF EXISTS extracted_data_file_field_unique;

-- Ensure the correct constraint exists (should already be there from previous migration)
-- This constraint includes row_index to support tabular data
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'extracted_data_file_field_row_key'
        AND conrelid = 'extracted_data'::regclass
    ) THEN
        ALTER TABLE extracted_data 
        ADD CONSTRAINT extracted_data_file_field_row_key 
        UNIQUE (file_id, field_definition_id, row_index);
    END IF;
END $$;

-- Verify the correct constraint is in place
COMMENT ON CONSTRAINT extracted_data_file_field_row_key ON extracted_data IS 
'Unique constraint for tabular data support - includes row_index to allow multiple rows per field';
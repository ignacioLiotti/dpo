-- Add tabular extraction support to the OCR system
-- This migration enables processing documents with multiple rows of data (e.g., bank statements)

-- 1. Add extraction type to folders
ALTER TABLE folders 
ADD COLUMN IF NOT EXISTS extraction_type TEXT DEFAULT 'single' CHECK (extraction_type IN ('single', 'tabular')),
ADD COLUMN IF NOT EXISTS max_rows INTEGER DEFAULT 100 CHECK (max_rows > 0 AND max_rows <= 1000);

-- Add comment for documentation
COMMENT ON COLUMN folders.extraction_type IS 'Type of data extraction: single (one record) or tabular (multiple rows)';
COMMENT ON COLUMN folders.max_rows IS 'Maximum number of rows to extract for tabular folders (performance limit)';

-- 2. Add tabular support to extracted_data
ALTER TABLE extracted_data 
ADD COLUMN IF NOT EXISTS row_index INTEGER DEFAULT 0 CHECK (row_index >= 0),
ADD COLUMN IF NOT EXISTS is_tabular BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN extracted_data.row_index IS 'Row index for tabular data (0-based), always 0 for single extraction';
COMMENT ON COLUMN extracted_data.is_tabular IS 'Whether this record is part of tabular extraction';

-- 3. Update unique constraint to support multiple rows
-- Drop existing constraint if it exists
ALTER TABLE extracted_data 
DROP CONSTRAINT IF EXISTS extracted_data_file_id_field_definition_id_key;

-- Add new composite unique constraint that includes row_index
ALTER TABLE extracted_data 
ADD CONSTRAINT extracted_data_file_field_row_key 
UNIQUE (file_id, field_definition_id, row_index);

-- 4. Add column metadata to field definitions for tabular extraction
ALTER TABLE folder_field_definitions
ADD COLUMN IF NOT EXISTS column_index INTEGER,
ADD COLUMN IF NOT EXISTS is_row_identifier BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN folder_field_definitions.column_index IS 'Column position in tabular data (0-based)';
COMMENT ON COLUMN folder_field_definitions.is_row_identifier IS 'Whether this field uniquely identifies each row';

-- 5. Create indexes for efficient tabular queries
CREATE INDEX IF NOT EXISTS idx_extracted_data_tabular 
ON extracted_data(file_id, is_tabular, row_index)
WHERE is_tabular = true;

CREATE INDEX IF NOT EXISTS idx_extracted_data_tabular_field 
ON extracted_data(file_id, field_definition_id, row_index)
WHERE is_tabular = true;

CREATE INDEX IF NOT EXISTS idx_folders_extraction_type 
ON folders(organization_id, extraction_type)
WHERE extraction_type = 'tabular';

-- 6. Create a view for easy tabular data querying
CREATE OR REPLACE VIEW tabular_extracted_data AS
SELECT 
  f.id AS file_id,
  f.name AS file_name,
  f.organization_id,
  ed.row_index,
  jsonb_object_agg(ffd.field_name, ed.extracted_value) AS row_data,
  avg(ed.confidence_score) AS avg_confidence,
  count(*) AS field_count,
  max(ed.created_at) AS extracted_at
FROM files f
JOIN extracted_data ed ON f.id = ed.file_id
JOIN folder_field_definitions ffd ON ed.field_definition_id = ffd.id
WHERE ed.is_tabular = true
GROUP BY f.id, f.name, f.organization_id, ed.row_index
ORDER BY f.id, ed.row_index;

-- Add comment for the view
COMMENT ON VIEW tabular_extracted_data IS 'Aggregated view of tabular extraction data with row-based grouping';

-- 7. Create function to get tabular data for a file
CREATE OR REPLACE FUNCTION get_tabular_data(file_uuid UUID)
RETURNS TABLE (
  row_index INTEGER,
  row_data JSONB,
  confidence FLOAT,
  field_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ted.row_index,
    ted.row_data,
    ted.avg_confidence::FLOAT,
    ted.field_count::INTEGER
  FROM tabular_extracted_data ted
  WHERE ted.file_id = file_uuid
  ORDER BY ted.row_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for the function
COMMENT ON FUNCTION get_tabular_data(UUID) IS 'Returns all tabular data for a specific file organized by rows';

-- 8. Update RLS policies for new columns
-- The existing RLS policies will automatically apply to new columns
-- But we should ensure the view and function respect RLS

-- Create RLS-aware function for user access
CREATE OR REPLACE FUNCTION get_user_tabular_data(file_uuid UUID)
RETURNS TABLE (
  row_index INTEGER,
  row_data JSONB,
  confidence FLOAT,
  field_count INTEGER
) AS $$
BEGIN
  -- Check if user has access to this file through organization membership
  IF NOT EXISTS (
    SELECT 1 FROM files f
    JOIN organization_memberships om ON f.organization_id = om.organization_id
    WHERE f.id = file_uuid 
    AND om.user_id = auth.uid() 
    AND om.is_active = true
    AND f.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied to file';
  END IF;
  
  RETURN QUERY SELECT * FROM get_tabular_data(file_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Sample field definitions removed (will be created through templates in the UI)

-- 10. Helper function removed (templates will be handled in application code)

-- Add indexes for performance with new columns
CREATE INDEX IF NOT EXISTS idx_folder_field_definitions_column_index 
ON folder_field_definitions(folder_id, column_index)
WHERE column_index IS NOT NULL;

-- Migration completed successfully
-- Next steps: Update application code to use new tabular extraction features
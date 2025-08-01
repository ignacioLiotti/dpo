-- Add processing_error column to files table for better error tracking
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Add comment for documentation
COMMENT ON COLUMN files.processing_error IS 'Stores error message if document processing fails';

-- Create index for failed documents
CREATE INDEX IF NOT EXISTS idx_files_processing_failed 
ON files(organization_id, processing_status, created_at DESC)
WHERE processing_status = 'failed' AND is_active = true;
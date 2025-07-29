-- Add processing_error column to files table for better error tracking
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Add comment for documentation
COMMENT ON COLUMN files.processing_error IS 'Stores the last error message if processing failed';

-- Create index on processing_status for faster queries
CREATE INDEX IF NOT EXISTS idx_files_processing_status 
ON files(processing_status) 
WHERE processing_status IN ('pending', 'processing', 'failed');

-- Add index for failed files to help with retry logic
CREATE INDEX IF NOT EXISTS idx_files_failed_processing 
ON files(organization_id, processing_status, updated_at) 
WHERE processing_status = 'failed';
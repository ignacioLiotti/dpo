-- Add extraction_metadata column to extracted_data table
ALTER TABLE public.extracted_data 
ADD COLUMN IF NOT EXISTS extraction_metadata JSONB DEFAULT '{}';

-- Add comment to describe the column
COMMENT ON COLUMN public.extracted_data.extraction_metadata IS 'Metadata about the extraction process including provider, timestamp, field count, etc.';

-- Add an index on file_id for better query performance
CREATE INDEX IF NOT EXISTS idx_extracted_data_file_id ON public.extracted_data(file_id);
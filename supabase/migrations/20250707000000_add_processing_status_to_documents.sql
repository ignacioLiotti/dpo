-- Migration: Add processing status and metadata to obra_documents
-- This adds support for the new upload-then-process workflow

-- Add processing_status column
ALTER TABLE "public"."obra_documents"
ADD COLUMN IF NOT EXISTS "processing_status" text DEFAULT 'pending'
CHECK ("processing_status" IN ('pending', 'processing', 'completed', 'failed'));

-- Add processing_metadata column for storing processing results
ALTER TABLE "public"."obra_documents"
ADD COLUMN IF NOT EXISTS "processing_metadata" jsonb DEFAULT NULL;

-- Create index for processing_status for efficient queries
CREATE INDEX IF NOT EXISTS "obra_documents_processing_status_idx" 
ON "public"."obra_documents" USING "btree" ("processing_status");

-- Update existing documents to have 'completed' status if they have OCR content
UPDATE "public"."obra_documents" 
SET "processing_status" = 'completed'
WHERE "ocr_content" IS NOT NULL AND "ocr_content" != '';

-- Add comment for documentation
COMMENT ON COLUMN "public"."obra_documents"."processing_status" IS 'Status of AI processing: pending, processing, completed, failed';
COMMENT ON COLUMN "public"."obra_documents"."processing_metadata" IS 'Metadata from AI processing including confidence, timing, providers used';
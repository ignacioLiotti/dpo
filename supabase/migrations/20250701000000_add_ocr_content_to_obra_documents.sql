-- Migration: Add OCR content field to obra_documents table

-- Add OCR content field to store extracted text from images and documents
ALTER TABLE "public"."obra_documents" 
ADD COLUMN IF NOT EXISTS "ocr_content" TEXT;

-- Add index for OCR content search
CREATE INDEX IF NOT EXISTS "obra_documents_ocr_content_idx" 
ON "public"."obra_documents" 
USING gin(to_tsvector('spanish', coalesce(ocr_content, '')));

-- Add index for combined text search (description + ocr_content)
CREATE INDEX IF NOT EXISTS "obra_documents_text_search_idx" 
ON "public"."obra_documents" 
USING gin(to_tsvector('spanish', coalesce(description, '') || ' ' || coalesce(ocr_content, '')));

-- Comment for documentation
COMMENT ON COLUMN "public"."obra_documents"."ocr_content" 
IS 'Text content extracted from images and documents using OCR';
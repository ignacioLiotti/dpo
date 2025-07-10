-- Migration: Update documents_with_folders view to include extracted data
-- This ensures that extracted data is available in the UI

-- Drop and recreate the view with extracted data included
DROP VIEW IF EXISTS "public"."documents_with_folders";

CREATE OR REPLACE VIEW "public"."documents_with_folders" AS
SELECT 
    d.*,
    f.id as folder_id,
    f.name as folder_name,
    f.color as folder_color,
    f.icon as folder_icon,
    f.extract_data as folder_extract_data,
    ded.extracted_data,
    ded.extraction_confidence,
    ded.field_count,
    ded.extraction_metadata
FROM obra_documents d
LEFT JOIN folder_documents fd ON d.id = fd.document_id
LEFT JOIN folders f ON fd.folder_id = f.id
LEFT JOIN document_extracted_data ded ON d.id = ded.document_id;

-- Grant permissions
GRANT SELECT ON "public"."documents_with_folders" TO "anon";
GRANT SELECT ON "public"."documents_with_folders" TO "authenticated";
GRANT SELECT ON "public"."documents_with_folders" TO "service_role";

-- Add comment for documentation
COMMENT ON VIEW "public"."documents_with_folders" 
IS 'View that joins documents with their folder information and extracted data';
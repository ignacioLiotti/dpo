-- Migration: Add data extraction features to folders system
-- This migration adds support for folder-based data extraction with field definitions

-- Add extraction toggle to folders table
ALTER TABLE "public"."folders" 
ADD COLUMN IF NOT EXISTS "extract_data" BOOLEAN DEFAULT FALSE;

-- Create table for folder field definitions
CREATE TABLE IF NOT EXISTS "public"."folder_field_definitions" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "folder_id" UUID NOT NULL,
    "obra_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "field_name" TEXT NOT NULL,
    "field_type" TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'currency', 'boolean', 'email', 'phone')),
    "field_label" TEXT NOT NULL,
    "field_description" TEXT,
    "extraction_method" TEXT NOT NULL CHECK (extraction_method IN ('regex', 'ai', 'hybrid')),
    "extraction_pattern" TEXT NOT NULL,
    "validation_pattern" TEXT,
    "is_required" BOOLEAN DEFAULT FALSE,
    "default_value" TEXT,
    "sort_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT TRUE
);

-- Create table for storing extracted document data
CREATE TABLE IF NOT EXISTS "public"."document_extracted_data" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    "document_id" UUID NOT NULL,
    "folder_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "extracted_data" JSONB NOT NULL DEFAULT '{}',
    "extraction_confidence" DECIMAL(3,2) DEFAULT 0.0,
    "field_count" INTEGER DEFAULT 0,
    "extraction_metadata" JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "folder_field_definitions_folder_id_idx" 
ON "public"."folder_field_definitions" USING btree ("folder_id");

CREATE INDEX IF NOT EXISTS "folder_field_definitions_obra_id_idx" 
ON "public"."folder_field_definitions" USING btree ("obra_id");

CREATE INDEX IF NOT EXISTS "folder_field_definitions_user_id_idx" 
ON "public"."folder_field_definitions" USING btree ("user_id");

CREATE INDEX IF NOT EXISTS "folder_field_definitions_sort_order_idx" 
ON "public"."folder_field_definitions" USING btree ("sort_order");

CREATE INDEX IF NOT EXISTS "document_extracted_data_document_id_idx" 
ON "public"."document_extracted_data" USING btree ("document_id");

CREATE INDEX IF NOT EXISTS "document_extracted_data_folder_id_idx" 
ON "public"."document_extracted_data" USING btree ("folder_id");

CREATE INDEX IF NOT EXISTS "document_extracted_data_user_id_idx" 
ON "public"."document_extracted_data" USING btree ("user_id");

-- Create index for JSONB extracted data search
CREATE INDEX IF NOT EXISTS "document_extracted_data_gin_idx" 
ON "public"."document_extracted_data" USING gin ("extracted_data");

-- Add foreign key constraints
ALTER TABLE ONLY "public"."folder_field_definitions"
    ADD CONSTRAINT "folder_field_definitions_folder_id_fkey" 
    FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."folder_field_definitions"
    ADD CONSTRAINT "folder_field_definitions_obra_id_fkey" 
    FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."folder_field_definitions"
    ADD CONSTRAINT "folder_field_definitions_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."document_extracted_data"
    ADD CONSTRAINT "document_extracted_data_document_id_fkey" 
    FOREIGN KEY ("document_id") REFERENCES "public"."obra_documents"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."document_extracted_data"
    ADD CONSTRAINT "document_extracted_data_folder_id_fkey" 
    FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."document_extracted_data"
    ADD CONSTRAINT "document_extracted_data_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Add unique constraints
ALTER TABLE ONLY "public"."folder_field_definitions"
    ADD CONSTRAINT "unique_field_name_per_folder" 
    UNIQUE ("folder_id", "field_name");

ALTER TABLE ONLY "public"."document_extracted_data"
    ADD CONSTRAINT "unique_document_extraction" 
    UNIQUE ("document_id");

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE TRIGGER "folder_field_definitions_updated_at"
    BEFORE UPDATE ON "public"."folder_field_definitions"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

CREATE OR REPLACE TRIGGER "document_extracted_data_updated_at"
    BEFORE UPDATE ON "public"."document_extracted_data"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Enable Row Level Security
ALTER TABLE "public"."folder_field_definitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."document_extracted_data" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for folder_field_definitions
CREATE POLICY "folder_field_definitions_select_policy" ON "public"."folder_field_definitions"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."folders" f
            JOIN "public"."obras" o ON o.id = f.obra_id
            WHERE f.id = "folder_field_definitions"."folder_id"
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "folder_field_definitions_insert_policy" ON "public"."folder_field_definitions"
    FOR INSERT WITH CHECK (
        "folder_field_definitions"."user_id" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."folders" f
            JOIN "public"."obras" o ON o.id = f.obra_id
            WHERE f.id = "folder_field_definitions"."folder_id"
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "folder_field_definitions_update_policy" ON "public"."folder_field_definitions"
    FOR UPDATE USING (
        "folder_field_definitions"."user_id" = auth.uid()
    );

CREATE POLICY "folder_field_definitions_delete_policy" ON "public"."folder_field_definitions"
    FOR DELETE USING (
        "folder_field_definitions"."user_id" = auth.uid()
    );

-- Create RLS policies for document_extracted_data
CREATE POLICY "document_extracted_data_select_policy" ON "public"."document_extracted_data"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."obra_documents" d
            JOIN "public"."obras" o ON o.id = d.obra_id
            WHERE d.id = "document_extracted_data"."document_id"
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "document_extracted_data_insert_policy" ON "public"."document_extracted_data"
    FOR INSERT WITH CHECK (
        "document_extracted_data"."user_id" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."obra_documents" d
            JOIN "public"."obras" o ON o.id = d.obra_id
            WHERE d.id = "document_extracted_data"."document_id"
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "document_extracted_data_update_policy" ON "public"."document_extracted_data"
    FOR UPDATE USING (
        "document_extracted_data"."user_id" = auth.uid()
    );

CREATE POLICY "document_extracted_data_delete_policy" ON "public"."document_extracted_data"
    FOR DELETE USING (
        "document_extracted_data"."user_id" = auth.uid()
    );

-- Grant permissions
GRANT ALL ON TABLE "public"."folder_field_definitions" TO "anon";
GRANT ALL ON TABLE "public"."folder_field_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."folder_field_definitions" TO "service_role";

GRANT ALL ON TABLE "public"."document_extracted_data" TO "anon";
GRANT ALL ON TABLE "public"."document_extracted_data" TO "authenticated";
GRANT ALL ON TABLE "public"."document_extracted_data" TO "service_role";

-- Create a view for easy access to extracted data with document info
CREATE OR REPLACE VIEW "public"."folder_extraction_overview" AS
SELECT 
    f.id as folder_id,
    f.name as folder_name,
    f.extract_data,
    COUNT(DISTINCT ffd.id) as field_count,
    COUNT(DISTINCT ded.id) as extracted_documents_count,
    COUNT(DISTINCT fd.document_id) as total_documents_count,
    COALESCE(AVG(ded.extraction_confidence), 0) as avg_confidence
FROM folders f
LEFT JOIN folder_field_definitions ffd ON f.id = ffd.folder_id AND ffd.is_active = true
LEFT JOIN folder_documents fd ON f.id = fd.folder_id
LEFT JOIN document_extracted_data ded ON fd.document_id = ded.document_id
GROUP BY f.id, f.name, f.extract_data;

GRANT SELECT ON "public"."folder_extraction_overview" TO "anon";
GRANT SELECT ON "public"."folder_extraction_overview" TO "authenticated";
GRANT SELECT ON "public"."folder_extraction_overview" TO "service_role";

-- Add comments for documentation
COMMENT ON TABLE "public"."folder_field_definitions" 
IS 'Defines data extraction fields for each folder';

COMMENT ON TABLE "public"."document_extracted_data" 
IS 'Stores extracted structured data from documents';

COMMENT ON COLUMN "public"."folders"."extract_data" 
IS 'Whether data extraction is enabled for this folder';

COMMENT ON COLUMN "public"."folder_field_definitions"."extraction_method" 
IS 'Method used for extraction: regex, ai, or hybrid';

COMMENT ON COLUMN "public"."document_extracted_data"."extracted_data" 
IS 'JSON object containing extracted field values';

COMMENT ON COLUMN "public"."document_extracted_data"."extraction_confidence" 
IS 'Confidence score between 0.0 and 1.0 for the extraction';
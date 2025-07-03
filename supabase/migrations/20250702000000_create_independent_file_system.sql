-- Migration: Create independent file system
-- This replaces the obra-based system with a simple user-based file system

-- Table for user folders (simple, no nesting)
CREATE TABLE IF NOT EXISTS "public"."user_folders" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true
);

-- Table for user files (not tied to obras)
CREATE TABLE IF NOT EXISTS "public"."user_files" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "folder_id" UUID REFERENCES "public"."user_folders"("id") ON DELETE SET NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "description" TEXT,
    "ocr_content" TEXT,
    "category" TEXT,
    "is_active" BOOLEAN DEFAULT true
);

-- Table for field definitions per folder (create new version)
CREATE TABLE IF NOT EXISTS "public"."folder_field_definitions_new" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "folder_id" UUID NOT NULL REFERENCES "public"."user_folders"("id") ON DELETE CASCADE,
    "field_name" TEXT NOT NULL,
    "field_type" TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'currency', 'boolean', 'email', 'phone')),
    "field_label" TEXT NOT NULL,
    "field_description" TEXT,
    "extraction_method" TEXT NOT NULL CHECK (extraction_method IN ('regex', 'ai', 'hybrid')),
    "extraction_pattern" TEXT NOT NULL,
    "validation_pattern" TEXT,
    "is_required" BOOLEAN DEFAULT false,
    "default_value" TEXT,
    "sort_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true
);

-- Table for extracted field data from files
CREATE TABLE IF NOT EXISTS "public"."file_extracted_data" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "file_id" UUID NOT NULL REFERENCES "public"."user_files"("id") ON DELETE CASCADE,
    "field_definition_id" UUID NOT NULL REFERENCES "public"."folder_field_definitions_new"("id") ON DELETE CASCADE,
    "extracted_value" TEXT,
    "confidence_score" FLOAT DEFAULT 0,
    "extraction_method_used" TEXT,
    "raw_extracted_text" TEXT,
    "is_verified" BOOLEAN DEFAULT false,
    "verification_date" TIMESTAMPTZ,
    "notes" TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "user_folders_user_id_idx" ON "public"."user_folders" ("user_id");
CREATE INDEX IF NOT EXISTS "user_files_user_id_idx" ON "public"."user_files" ("user_id");
CREATE INDEX IF NOT EXISTS "user_files_folder_id_idx" ON "public"."user_files" ("folder_id");
CREATE INDEX IF NOT EXISTS "folder_field_definitions_new_folder_id_idx" ON "public"."folder_field_definitions_new" ("folder_id");
CREATE INDEX IF NOT EXISTS "file_extracted_data_file_id_idx" ON "public"."file_extracted_data" ("file_id");
CREATE INDEX IF NOT EXISTS "file_extracted_data_field_id_idx" ON "public"."file_extracted_data" ("field_definition_id");

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "user_folders_unique_name" 
ON "public"."user_folders" ("user_id", "name") 
WHERE "is_active" = true;

CREATE UNIQUE INDEX IF NOT EXISTS "folder_field_definitions_new_unique_field" 
ON "public"."folder_field_definitions_new" ("folder_id", "field_name") 
WHERE "is_active" = true;

CREATE UNIQUE INDEX IF NOT EXISTS "file_extracted_data_unique_extraction" 
ON "public"."file_extracted_data" ("file_id", "field_definition_id");

-- Add triggers for updated_at
CREATE OR REPLACE TRIGGER "user_folders_updated_at"
    BEFORE UPDATE ON "public"."user_folders"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER "user_files_updated_at"
    BEFORE UPDATE ON "public"."user_files"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER "folder_field_definitions_new_updated_at"
    BEFORE UPDATE ON "public"."folder_field_definitions_new"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER "file_extracted_data_updated_at"
    BEFORE UPDATE ON "public"."file_extracted_data"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE "public"."user_folders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."folder_field_definitions_new" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."file_extracted_data" ENABLE ROW LEVEL SECURITY;

-- User folders policies
CREATE POLICY "user_folders_policy" ON "public"."user_folders"
    FOR ALL USING ("user_id" = auth.uid());

-- User files policies  
CREATE POLICY "user_files_policy" ON "public"."user_files"
    FOR ALL USING ("user_id" = auth.uid());

-- Field definitions policies
CREATE POLICY "folder_field_definitions_new_policy" ON "public"."folder_field_definitions_new"
    FOR ALL USING ("user_id" = auth.uid());

-- File extracted data policies
CREATE POLICY "file_extracted_data_policy" ON "public"."file_extracted_data"
    FOR ALL USING ("user_id" = auth.uid());

-- Grant permissions
GRANT ALL ON TABLE "public"."user_folders" TO "anon";
GRANT ALL ON TABLE "public"."user_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."user_folders" TO "service_role";

GRANT ALL ON TABLE "public"."user_files" TO "anon";
GRANT ALL ON TABLE "public"."user_files" TO "authenticated";
GRANT ALL ON TABLE "public"."user_files" TO "service_role";

GRANT ALL ON TABLE "public"."folder_field_definitions_new" TO "anon";
GRANT ALL ON TABLE "public"."folder_field_definitions_new" TO "authenticated";
GRANT ALL ON TABLE "public"."folder_field_definitions_new" TO "service_role";

GRANT ALL ON TABLE "public"."file_extracted_data" TO "anon";
GRANT ALL ON TABLE "public"."file_extracted_data" TO "authenticated";
GRANT ALL ON TABLE "public"."file_extracted_data" TO "service_role";

-- Comments
COMMENT ON TABLE "public"."user_folders" IS 'Simple folder structure for organizing user files';
COMMENT ON TABLE "public"."user_files" IS 'User files independent of any project or obra';
COMMENT ON TABLE "public"."folder_field_definitions_new" IS 'Field definitions for data extraction per folder';
COMMENT ON TABLE "public"."file_extracted_data" IS 'Extracted data from files using AI/regex patterns';
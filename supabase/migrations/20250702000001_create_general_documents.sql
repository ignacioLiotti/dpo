-- Migration: Create general document system
-- This creates a composable document system independent of obras

-- Table for general documents (not tied to obras)
CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    
    -- Basic document info
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL, -- MIME type
    "size" BIGINT NOT NULL,
    "checksum" TEXT,
    "storage_path" TEXT NOT NULL,
    
    -- Organization
    "folder" TEXT DEFAULT 'general',
    "category" TEXT,
    "tags" TEXT[] DEFAULT '{}',
    
    -- Content
    "ocr_content" TEXT, -- Extracted text for search
    "metadata" JSONB DEFAULT '{}', -- Flexible metadata storage
    
    -- Sharing & versioning
    "is_public" BOOLEAN DEFAULT false,
    "version" INTEGER DEFAULT 1,
    "parent_id" UUID REFERENCES "public"."documents"("id") ON DELETE SET NULL,
    
    -- Status
    "is_active" BOOLEAN DEFAULT true
);

-- Table for document folders (independent folder system)
CREATE TABLE IF NOT EXISTS "public"."document_folders" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    
    -- Folder info
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#3B82F6',
    "icon" TEXT DEFAULT '📁',
    
    -- Organization
    "sort_order" INTEGER DEFAULT 0,
    "is_default" BOOLEAN DEFAULT false,
    "parent_id" UUID REFERENCES "public"."document_folders"("id") ON DELETE CASCADE,
    
    -- Status
    "is_active" BOOLEAN DEFAULT true
);

-- Junction table for flexible document-folder relationships
CREATE TABLE IF NOT EXISTS "public"."document_folder_items" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "document_id" UUID NOT NULL REFERENCES "public"."documents"("id") ON DELETE CASCADE,
    "folder_id" UUID NOT NULL REFERENCES "public"."document_folders"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    
    -- Organization within folder
    "sort_order" INTEGER DEFAULT 0,
    
    UNIQUE(document_id, folder_id)
);

-- Table for document templates (for different document types)
CREATE TABLE IF NOT EXISTS "public"."document_templates" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Template info
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "icon" TEXT DEFAULT '📄',
    
    -- Template configuration
    "fields" JSONB NOT NULL DEFAULT '[]', -- Field definitions for data extraction
    "validation_rules" JSONB DEFAULT '{}',
    "default_metadata" JSONB DEFAULT '{}',
    
    -- System templates vs user templates
    "is_system" BOOLEAN DEFAULT false,
    "user_id" UUID REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    
    -- Status
    "is_active" BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "documents_user_id_idx" ON "public"."documents" ("user_id");
CREATE INDEX IF NOT EXISTS "documents_folder_idx" ON "public"."documents" ("folder");
CREATE INDEX IF NOT EXISTS "documents_category_idx" ON "public"."documents" ("category");
CREATE INDEX IF NOT EXISTS "documents_created_at_idx" ON "public"."documents" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "documents_name_search_idx" ON "public"."documents" USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS "documents_ocr_search_idx" ON "public"."documents" USING gin(to_tsvector('english', ocr_content));
CREATE INDEX IF NOT EXISTS "documents_tags_idx" ON "public"."documents" USING gin(tags);

CREATE INDEX IF NOT EXISTS "document_folders_user_id_idx" ON "public"."document_folders" ("user_id");
CREATE INDEX IF NOT EXISTS "document_folders_parent_id_idx" ON "public"."document_folders" ("parent_id");

CREATE INDEX IF NOT EXISTS "document_folder_items_document_id_idx" ON "public"."document_folder_items" ("document_id");
CREATE INDEX IF NOT EXISTS "document_folder_items_folder_id_idx" ON "public"."document_folder_items" ("folder_id");

CREATE INDEX IF NOT EXISTS "document_templates_category_idx" ON "public"."document_templates" ("category");

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "document_folders_unique_name" 
ON "public"."document_folders" ("user_id", "name") 
WHERE "is_active" = true;

-- Add triggers for updated_at
CREATE OR REPLACE TRIGGER "documents_updated_at"
    BEFORE UPDATE ON "public"."documents"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER "document_folders_updated_at"
    BEFORE UPDATE ON "public"."document_folders"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER "document_templates_updated_at"
    BEFORE UPDATE ON "public"."document_templates"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."document_folders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."document_folder_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."document_templates" ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "documents_policy" ON "public"."documents"
    FOR ALL USING (
        "user_id" = auth.uid() OR 
        ("is_public" = true AND current_setting('request.method', true) = 'GET')
    );

-- Document folders policies
CREATE POLICY "document_folders_policy" ON "public"."document_folders"
    FOR ALL USING ("user_id" = auth.uid());

-- Document folder items policies
CREATE POLICY "document_folder_items_policy" ON "public"."document_folder_items"
    FOR ALL USING ("user_id" = auth.uid());

-- Document templates policies (system templates are readable by all)
CREATE POLICY "document_templates_select_policy" ON "public"."document_templates"
    FOR SELECT USING (
        "is_system" = true OR 
        "user_id" = auth.uid()
    );

CREATE POLICY "document_templates_modify_policy" ON "public"."document_templates"
    FOR ALL USING ("user_id" = auth.uid())
    WITH CHECK ("user_id" = auth.uid());

-- Grant permissions
GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";

GRANT ALL ON TABLE "public"."document_folders" TO "anon";
GRANT ALL ON TABLE "public"."document_folders" TO "authenticated";
GRANT ALL ON TABLE "public"."document_folders" TO "service_role";

GRANT ALL ON TABLE "public"."document_folder_items" TO "anon";
GRANT ALL ON TABLE "public"."document_folder_items" TO "authenticated";
GRANT ALL ON TABLE "public"."document_folder_items" TO "service_role";

GRANT ALL ON TABLE "public"."document_templates" TO "anon";
GRANT ALL ON TABLE "public"."document_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."document_templates" TO "service_role";

-- Create storage bucket for general documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    10485760, -- 10MB limit
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/svg+xml',
        'text/plain',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "documents_storage_select_policy" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND 
        (auth.uid()::text = (storage.foldername(name))[1] OR 
         EXISTS (SELECT 1 FROM documents WHERE storage_path = name AND is_public = true))
    );

CREATE POLICY "documents_storage_insert_policy" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "documents_storage_update_policy" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "documents_storage_delete_policy" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Insert some default document templates
INSERT INTO "public"."document_templates" (name, description, category, icon, fields, is_system)
VALUES 
    (
        'General Document',
        'Basic document template with common fields',
        'general',
        '📄',
        '[
            {"name": "title", "label": "Title", "type": "text", "required": true},
            {"name": "description", "label": "Description", "type": "textarea", "required": false},
            {"name": "author", "label": "Author", "type": "text", "required": false},
            {"name": "date", "label": "Date", "type": "date", "required": false}
        ]'::jsonb,
        true
    ),
    (
        'Invoice',
        'Invoice document template',
        'financial',
        '🧾',
        '[
            {"name": "invoice_number", "label": "Invoice Number", "type": "text", "required": true},
            {"name": "vendor_name", "label": "Vendor Name", "type": "text", "required": true},
            {"name": "total_amount", "label": "Total Amount", "type": "currency", "required": true},
            {"name": "invoice_date", "label": "Invoice Date", "type": "date", "required": true},
            {"name": "due_date", "label": "Due Date", "type": "date", "required": false}
        ]'::jsonb,
        true
    ),
    (
        'Contract',
        'Contract document template',
        'legal',
        '📝',
        '[
            {"name": "contract_number", "label": "Contract Number", "type": "text", "required": true},
            {"name": "party_names", "label": "Party Names", "type": "text", "required": true},
            {"name": "start_date", "label": "Start Date", "type": "date", "required": true},
            {"name": "end_date", "label": "End Date", "type": "date", "required": false},
            {"name": "contract_value", "label": "Contract Value", "type": "currency", "required": false}
        ]'::jsonb,
        true
    );

-- Comments
COMMENT ON TABLE "public"."documents" IS 'General purpose document storage independent of any specific entity';
COMMENT ON TABLE "public"."document_folders" IS 'Folder system for organizing documents';
COMMENT ON TABLE "public"."document_folder_items" IS 'Many-to-many relationship between documents and folders';
COMMENT ON TABLE "public"."document_templates" IS 'Templates defining document types and their fields';
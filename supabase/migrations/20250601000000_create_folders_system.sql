-- Migration: Create proper folder system for documents
-- This migration creates a folders table and a join table to manage document-folder relationships

-- Create folders table
CREATE TABLE IF NOT EXISTS "public"."folders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "obra_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "color" "text" DEFAULT '#6B7280',
    "icon" "text" DEFAULT '📁',
    "is_default" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0
);

-- Create join table for folder-document relationships
CREATE TABLE IF NOT EXISTS "public"."folder_documents" (
    "folder_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    PRIMARY KEY ("folder_id", "document_id")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "folders_obra_id_idx" ON "public"."folders" USING "btree" ("obra_id");
CREATE INDEX IF NOT EXISTS "folders_user_id_idx" ON "public"."folders" USING "btree" ("user_id");
CREATE INDEX IF NOT EXISTS "folders_name_idx" ON "public"."folders" USING "btree" ("name");
CREATE INDEX IF NOT EXISTS "folder_documents_folder_id_idx" ON "public"."folder_documents" USING "btree" ("folder_id");
CREATE INDEX IF NOT EXISTS "folder_documents_document_id_idx" ON "public"."folder_documents" USING "btree" ("document_id");

-- Set primary key for folders
ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "folders_pkey" PRIMARY KEY ("id");

-- Add foreign key constraints for folders
ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "folders_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Add foreign key constraints for folder_documents
ALTER TABLE ONLY "public"."folder_documents"
    ADD CONSTRAINT "folder_documents_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."folder_documents"
    ADD CONSTRAINT "folder_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."obra_documents"("id") ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate folder names per obra
ALTER TABLE ONLY "public"."folders"
    ADD CONSTRAINT "unique_folder_name_per_obra" UNIQUE ("obra_id", "name");

-- Create trigger to automatically update updated_at for folders
CREATE OR REPLACE TRIGGER "folders_updated_at"
    BEFORE UPDATE ON "public"."folders"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Enable Row Level Security for folders
ALTER TABLE "public"."folders" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for folders
CREATE POLICY "folders_select_policy" ON "public"."folders"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."obras" 
            WHERE "obras"."id" = "folders"."obra_id"
            AND "obras"."user_id" = auth.uid()
        )
    );

CREATE POLICY "folders_insert_policy" ON "public"."folders"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."obras" 
            WHERE "obras"."id" = "folders"."obra_id"
            AND "obras"."user_id" = auth.uid()
        )
        AND "folders"."user_id" = auth.uid()
    );

CREATE POLICY "folders_update_policy" ON "public"."folders"
    FOR UPDATE USING (
        "folders"."user_id" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."obras" 
            WHERE "obras"."id" = "folders"."obra_id"
            AND "obras"."user_id" = auth.uid()
        )
    );

CREATE POLICY "folders_delete_policy" ON "public"."folders"
    FOR DELETE USING (
        "folders"."user_id" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."obras" 
            WHERE "obras"."id" = "folders"."obra_id"
            AND "obras"."user_id" = auth.uid()
        )
    );

-- Enable Row Level Security for folder_documents
ALTER TABLE "public"."folder_documents" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for folder_documents
CREATE POLICY "folder_documents_select_policy" ON "public"."folder_documents"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."folders" f
            JOIN "public"."obras" o ON o.id = f.obra_id
            WHERE f.id = "folder_documents"."folder_id"
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "folder_documents_insert_policy" ON "public"."folder_documents"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."folders" f
            JOIN "public"."obras" o ON o.id = f.obra_id
            WHERE f.id = "folder_documents"."folder_id"
            AND o.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM "public"."obra_documents" d
            JOIN "public"."obras" o ON o.id = d.obra_id
            WHERE d.id = "folder_documents"."document_id"
            AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "folder_documents_delete_policy" ON "public"."folder_documents"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM "public"."folders" f
            JOIN "public"."obras" o ON o.id = f.obra_id
            WHERE f.id = "folder_documents"."folder_id"
            AND o.user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON TABLE "public"."folders" TO "anon";
GRANT ALL ON TABLE "public"."folders" TO "authenticated";
GRANT ALL ON TABLE "public"."folders" TO "service_role";

GRANT ALL ON TABLE "public"."folder_documents" TO "anon";
GRANT ALL ON TABLE "public"."folder_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."folder_documents" TO "service_role";

-- Function to create default folders for an obra
CREATE OR REPLACE FUNCTION create_default_folders_for_obra(obra_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
    -- Insert default folders if they don't exist
    INSERT INTO "public"."folders" (obra_id, user_id, name, color, icon, is_default, sort_order)
    VALUES
        (obra_id, user_id, 'Sin Clasificar', '#6B7280', '📂', true, 0),
        (obra_id, user_id, 'Documentos Legales', '#DC2626', '⚖️', true, 1),
        (obra_id, user_id, 'Planos y Diseños', '#2563EB', '📐', true, 2),
        (obra_id, user_id, 'Fotografías', '#16A34A', '📷', true, 3),
        (obra_id, user_id, 'Reportes', '#7C3AED', '📊', true, 4),
        (obra_id, user_id, 'Correspondencia', '#0891B2', '✉️', true, 5)
    ON CONFLICT (obra_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Migrate existing folder data from obra_documents to the new system
-- This function will be called manually after the migration
CREATE OR REPLACE FUNCTION migrate_existing_folders()
RETURNS void AS $$
DECLARE
    obra_record RECORD;
    folder_record RECORD;
    document_record RECORD;
    folder_id uuid;
BEGIN
    -- For each obra, create folders based on existing folder names in documents
    FOR obra_record IN 
        SELECT DISTINCT obra_id, 
               (SELECT user_id FROM obras WHERE id = obra_documents.obra_id) as user_id
        FROM obra_documents 
        WHERE folder IS NOT NULL AND folder != ''
    LOOP
        -- Create default folders first
        PERFORM create_default_folders_for_obra(obra_record.obra_id, obra_record.user_id);
        
        -- Create folders for existing unique folder names
        FOR folder_record IN
            SELECT DISTINCT folder
            FROM obra_documents 
            WHERE obra_id = obra_record.obra_id 
            AND folder IS NOT NULL 
            AND folder != ''
        LOOP
            -- Insert folder if it doesn't exist
            INSERT INTO folders (obra_id, user_id, name, color, icon, is_default)
            VALUES (obra_record.obra_id, obra_record.user_id, folder_record.folder, '#6B7280', '📁', false)
            ON CONFLICT (obra_id, name) DO NOTHING;
        END LOOP;
        
        -- Now link documents to folders
        FOR document_record IN
            SELECT id, folder
            FROM obra_documents 
            WHERE obra_id = obra_record.obra_id 
            AND folder IS NOT NULL 
            AND folder != ''
        LOOP
            -- Get folder ID
            SELECT id INTO folder_id
            FROM folders 
            WHERE obra_id = obra_record.obra_id 
            AND name = document_record.folder;
            
            -- Link document to folder
            IF folder_id IS NOT NULL THEN
                INSERT INTO folder_documents (folder_id, document_id)
                VALUES (folder_id, document_record.id)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a view to easily get documents with their folder information
CREATE OR REPLACE VIEW "public"."documents_with_folders" AS
SELECT 
    d.*,
    f.id as folder_id,
    f.name as folder_name,
    f.color as folder_color,
    f.icon as folder_icon
FROM obra_documents d
LEFT JOIN folder_documents fd ON d.id = fd.document_id
LEFT JOIN folders f ON fd.folder_id = f.id;

GRANT SELECT ON "public"."documents_with_folders" TO "anon";
GRANT SELECT ON "public"."documents_with_folders" TO "authenticated";
GRANT SELECT ON "public"."documents_with_folders" TO "service_role"; 
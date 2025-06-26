-- Migration: Recreate obra documents system
-- The obra_documents table was dropped in a previous migration, so we need to recreate it

-- Create the obra_documents table
CREATE TABLE IF NOT EXISTS "public"."obra_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text" NOT NULL, -- MIME type (e.g., 'application/pdf', 'image/jpeg')
    "obra_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL, -- Who uploaded the document
    "size" bigint NOT NULL, -- File size in bytes
    "name" "text" NOT NULL, -- Original filename
    "path" "text"[] NOT NULL, -- Storage path array [obra_id, filename]
    "description" "text", -- Optional description
    "category" "text", -- Document category (plans, photos, reports, contracts, etc.)
    "folder" "text" DEFAULT 'Sin Clasificar', -- Document folder for organization
    "is_public" boolean DEFAULT false, -- Whether the document is publicly accessible
    "tags" "text"[] DEFAULT '{}', -- Document tags for organization
    "version" integer DEFAULT 1, -- Document version number
    "checksum" "text" -- File checksum for integrity verification
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "obra_documents_obra_id_idx" ON "public"."obra_documents" USING "btree" ("obra_id");
CREATE INDEX IF NOT EXISTS "obra_documents_user_id_idx" ON "public"."obra_documents" USING "btree" ("user_id");
CREATE INDEX IF NOT EXISTS "obra_documents_type_idx" ON "public"."obra_documents" USING "btree" ("type");
CREATE INDEX IF NOT EXISTS "obra_documents_category_idx" ON "public"."obra_documents" USING "btree" ("category");
CREATE INDEX IF NOT EXISTS "obra_documents_folder_idx" ON "public"."obra_documents" USING "btree" ("folder");
CREATE INDEX IF NOT EXISTS "obra_documents_created_at_idx" ON "public"."obra_documents" USING "btree" ("created_at");

-- Set primary key
ALTER TABLE ONLY "public"."obra_documents"
    ADD CONSTRAINT "obra_documents_pkey" PRIMARY KEY ("id");

-- Add foreign key constraints
ALTER TABLE ONLY "public"."obra_documents"
    ADD CONSTRAINT "obra_documents_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;

-- Add foreign key for user_id (assuming you have a users table or auth.users)
ALTER TABLE ONLY "public"."obra_documents"
    ADD CONSTRAINT "obra_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE TRIGGER "obra_documents_updated_at"
    BEFORE UPDATE ON "public"."obra_documents"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();

-- Enable Row Level Security
ALTER TABLE "public"."obra_documents" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for obra_documents
-- Users can view documents for obras they have access to
CREATE POLICY "obra_documents_select_policy" ON "public"."obra_documents"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."obras" 
            WHERE "obras"."id" = "obra_documents"."obra_id"
            AND "obras"."user_id" = auth.uid()
        )
    );

-- Users can insert documents for obras they own
CREATE POLICY "obra_documents_insert_policy" ON "public"."obra_documents"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."obras" 
            WHERE "obras"."id" = "obra_documents"."obra_id"
            AND "obras"."user_id" = auth.uid()
        )
        AND "obra_documents"."user_id" = auth.uid()
    );

-- Users can update documents they uploaded for obras they own
CREATE POLICY "obra_documents_update_policy" ON "public"."obra_documents"
    FOR UPDATE USING (
        "obra_documents"."user_id" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."obras" 
            WHERE "obras"."id" = "obra_documents"."obra_id"
            AND "obras"."user_id" = auth.uid()
        )
    );

-- Users can delete documents they uploaded for obras they own
CREATE POLICY "obra_documents_delete_policy" ON "public"."obra_documents"
    FOR DELETE USING (
        "obra_documents"."user_id" = auth.uid()
        AND EXISTS (
            SELECT 1 FROM "public"."obras" 
            WHERE "obras"."id" = "obra_documents"."obra_id"
            AND "obras"."user_id" = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON TABLE "public"."obra_documents" TO "anon";
GRANT ALL ON TABLE "public"."obra_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."obra_documents" TO "service_role";

-- Create storage bucket for obra documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'obra-vault',
    'obra-vault',
    false,
    10485760, -- 10MB limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/x-rar-compressed',
        'application/dwg',
        'application/dxf'
    ]
) ON CONFLICT (id) DO NOTHING;
-- Migration: Add missing storage policies for obra-vault bucket
-- The storage policies were missing from the recreate migration

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "obra_vault_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "obra_vault_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "obra_vault_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "obra_vault_delete_policy" ON storage.objects;

-- Also fix obra_documents policies for development
DROP POLICY IF EXISTS "obra_documents_select_policy" ON public.obra_documents;
DROP POLICY IF EXISTS "obra_documents_insert_policy" ON public.obra_documents;
DROP POLICY IF EXISTS "obra_documents_update_policy" ON public.obra_documents;
DROP POLICY IF EXISTS "obra_documents_delete_policy" ON public.obra_documents;

-- Create storage policies for the obra-vault bucket
-- Allow uploads to obra-vault bucket (permissive for development)
CREATE POLICY "obra_vault_upload_policy" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'obra-vault'
    );

-- Allow users to view files for obras they have access to (or all for development)
CREATE POLICY "obra_vault_select_policy" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'obra-vault'
    );

-- Allow users to update files for obras they own (or all for development)
CREATE POLICY "obra_vault_update_policy" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'obra-vault'
    );

-- Allow users to delete files for obras they own (or all for development)
CREATE POLICY "obra_vault_delete_policy" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'obra-vault'
    );

-- Create permissive obra_documents policies for development
CREATE POLICY "obra_documents_select_policy" ON public.obra_documents
    FOR SELECT USING (true);

CREATE POLICY "obra_documents_insert_policy" ON public.obra_documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "obra_documents_update_policy" ON public.obra_documents
    FOR UPDATE USING (true);

CREATE POLICY "obra_documents_delete_policy" ON public.obra_documents
    FOR DELETE USING (true); 
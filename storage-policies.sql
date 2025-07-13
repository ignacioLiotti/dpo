-- Storage RLS Policies for Organization Files
-- Run this script as supabase_storage_admin or with service role key

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organization members can view files" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can update files" ON storage.objects;
DROP POLICY IF EXISTS "Organization members can delete files" ON storage.objects;

-- Policy for SELECT (view files)
CREATE POLICY "Organization members can view files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'organization-files' AND
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid()
    AND om.is_active = true
    AND om.organization_id = public.get_organization_from_storage_path(name)
  )
);

-- Policy for INSERT (upload files)
CREATE POLICY "Organization members can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'organization-files' AND
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid()
    AND om.is_active = true
    AND om.organization_id = public.get_organization_from_storage_path(name)
  )
);

-- Policy for UPDATE (modify files)
CREATE POLICY "Organization members can update files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'organization-files' AND
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid()
    AND om.is_active = true
    AND om.organization_id = public.get_organization_from_storage_path(name)
  )
);

-- Policy for DELETE (remove files)
CREATE POLICY "Organization members can delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'organization-files' AND
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid()
    AND om.is_active = true
    AND om.organization_id = public.get_organization_from_storage_path(name)
  )
);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
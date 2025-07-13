-- Add storage bucket and basic policies for organization files
-- Migration: 20250713000004_add_storage_rls_policies.sql

-- =============================================================================
-- ENSURE BUCKET EXISTS AND IS PROPERLY CONFIGURED
-- =============================================================================

-- Create the organization-files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-files',
  'organization-files',
  false, -- Private bucket
  104857600, -- 100MB limit
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
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- HELPER FUNCTION FOR ORGANIZATION CONTEXT
-- =============================================================================

-- Create a helper function to get organization from file path
CREATE OR REPLACE FUNCTION public.get_organization_from_storage_path(file_path text)
RETURNS uuid AS $$
BEGIN
  -- Extract the organization_id from the file path (first segment)
  RETURN split_part(file_path, '/', 1)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_organization_from_storage_path(text) TO authenticated;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION public.get_organization_from_storage_path(text) IS 'Extract organization UUID from storage file path for RLS policies';

-- =============================================================================
-- INSTRUCTIONS FOR MANUAL STORAGE POLICY SETUP
-- =============================================================================

-- The following storage policies need to be applied manually via Supabase Dashboard
-- or with service role key due to permission requirements:

-- 1. Enable RLS on storage.objects (if not already enabled)
-- 2. Create policies for storage.objects table:

/*
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
*/

-- Note: These policies ensure that users can only access files within their organization's folder
-- File paths should follow the pattern: {organization_id}/{filename}
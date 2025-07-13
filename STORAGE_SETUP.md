# Storage RLS Setup Instructions

The file storage system requires Row Level Security (RLS) policies to be set up manually on the `storage.objects` table. This is because these policies require elevated permissions that can't be applied through regular migrations.

## 🚨 Critical Setup Required

**The storage policies MUST be applied for file access to work correctly!**

Without these policies:
- Users won't be able to see uploaded files
- Download URLs will be generated but access will be denied
- File uploads may work but retrieval will fail

## 📋 Setup Steps

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** → **Policies** 
3. Click **New Policy** on the `objects` table
4. Apply the following policies:

#### Policy 1: View Files
```sql
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
```

#### Policy 2: Upload Files
```sql
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
```

#### Policy 3: Update Files
```sql
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
```

#### Policy 4: Delete Files
```sql
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
```

### Option 2: Service Role Key

1. Use your service role key to connect to the database
2. Run the SQL script: `storage-policies.sql`

```bash
psql "postgresql://[your-connection-string]" -f storage-policies.sql
```

### Option 3: Supabase CLI (If Available)

```bash
npx supabase db push --include-storage
```

## 🔍 How It Works

### File Path Structure
Files are stored with the path pattern: `{organization_id}/{filename}`

Example: `550e8400-e29b-41d4-a716-446655440000/1642089123456_document.pdf`

### Helper Function
The policies use a helper function `get_organization_from_storage_path()` that:
- Extracts the organization ID from the file path
- Returns it as a UUID for comparison with user memberships

### Security Model
- Users can only access files in their organization's folder
- Organization membership is verified through `organization_memberships` table
- Only active memberships are considered
- All CRUD operations (Create, Read, Update, Delete) are controlled

## ✅ Verification

After applying the policies, test with:

```sql
-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Test organization extraction function
SELECT public.get_organization_from_storage_path('550e8400-e29b-41d4-a716-446655440000/test.pdf');
```

## 🐛 Troubleshooting

### Common Issues

1. **"Access denied" when downloading files**
   - Check that storage policies are applied
   - Verify user has active organization membership
   - Confirm file path follows correct pattern

2. **File uploads succeed but can't view files**
   - This is the classic symptom of missing storage SELECT policy
   - Apply the "View Files" policy from above

3. **Helper function not found**
   - Ensure the migration `20250713000004_add_storage_rls_policies.sql` was applied
   - The function should exist in the `public` schema

### Debug Queries

```sql
-- Check your organization membership
SELECT om.organization_id, om.is_active 
FROM public.organization_memberships om 
WHERE om.user_id = auth.uid();

-- Check file paths in storage
SELECT name, bucket_id 
FROM storage.objects 
WHERE bucket_id = 'organization-files' 
LIMIT 5;

-- Test path extraction
SELECT public.get_organization_from_storage_path(name) as org_id, name
FROM storage.objects 
WHERE bucket_id = 'organization-files'
LIMIT 5;
```

## 📁 Bucket Configuration

The `organization-files` bucket is configured with:
- **Private**: Not publicly accessible
- **File size limit**: 100MB per file
- **Allowed file types**: Documents, images, archives, CAD files
- **RLS Enabled**: Access controlled by policies

## 🔐 Security Notes

- Files are organized by organization ID to prevent cross-organization access
- Users must be active members of an organization to access its files
- The helper function safely handles malformed paths
- All policies check both bucket ID and organization membership
- No public access is allowed - all files require authentication

---

**⚠️ Important**: Without these storage policies, the file management system will not function correctly. This is a required setup step!
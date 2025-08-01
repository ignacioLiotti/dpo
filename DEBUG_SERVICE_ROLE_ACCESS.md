# Debug Service Role Access Issue

## Problem
Background processing fails with "Document not found" error when using service role key.

## Potential Causes

### 1. RLS Policy Blocking Service Role
Even though service role should bypass RLS, there might be policies preventing access.

### 2. Race Condition
Document processing triggered before database transaction is fully committed.

### 3. Wrong Environment Variable
Service role key might not be properly configured.

## Fixes Applied

### 1. Added Better Logging
```typescript
console.log('[Process] Fetching document with service role:', documentId);
const { data: document, error: docError } = await supabase
  .from('files')
  .select('organization_id, created_by, name, processing_status, is_active')
  .eq('id', documentId)
  .single();
console.log('[Process] Document query result:', { document, error: docError });
```

### 2. Added Processing Delay
```typescript
// Add small delay to ensure database transaction is committed
setTimeout(() => {
  triggerBackgroundProcessingWithRetry(fileRecord.id)
}, 100); // 100ms delay
```

### 3. Enhanced Service Role Headers
```typescript
global: {
  headers: {
    'x-connection-pool': 'true',
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }
}
```

## Environment Check

Make sure these environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (not the anon key!)

## Test Service Role Access

You can test service role access directly by:

1. Upload a document
2. Check the console logs for the debug messages
3. Verify the service role key has proper permissions

## Expected Behavior After Fixes

1. ✅ Service role should bypass RLS and access all documents
2. ✅ 100ms delay should prevent race conditions
3. ✅ Better logging should show exactly what's happening
4. ✅ Document processing should complete successfully

## If Still Failing

If the issue persists, the problem might be:
1. Wrong service role key in environment
2. Database RLS policies need review
3. Need to check if files table has RLS enabled
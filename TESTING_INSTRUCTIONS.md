# Testing Instructions for Event-Driven Document Processing

## Quick Test Steps

### 1. Test Document Upload with Optimistic UI

1. **Navigate to files page** with a folder that has extraction enabled
2. **Upload a document** (image or PDF) 
3. **Observe optimistic UI**:
   - ✅ Upload progress indicators
   - ✅ Real-time status updates
   - ✅ Status changes from "uploading" → "uploaded" → "processing" → "completed"
   - ✅ Toast notifications for each stage

### 2. Test Manual Processing (Debug Mode)

1. **Navigate to** `/files/debug`
2. **Use the document ID** from the upload (check browser console or logs)
3. **Click "Manual Process"** to test processing without Edge Function
4. **Verify results**:
   - ✅ Document status changes to "processing" then "completed"
   - ✅ Analysis data is saved (description, tags, category)
   - ✅ For extraction-enabled folders: extracted data is created
   - ✅ Real-time UI updates

### 3. Test Queue Status

1. **In debug page**, click "Check Queue Status"
2. **Verify**:
   - ✅ Recent files show up
   - ✅ Processing queue shows jobs
   - ✅ Pending jobs are listed
   - ✅ Status indicators are correct

### 4. Test Field Extraction

1. **Create a folder** with `extract_data = true`
2. **Add field definitions** (e.g., invoice_number, total_amount, date)
3. **Upload a document** to this folder
4. **Run manual processing** or trigger Edge Function
5. **Verify**:
   - ✅ Document gets high priority processing
   - ✅ Extracted data is saved to `extracted_data` table
   - ✅ UI shows extraction completion
   - ✅ Field values are populated

## Current State Analysis

Based on your logs, here's what's working and what needs attention:

### ✅ Working Components

1. **Document Upload**
   - Files are successfully uploaded to storage
   - File records are created in database
   - Folder assignments work correctly
   - Extraction-enabled folders are detected

2. **Database Structure**
   - All required tables exist
   - RLS policies are working
   - Relationships are properly configured

3. **UI Components**
   - Optimistic upload states
   - Real-time status indicators
   - Processing queue dashboard
   - Status notifications

### ⚠️ Issues to Address

1. **Processing Queue Function**
   - The `enqueue_document_processing` RPC function may not exist or have issues
   - Auto-trigger after upload might not be working
   - Edge Function may not be deployed or configured

2. **Database Triggers**
   - Auto-enqueue trigger may not be active
   - Processing queue may not be populated automatically

3. **Edge Function**
   - May not be deployed to Supabase
   - Environment variables may not be configured
   - API endpoints may not be accessible

## Immediate Fixes

### 1. Fix Processing Queue Function

The logs show that `enqueue_document_processing` is failing. Let's verify the function exists:

```sql
-- Check if function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'enqueue_document_processing';

-- If missing, run the migration:
-- supabase/migrations/20250713000005_setup_background_processing.sql
```

### 2. Test Manual Processing

Use the debug endpoints to test without relying on the Edge Function:

```bash
# Test manual processing
curl -X POST http://localhost:3000/api/debug/manual-process \
  -H "Content-Type: application/json" \
  -d '{"documentId": "YOUR_DOCUMENT_ID"}'

# Check queue status
curl http://localhost:3000/api/debug/processing-queue
```

### 3. Verify Database Triggers

Check if the auto-enqueue trigger is active:

```sql
-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_enqueue_document';
```

## Step-by-Step Debugging

### Step 1: Upload Document
- Document ID: `7981e440-0a73-4e71-a55b-ff3434a85dbf`
- Folder ID: `8fd644e6-8ff3-429d-9c03-cd1be0af4199`
- Status: Successfully uploaded, folder assignment created

### Step 2: Test Manual Processing
```bash
# Navigate to debug page
http://localhost:3000/files/debug

# Enter document ID: 7981e440-0a73-4e71-a55b-ff3434a85dbf
# Click "Manual Process"
```

### Step 3: Check Database
```sql
-- Check file status
SELECT id, name, processing_status, created_at 
FROM files 
WHERE id = '7981e440-0a73-4e71-a55b-ff3434a85dbf';

-- Check processing queue
SELECT * FROM processing_queue 
WHERE file_id = '7981e440-0a73-4e71-a55b-ff3434a85dbf';

-- Check analysis results
SELECT * FROM file_analysis 
WHERE file_id = '7981e440-0a73-4e71-a55b-ff3434a85dbf';

-- Check extracted data
SELECT * FROM extracted_data 
WHERE file_id = '7981e440-0a73-4e71-a55b-ff3434a85dbf';
```

## Expected Behavior

### Normal Flow
1. User uploads document → Status: "pending"
2. Database trigger adds to processing_queue → Status: "pending"
3. Background processor (Edge Function) picks up job → Status: "processing"
4. AI processes document → Status: "processing"
5. Results saved to file_analysis and extracted_data → Status: "completed"
6. Real-time UI updates throughout

### Debug Flow
1. User uploads document → Status: "pending"
2. User navigates to debug page
3. User triggers manual processing → Status: "processing"
4. Manual processing creates test data → Status: "completed"
5. UI updates in real-time

## Next Steps

1. **Test with debug endpoints** to verify core functionality
2. **Check database migrations** are applied correctly
3. **Deploy Edge Function** if not already deployed
4. **Configure environment variables** for API keys
5. **Set up cron job** for automatic processing
6. **Test real-time updates** with WebSocket subscriptions

## Common Issues & Solutions

### Issue: Processing Queue Function Missing
**Solution**: Run the background processing migration
```sql
-- File: supabase/migrations/20250713000005_setup_background_processing.sql
```

### Issue: Edge Function Not Deployed
**Solution**: Deploy the Edge Function
```bash
supabase functions deploy process-document-ai
```

### Issue: Environment Variables Missing
**Solution**: Set required environment variables
```bash
# In Supabase Dashboard → Settings → Environment Variables
OPENAI_API_KEY=your_key_here
```

### Issue: Real-time Updates Not Working
**Solution**: Check WebSocket connection and RLS policies
```sql
-- Verify RLS policies allow real-time subscriptions
```

## Success Indicators

When everything is working correctly, you should see:

1. **Upload UI**: Smooth progress indicators and status changes
2. **Database**: Records in files, processing_queue, file_analysis, extracted_data
3. **Real-time**: UI updates automatically without page refresh
4. **Processing**: Documents transition through pending → processing → completed
5. **Extraction**: Field data extracted and saved for configured folders
6. **Notifications**: Toast messages for each processing stage

## Debug Outputs

Check browser console and server logs for:
- `[uploadDocumentsAction]` - Upload flow
- `[manual-process]` - Manual processing
- `[getFolderExtractedData]` - Extraction data retrieval
- WebSocket connection messages
- Database query results
- Edge Function logs (if deployed)

Use the debug page at `/files/debug` to test individual components and verify the system is working correctly.
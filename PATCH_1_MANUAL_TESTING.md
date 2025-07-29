# Patch 1: Manual Testing Guide

## 🧪 Manual Testing Checklist

Use this guide to manually verify Patch 1 improvements in your development environment.

### Prerequisites
- [ ] Apply database migration: `20250127_add_processing_error_column.sql`
- [ ] Update server code with Patch 1 changes
- [ ] Have test files ready (PDFs, images of various sizes)

---

## 1. Memory Management Tests

### Test 1.1: Large File Upload
**Goal**: Verify no memory crashes with large files

1. Open browser developer tools → Performance tab
2. Start memory profiling
3. Upload a 9MB PDF file
4. Monitor memory usage during upload

**Expected Result**:
- ✅ Memory usage should not spike dramatically
- ✅ Upload completes without browser freeze
- ✅ No "out of memory" errors

### Test 1.2: Multiple File Upload
**Goal**: Test concurrent uploads don't exhaust memory

1. Select 5-10 files (mix of PDFs and images)
2. Total size should be ~30-40MB
3. Upload all at once

**Expected Result**:
- ✅ All files upload successfully
- ✅ Browser remains responsive
- ✅ Memory is released after upload

---

## 2. Transaction Safety Tests

### Test 2.1: Storage Failure Simulation
**Goal**: Verify cleanup on storage failure

1. Fill storage quota (or simulate with dev tools)
2. Attempt to upload a file
3. Check Supabase storage bucket

**Expected Result**:
- ✅ Upload fails with clear error message
- ✅ No partial file in storage
- ✅ No orphaned database record

### Test 2.2: Database Failure Simulation
**Goal**: Test rollback when DB insert fails

1. Temporarily break DB permissions
2. Upload a file
3. Check storage and database

**Expected Result**:
- ✅ Error message shown to user
- ✅ File automatically removed from storage
- ✅ No incomplete records in database

---

## 3. Retry Mechanism Tests

### Test 3.1: OCR Provider Timeout
**Goal**: Verify retry behavior

1. Upload an image file
2. Monitor network tab for OCR API calls
3. Look for retry attempts in logs

**Expected Result**:
- ✅ Failed requests are retried (up to 3 times)
- ✅ Delays increase between retries
- ✅ Final status correctly set (completed/failed)

### Test 3.2: Recovery from Transient Errors
**Goal**: Test successful retry after failures

1. Use network throttling to simulate slow connection
2. Upload a document
3. Monitor processing status

**Expected Result**:
- ✅ Processing eventually succeeds
- ✅ Status updates: pending → processing → completed
- ✅ No stuck "processing" status

---

## 4. Error Handling Tests

### Test 4.1: Invalid File Type
**Goal**: Proper validation and messaging

1. Try uploading a .txt or .exe file
2. Try uploading a file > 10MB

**Expected Result**:
- ✅ Clear error message before upload starts
- ✅ No network requests made
- ✅ Specific reason for rejection shown

### Test 4.2: Processing Failure Visibility
**Goal**: Verify error logging

1. Upload a corrupted PDF
2. Check document status
3. Check browser console logs

**Expected Result**:
- ✅ Status shows as "failed"
- ✅ Error details in console logs
- ✅ Error message stored in `processing_error` column

---

## 5. Performance Tests

### Test 5.1: Upload Speed
**Goal**: Verify streaming doesn't slow uploads

1. Time upload of a 5MB file before Patch 1
2. Time same upload after Patch 1
3. Compare results

**Expected Result**:
- ✅ Upload time similar or better
- ✅ No significant performance degradation
- ✅ Progress feedback remains smooth

### Test 5.2: Concurrent Processing
**Goal**: Multiple files process efficiently

1. Upload 3 files simultaneously
2. Monitor processing status for each
3. Check final results

**Expected Result**:
- ✅ All files process (not necessarily in order)
- ✅ Failures don't block other files
- ✅ Each file has independent status

---

## 6. Regression Tests

### Test 6.1: Existing Features
**Goal**: Ensure nothing broke

- [ ] File preview still works
- [ ] Download functionality intact
- [ ] Folder assignment works
- [ ] Search and filtering unchanged
- [ ] OCR text extraction successful

### Test 6.2: API Compatibility
**Goal**: No breaking changes

- [ ] Existing UI components work
- [ ] No TypeScript errors
- [ ] Database queries still valid
- [ ] Webhook integration functional

---

## 📊 Test Results Template

Copy and fill out after testing:

```markdown
## Patch 1 Manual Test Results

**Date**: [DATE]
**Tester**: [NAME]
**Environment**: [Dev/Staging]

### Summary
- Total Tests: 12
- Passed: [X]
- Failed: [X]
- Blocked: [X]

### Critical Issues
1. [Issue description if any]

### Performance Metrics
- 5MB upload time: [X]s
- Memory peak: [X]MB
- Retry success rate: [X]%

### Recommendation
[ ] Ready for deployment
[ ] Needs fixes (list below)
[ ] Requires more testing

### Notes
[Any additional observations]
```

---

## 🚨 What to Look For

### Green Flags ✅
- Smooth uploads without freezes
- Clear error messages
- Automatic cleanup on failures
- Successful retries
- Consistent status updates

### Red Flags ❌
- Browser memory warnings
- Stuck "processing" status
- Orphaned files in storage
- Missing error messages
- Infinite retry loops

---

## 📝 Logging

Check these locations for detailed logs:
1. Browser Console (F12)
2. Network Tab → Failed requests
3. Supabase Dashboard → Logs
4. Database → `files.processing_error` column

Look for log prefixes:
- `[Upload]` - Upload operations
- `[Process]` - Document processing
- `[OCR]` - OCR operations
- `[Retry]` - Retry attempts

---

## 🎯 Success Criteria

Patch 1 is ready for deployment when:
1. **No memory crashes** during large uploads
2. **100% cleanup rate** for failed uploads
3. **Retry mechanism** recovers from transient failures
4. **All errors logged** with context
5. **No regression** in existing features

---

Happy Testing! 🚀
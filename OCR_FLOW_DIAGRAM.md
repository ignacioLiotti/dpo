# OCR Document Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as UI<br/>(add-document-card.tsx)
    participant Upload as Server Action<br/>(uploadDocumentsAction)
    participant Storage as Supabase Storage
    participant DB as Database<br/>(files table)
    participant BgProcessor as Background Processor<br/>(triggerBackgroundProcessingWithRetry)
    participant CoreProcessor as Core Processor<br/>(processDocument)
    participant ProviderFallback as Provider Fallback<br/>(performOCRWithProviderFallback)
    participant OpenAI as OpenAI Helper<br/>(processWithOpenAI)
    participant Mistral as Mistral Helper<br/>(processWithMistral)
    participant AIHelpers as AI Helpers<br/>(ai-helpers.ts)
    participant FieldExtractor as Field Extractor<br/>(extractStructuredFields)
    participant ResultSaver as Results Saver<br/>(saveProcessingResults)

    %% UPLOAD PHASE
    Note over User,ResultSaver: UPLOAD PHASE
    
    User->>UI: Upload file(s)
    activate UI
    
    Note right of UI: BOTTLENECK 1:<br/>Sequential file validation
    
    UI->>UI: validateFile()<br/>- Check size (max 10MB)<br/>- Check type (PDF, images)<br/>- Validate extensions
    
    loop for each file
        UI->>Upload: uploadDocumentsAction(formData)
        activate Upload
        
        Upload->>Upload: withTransaction()
        Note right of Upload: PERFORMANCE:<br/>Transaction ensures safety<br/>but adds overhead
        
        Upload->>Storage: streamingFileUpload()<br/>- Generate storage path<br/>- Upload to organization-files bucket
        activate Storage
        
        alt Upload Success
            Storage-->>Upload: Success
            deactivate Storage
            
            Upload->>DB: Insert file record<br/>- processing_status: 'pending'<br/>- organization_id, user_id<br/>- file metadata
            activate DB
            DB-->>Upload: File record created
            deactivate DB
            
            alt Has folder_id
                Upload->>DB: Create file_folder_assignment
                DB-->>Upload: Assignment created
            end
            
            Upload->>BgProcessor: triggerBackgroundProcessingWithRetry(fileId)
            Note right of BgProcessor: BOTTLENECK 2:<br/>Background processing is<br/>FIRE-AND-FORGET<br/>(no waiting)
            
        else Upload Failure
            Storage-->>Upload: Error
            deactivate Storage
            Upload->>Storage: cleanupFailedUpload()
            Note right of Storage: ERROR HANDLING:<br/>Automatic cleanup<br/>prevents orphaned files
        end
        
        Upload-->>UI: Result {success, data, errors}
        deactivate Upload
    end
    
    UI-->>User: Upload complete<br/>(optimistic UI)
    deactivate UI

    %% BACKGROUND PROCESSING PHASE
    Note over User,ResultSaver: BACKGROUND PROCESSING PHASE
    
    activate BgProcessor
    BgProcessor->>BgProcessor: trackProcessingJob(documentId)
    Note right of BgProcessor: PERFORMANCE:<br/>In-memory job tracking<br/>(could be Redis)
    
    BgProcessor->>DB: Update status to 'processing'
    DB-->>BgProcessor: Status updated
    
    BgProcessor->>BgProcessor: retryWithBackoff()<br/>- Max 3 attempts<br/>- Exponential backoff<br/>- 2s → 4s → 8s delays
    
    BgProcessor->>CoreProcessor: processDocument(documentId)
    activate CoreProcessor

    %% CORE PROCESSING PHASE
    Note over User,ResultSaver: CORE PROCESSING PHASE
    
    CoreProcessor->>CoreProcessor: Promise.race()<br/>- Processing logic<br/>- 2-minute timeout
    
    CoreProcessor->>DB: Complex JOIN query<br/>SELECT files.*, file_analysis.*,<br/>file_folder_assignments.*,<br/>folders.* FROM files...
    Note right of DB: BOTTLENECK 3:<br/>Heavy JOIN query<br/>with multiple tables
    
    activate DB
    DB-->>CoreProcessor: Document + analysis + folder data
    deactivate DB
    
    CoreProcessor->>CoreProcessor: Analyze processing needs:<br/>- hasOcrText?<br/>- needsFieldExtraction?<br/>- Determine processing path
    
    alt Case 1: Has OCR + No Extraction Needed
        CoreProcessor->>CoreProcessor: Use cached OCR<br/>No API calls needed
        Note right of CoreProcessor: OPTIMAL PATH:<br/>Zero API calls
        
    else Case 2: Has OCR + Needs Field Extraction
        CoreProcessor->>FieldExtractor: extractFieldsFromText()
        activate FieldExtractor
        FieldExtractor->>AIHelpers: extractStructuredFields()
        activate AIHelpers
        AIHelpers->>OpenAI: generateObject()<br/>- Dynamic schema<br/>- Field definitions<br/>- 30s timeout
        Note right of AIHelpers: BOTTLENECK 4:<br/>Field extraction API call<br/>can be slow
        OpenAI-->>AIHelpers: Structured data
        AIHelpers-->>FieldExtractor: Parsed fields
        deactivate AIHelpers
        FieldExtractor-->>CoreProcessor: Extracted data
        deactivate FieldExtractor
        
    else Case 3: No OCR - Full Processing Needed
        CoreProcessor->>Storage: createSignedUrl()<br/>Generate temporary access URL
        Storage-->>CoreProcessor: Signed URL (1hr expiry)
        
        CoreProcessor->>ProviderFallback: performOCRWithProviderFallback()
        activate ProviderFallback
        
        alt Image Files (PNG, JPG)
            ProviderFallback->>OpenAI: processWithOpenAI()
            activate OpenAI
            
            OpenAI->>AIHelpers: extractAndAnalyzeDocument()
            activate AIHelpers
            
            AIHelpers->>AIHelpers: convertImageUrlToBase64()<br/>- Fetch signed URL<br/>- Convert to base64<br/>- Create data URL
            Note right of AIHelpers: BOTTLENECK 5:<br/>Base64 conversion<br/>increases size by 33%<br/>uses memory
            
            AIHelpers->>OpenAI: generateObject()<br/>- ocrWithAnalysisSchema<br/>- Combined OCR + analysis<br/>- 30s timeout
            Note right of AIHelpers: PERFORMANCE:<br/>Single API call for<br/>OCR + analysis
            
            OpenAI-->>AIHelpers: Structured result
            AIHelpers-->>OpenAI: ProcessingResult
            deactivate AIHelpers
            OpenAI-->>ProviderFallback: Success
            deactivate OpenAI
            
        else Other Files or OpenAI Failure
            ProviderFallback->>Mistral: processWithMistral()
            activate Mistral
            
            Mistral->>Mistral: extractTextWithMistralUrl()<br/>- Mistral OCR API<br/>- Native file processing
            
            Mistral->>AIHelpers: analyzeWithMistral()
            AIHelpers->>Mistral: generateObject()<br/>- documentAnalysisSchema<br/>- 30s timeout
            Mistral-->>AIHelpers: Analysis result
            AIHelpers-->>Mistral: ProcessingResult
            Mistral-->>ProviderFallback: Success
            deactivate Mistral
            
        else All Providers Failed
            ProviderFallback->>ProviderFallback: Return fallback result<br/>- Empty OCR text<br/>- Basic description<br/>- Low confidence
            Note right of ProviderFallback: FALLBACK:<br/>Graceful degradation
        end
        
        ProviderFallback-->>CoreProcessor: ProcessingResult
        deactivate ProviderFallback
        
        alt Needs Field Extraction
            CoreProcessor->>FieldExtractor: extractFieldsFromText()
            Note right of FieldExtractor: BOTTLENECK 6:<br/>Additional API call<br/>after OCR
            FieldExtractor->>AIHelpers: extractStructuredFields()
            AIHelpers->>OpenAI: generateObject() [Field extraction]
            OpenAI-->>AIHelpers: Field data
            AIHelpers-->>FieldExtractor: Structured fields
            FieldExtractor-->>CoreProcessor: Extracted data
        end
    end

    %% RESULTS SAVING PHASE
    Note over User,ResultSaver: RESULTS SAVING PHASE
    
    CoreProcessor->>ResultSaver: saveProcessingResults()
    activate ResultSaver
    
    ResultSaver->>DB: Upsert file_analysis<br/>- OCR text, description, tags<br/>- Confidence, metadata
    Note right of DB: BOTTLENECK 7:<br/>Multiple DB operations<br/>not batched
    
    alt Has extracted data
        loop for each field
            ResultSaver->>DB: Upsert extracted_data<br/>- Individual INSERT per field
            Note right of DB: BOTTLENECK 8:<br/>N+1 query problem<br/>for field saving
        end
    end
    
    ResultSaver-->>CoreProcessor: Save complete
    deactivate ResultSaver
    
    CoreProcessor->>DB: Update processing_status = 'completed'
    DB-->>CoreProcessor: Status updated
    
    CoreProcessor-->>BgProcessor: ProcessingResult
    deactivate CoreProcessor
    
    BgProcessor->>BgProcessor: clearProcessingJob()<br/>Remove from tracking
    BgProcessor->>BgProcessor: Success logging
    deactivate BgProcessor

    %% ERROR HANDLING
    Note over CoreProcessor,DB: ERROR HANDLING<br/>- Any failure updates status to 'failed'<br/>- Error details stored in processing_error column<br/>- Retry logic with exponential backoff<br/>- Cleanup of partial operations

    %% PERFORMANCE BOTTLENECKS
    Note right of User: PERFORMANCE BOTTLENECKS IDENTIFIED<br/>1. Sequential file processing (not parallel)<br/>2. Heavy JOIN queries for document data<br/>3. Base64 conversion memory usage<br/>4. Multiple sequential API calls<br/>5. N+1 queries for field saving<br/>6. No caching of OCR results<br/>7. No connection pooling<br/>8. Blocking UI during upload
```

## Key Performance Bottlenecks Identified

### 🔴 Critical Bottlenecks
1. **Sequential file processing** - Files processed one by one, not in parallel
2. **Heavy JOIN queries** - Complex 4-table JOINs for document data retrieval
3. **Base64 conversion memory usage** - Images converted to base64 increase size by 33%
4. **Multiple sequential API calls** - OCR → Analysis → Field Extraction (3 separate calls)
5. **N+1 query problem** - Individual database inserts for each extracted field
6. **No caching of OCR results** - Identical documents re-processed unnecessarily
7. **No connection pooling** - New database connections for each operation
8. **Blocking UI during upload** - User interface waits for upload completion

### 📊 Flow Summary
- **Upload Phase**: User uploads files through optimistic UI with transaction safety
- **Background Processing**: Async processing with retry logic and job tracking
- **Core Processing**: Smart path selection based on existing OCR data
- **Provider Fallback**: OpenAI Vision → Mistral → Graceful degradation
- **Results Saving**: Database operations to store OCR text, analysis, and extracted fields
- **Error Handling**: Comprehensive error recovery with status tracking

### 🎯 Optimization Opportunities
The flow analysis reveals multiple optimization opportunities that could reduce processing time by 60-80% and significantly improve user experience through parallel processing, caching, and database optimization.
# Event-Driven Document Processing System

## Overview

This system implements a comprehensive event-driven architecture for AI-powered document processing with real-time updates, optimistic UI, and automatic field extraction for folders with extraction enabled.

## Features

### ✅ Event-Driven Architecture
- **Real-time WebSocket updates** for processing status changes
- **Automatic queue management** with priority-based processing
- **Background processing** with retry logic and exponential backoff
- **Database triggers** for automatic document queuing

### ✅ Optimistic UI Updates
- **Immediate feedback** during document upload
- **Progress indicators** with real-time status updates
- **Status notifications** via toast messages
- **Error handling** with graceful recovery

### ✅ AI Processing Pipeline
- **Multi-provider OCR** (GPT-4 Vision, Mistral, Tesseract)
- **Automatic descriptions and tags** generation
- **Structured data extraction** for configured folders
- **Cost optimization** with intelligent model selection

### ✅ Field Extraction
- **Folder-based configuration** for custom field definitions
- **AI-powered extraction** using LLM models
- **Automatic processing** for extraction-enabled folders
- **Confidence scoring** and verification flags

## Architecture Components

### 1. Database Layer
- **files table**: Core document records with processing status
- **processing_queue table**: Background job queue with priority
- **folder_field_definitions table**: Custom field configurations
- **extracted_data table**: Structured extraction results
- **file_analysis table**: AI analysis results (OCR, descriptions, tags)

### 2. Backend Services
- **Supabase Edge Functions**: Document processing with AI models
- **Database triggers**: Automatic queue management
- **RLS policies**: Secure multi-tenant access
- **Webhook handlers**: Real-time event processing

### 3. Frontend Components
- **DocumentProcessingOrchestrator**: Central event coordination
- **useDocumentProcessing hooks**: React integration
- **ProcessingQueueDashboard**: Real-time queue monitoring
- **DocumentProcessingStatus**: Individual document status
- **AddDocumentCard**: Enhanced upload with optimistic UI

## Implementation Details

### Document Upload Flow

1. **Upload Initiation**
   ```typescript
   // User drops files or selects them
   const handleUpload = async (files: File[]) => {
     // Initialize optimistic UI states
     setUploadStates(files.map(file => ({
       file,
       status: 'uploading',
       progress: 0
     })));
     
     // Upload files to storage
     const result = await uploadDocumentsAction(formData);
     
     // Update UI with success/error states
     // Start monitoring for real-time updates
   };
   ```

2. **Automatic Queue Processing**
   ```sql
   -- Database trigger automatically adds new files to processing queue
   CREATE TRIGGER trigger_auto_enqueue_document
     AFTER INSERT ON public.files
     FOR EACH ROW
     EXECUTE FUNCTION public.auto_enqueue_document();
   ```

3. **Priority Processing**
   ```typescript
   // Files in extraction-enabled folders get high priority
   if (folderHasExtraction) {
     await supabase.rpc('enqueue_document_processing', {
       p_file_id: document.id,
       p_processing_type: 'full',
       p_priority: 'high'
     });
   }
   ```

### Real-Time Updates

1. **WebSocket Subscriptions**
   ```typescript
   const subscription = supabase
     .channel(`document-${documentId}`)
     .on('postgres_changes', {
       event: 'UPDATE',
       schema: 'public',
       table: 'files',
       filter: `id=eq.${documentId}`
     }, (payload) => {
       handleStatusUpdate(payload);
     })
     .subscribe();
   ```

2. **Event Orchestration**
   ```typescript
   class DocumentProcessingOrchestrator {
     private emit(event: ProcessingEvent) {
       this.listeners.forEach(listener => {
         listener.callback(event);
       });
     }
   }
   ```

### AI Processing Pipeline

1. **OCR Processing**
   ```typescript
   // Enhanced OCR with GPT-4 Vision
   const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${openaiApiKey}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       model: 'gpt-4o-mini',
       messages: [{
         role: 'user',
         content: [
           { type: 'text', text: 'Extract ALL readable text...' },
           { type: 'image_url', image_url: { url: signedUrl } }
         ]
       }]
     })
   });
   ```

2. **Structured Data Extraction**
   ```typescript
   // For folders with extraction enabled
   if (hasExtraction && fieldDefinitions.length > 0) {
     const extractionPrompt = `Extract the following fields from this document:
     ${fieldDefinitions.map(field => 
       `- ${field.field_label} (${field.field_type}): ${field.extraction_pattern}`
     ).join('\\n')}
     
     Document text: ${ocrText}
     Return JSON object with extracted values.`;
     
     const extractedData = await processWithAI(extractionPrompt);
     await saveExtractedData(documentId, extractedData);
   }
   ```

## Usage Examples

### Basic Document Upload with Monitoring

```typescript
import { useDocumentProcessing } from './hooks/use-document-processing';

function DocumentUpload() {
  const { startMonitoring, processingState } = useDocumentProcessing();

  const handleUpload = async (files: File[]) => {
    const result = await uploadDocumentsAction(formData);
    
    // Start monitoring uploaded documents
    result.data.uploaded.forEach(doc => {
      startMonitoring(doc.id);
    });
  };

  return (
    <div>
      <AddDocumentCard onUpload={handleUpload} />
      {Object.entries(processingState).map(([id, state]) => (
        <DocumentProcessingStatus key={id} documentId={id} />
      ))}
    </div>
  );
}
```

### Single Document Processing

```typescript
import { useDocumentProcessingSingle } from './hooks/use-document-processing';

function DocumentCard({ documentId }: { documentId: string }) {
  const { documentState, triggerDocumentProcessing } = useDocumentProcessingSingle(documentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{documentState.fileName}</CardTitle>
        <Badge className={getStatusColor(documentState.status)}>
          {documentState.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <DocumentProcessingStatus documentId={documentId} showDetails={true} />
        <Button onClick={() => triggerDocumentProcessing('full', 'high')}>
          Process with AI
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Batch Processing

```typescript
import { useDocumentProcessingBatch } from './hooks/use-document-processing';

function BatchProcessor({ documentIds }: { documentIds: string[] }) {
  const { batchState, triggerBatchProcessing } = useDocumentProcessingBatch(documentIds);

  const handleBatchProcess = async () => {
    const results = await triggerBatchProcessing('full', 'high');
    console.log('Batch processing results:', results);
  };

  const completedCount = Object.values(batchState)
    .filter(state => state.status === 'completed').length;

  return (
    <div>
      <p>Progress: {completedCount}/{documentIds.length} completed</p>
      <Button onClick={handleBatchProcess}>Process All Documents</Button>
      <ProcessingQueueDashboard />
    </div>
  );
}
```

### Field Extraction Setup

```typescript
// Field extraction is automatically triggered when:
// 1. Document is uploaded to a folder with extract_data = true
// 2. Folder has field definitions configured
// 3. Processing type is 'full' (default for extraction-enabled folders)

const folderWithExtraction = {
  name: 'Invoices',
  extract_data: true,
  field_definitions: [
    {
      field_name: 'invoice_number',
      field_type: 'text',
      extraction_pattern: 'Invoice number or reference',
      is_required: true
    },
    {
      field_name: 'total_amount',
      field_type: 'currency',
      extraction_pattern: 'Total amount or sum',
      is_required: true
    },
    {
      field_name: 'invoice_date',
      field_type: 'date',
      extraction_pattern: 'Date of invoice',
      is_required: true
    }
  ]
};
```

## API Endpoints

### Document Processing
- `POST /functions/v1/process-document-ai` - Process single document
- `POST /functions/v1/process-document-ai` (batch_process: true) - Process multiple documents
- `POST /functions/v1/document-processing-webhook` - Handle database events

### Database Functions
- `enqueue_document_processing(file_id, processing_type, priority)` - Add document to queue
- `get_pending_processing_jobs(batch_size)` - Get next batch of jobs
- `update_processing_job_status(queue_id, status, error_message)` - Update job status

## Configuration

### Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### Processing Settings
```sql
-- Cost optimization settings per organization
INSERT INTO processing_settings (organization_id, setting_key, setting_value) VALUES (
  org_id,
  'ai_processing_config',
  '{
    "default_processing_type": "basic",
    "max_daily_ai_calls": 100,
    "prefer_batch_processing": true,
    "enable_smart_queueing": true,
    "cost_limit_per_month": 50
  }'
);
```

## Performance Optimizations

### Cost Optimization
- **Smart model selection**: GPT-3.5 for basic processing, GPT-4 Vision for complex OCR
- **Batch processing**: Multiple documents per API call
- **Token limits**: 200 tokens for descriptions, 300 for analysis
- **Caching**: OCR results cached to avoid reprocessing

### Database Optimization
- **Indexed queries**: Optimized indexes for queue processing
- **Connection pooling**: Efficient database connections
- **RLS policies**: Secure multi-tenant access
- **Cleanup jobs**: Automatic cleanup of old processing records

### UI Performance
- **Optimistic updates**: Immediate feedback without server round-trips
- **Real-time subscriptions**: WebSocket updates for live status
- **Progressive enhancement**: Graceful fallbacks for offline scenarios
- **Debounced updates**: Prevents excessive re-renders

## Monitoring & Debugging

### Logging
- **Structured logging**: JSON-formatted logs with context
- **Processing metrics**: Timing, success rates, error rates
- **Cost tracking**: API usage and costs per organization
- **Queue monitoring**: Processing queue health and performance

### Error Handling
- **Retry logic**: Exponential backoff for failed jobs
- **Graceful degradation**: Fallback to basic processing if AI fails
- **Error notifications**: User-friendly error messages
- **Recovery mechanisms**: Automatic retry and manual reprocessing

## Security Considerations

### Authentication & Authorization
- **RLS policies**: Row-level security for multi-tenant access
- **Service role**: Secure API access for background processing
- **Signed URLs**: Temporary access for document processing
- **User context**: All operations tied to authenticated users

### Data Protection
- **Encryption**: Data encrypted at rest and in transit
- **Access controls**: Fine-grained permissions per organization
- **Audit logging**: Full audit trail of processing activities
- **Privacy compliance**: GDPR and data protection compliance

## Deployment

### Database Migrations
```sql
-- Run migrations in order
psql -f supabase/migrations/20250713000005_setup_background_processing.sql
```

### Edge Functions
```bash
# Deploy Supabase Edge Functions
supabase functions deploy process-document-ai
supabase functions deploy document-processing-webhook
```

### Cron Jobs
```sql
-- Set up pg_cron for batch processing (requires superuser)
SELECT cron.schedule(
  'process-documents-ai',
  '*/2 * * * *', -- Every 2 minutes
  'SELECT net.http_post(...)'
);
```

## Future Enhancements

### Planned Features
- **Advanced OCR**: PDF text extraction with layout preservation
- **More AI providers**: Integration with Claude, Gemini, etc.
- **Custom models**: Support for fine-tuned models
- **Workflow automation**: Complex processing pipelines
- **Analytics dashboard**: Processing metrics and insights

### Performance Improvements
- **Parallel processing**: Multiple documents processed simultaneously
- **Streaming responses**: Real-time streaming of processing results
- **Edge caching**: Cache frequently accessed documents
- **Predictive queuing**: ML-based queue optimization

## Support

For issues, questions, or contributions:

1. Check the processing queue dashboard for system status
2. Review the logs in Supabase Dashboard
3. Use the built-in error handling and retry mechanisms
4. Consult the usage examples and documentation

## Contributing

1. Follow the existing code patterns and conventions
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure security best practices are followed
5. Test with realistic document processing scenarios

---

This event-driven document processing system provides a robust, scalable foundation for AI-powered document analysis with real-time updates and optimistic UI. The architecture supports high-volume processing while maintaining cost efficiency and user experience quality.
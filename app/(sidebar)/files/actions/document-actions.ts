'use server';

import { createServerSupabaseClient, getUserOrganization } from '@/app/auth/server-utils';
import { authActionClient, orgActionClient, ActionError, revalidateHelpers } from '@/app/auth/safe-action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { 
  validateFile, 
  streamingFileUpload, 
  cleanupFailedUpload,
  withTransaction,
  retryWithBackoff,
  trackProcessingJob,
  updateProcessingJob,
  clearProcessingJob
} from '../lib/upload-utils';
import {
  extractAndAnalyzeDocument,
  analyzeWithMistral,
  extractStructuredFields,
  processDocumentWithAI,
  extractTextWithAI,
  analyzeDocument,
} from '../lib/ai-helpers';
import type { FieldDefinition } from '../schemas/ai-schemas';

// Schemas
const uploadDocumentsSchema = z.object({
  folderId: z.string().nullable().optional(),
});

const reprocessDocumentSchema = z.object({
  documentId: z.string().uuid(),
});

const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  description: z.string().optional(),
});

const updateDocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

const deleteDocumentSchema = z.object({
  id: z.string().uuid(),
});

const deleteFolderSchema = z.object({
  id: z.string().uuid(),
});

const getDocumentUrlSchema = z.object({
  documentId: z.string().uuid(),
});

// Types
interface ProcessingResult {
  ocrText: string;
  description: string;
  tags: string[];
  extractedData?: Record<string, any>;
  confidence: number;
  provider: string;
}


// Main document upload action with improved error handling and transaction safety
export async function uploadDocumentsAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { user, organizationId } = await getUserOrganization(supabase);

  try {
    // Extract files and metadata
    const files = Array.from(formData.values()).filter((v): v is File => v instanceof File);
    const folderId = formData.get('folder_id') as string || null;
    
    if (!files.length) {
      throw new Error('No files provided');
    }

    // Validate all files before processing
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(`File '${file.name}' validation failed: ${validation.error}`);
      }
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      let storagePath: string | null = null;
      let fileRecord: any = null;

      try {
        // 1. Generate storage path
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        storagePath = `${organizationId}/${timestamp}_${sanitizedName}`;

        // 2. Use transaction-like pattern for file upload + DB operations
        fileRecord = await withTransaction(
          async () => {
            // Upload file using streaming to avoid memory issues
            const uploadResult = await streamingFileUpload(file, storagePath!, organizationId);
            if (!uploadResult.success) {
              throw uploadResult.error || new Error('File upload failed');
            }

            // Create file record with 'pending' status
            const { data: dbRecord, error: fileError } = await supabase
              .from('files')
              .insert({
                name: file.name,
                original_name: file.name,
                file_type: file.type,
                file_size: file.size,
                storage_path: storagePath,
                organization_id: organizationId,
                user_id: user.id,
                processing_status: 'pending'
              })
              .select()
              .single();

            if (fileError) throw fileError;

            // Create folder assignment if needed
            if (folderId && dbRecord) {
              const { error: assignError } = await supabase
                .from('file_folder_assignments')
                .insert({
                  file_id: dbRecord.id,
                  folder_id: folderId,
                  user_id: user.id,
                  sort_order: 0,
                });

              if (assignError) {
                console.warn('Failed to assign file to folder:', assignError);
                // Non-critical error, continue processing
              }
            }

            return dbRecord;
          },
          async () => {
            // Rollback: Clean up uploaded file if DB operations fail
            if (storagePath) {
              await cleanupFailedUpload(storagePath);
            }
          }
        );

        // 3. Add to results
        results.push({
          file: fileRecord,
          processing: null
        });

        console.log('[Upload] File uploaded successfully:', {
          id: fileRecord.id,
          name: fileRecord.name,
          size: fileRecord.file_size
        });

        // 4. Trigger background processing with proper error handling
        triggerBackgroundProcessingWithRetry(fileRecord.id)
          .catch(error => {
            console.error('[Processing] Background processing failed:', {
              fileId: fileRecord.id,
              error: error.message,
              stack: error.stack
            });
            // Don't throw - processing failure shouldn't fail the upload
          });

      } catch (error) {
        console.error(`[Upload] Error processing file ${file.name}:`, error);
        
        // Clean up any partial uploads
        if (storagePath && !fileRecord) {
          await cleanupFailedUpload(storagePath);
        }

        errors.push({ 
          file: file.name, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    revalidatePath('/files');
    
    console.log(`[Upload] Batch completed:`, {
      total: files.length,
      success: results.length,
      errors: errors.length
    });
    
    return {
      success: results.length > 0,
      data: {
        uploaded: results,
        errors: errors,
        totalFiles: files.length,
        successCount: results.length,
        errorCount: errors.length,
      }
    };

  } catch (error) {
    console.error('[Upload] Critical error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

// Trigger background processing with retry mechanism
async function triggerBackgroundProcessingWithRetry(documentId: string) {
  const job = trackProcessingJob(documentId);
  
  try {
    console.log('[Processing] Starting background processing:', {
      documentId,
      attempt: job.attempts + 1
    });

    // Update status to processing
    const supabase = await createServerSupabaseClient();
    await supabase
      .from('files')
      .update({ 
        processing_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    // Process with retry logic
    await retryWithBackoff(
      async () => processDocument(documentId),
      {
        maxAttempts: 3,
        initialDelay: 2000,
        maxDelay: 10000,
        backoffMultiplier: 2
      }
    );
    
    // Success - clear job tracking
    clearProcessingJob(documentId);
    console.log('[Processing] Document processed successfully:', documentId);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Update job tracking
    updateProcessingJob(documentId, {
      attempts: job.attempts + 1,
      lastError: errorMessage,
      nextRetryAt: new Date(Date.now() + 60000) // Retry after 1 minute
    });
    
    console.error('[Processing] Document processing failed after retries:', {
      documentId,
      attempts: job.attempts + 1,
      error: errorMessage
    });
    
    // Update status to failed
    const supabase = await createServerSupabaseClient();
    const { error: statusError } = await supabase
      .from('files')
      .update({ 
        processing_status: 'failed',
        updated_at: new Date().toISOString(),
        processing_error: errorMessage // Store error for debugging
      })
      .eq('id', documentId);
    
    if (statusError) {
      console.error('[Processing] Error updating status to failed:', statusError);
    }
    
    throw error; // Re-throw for caller to handle
  }
}

// Legacy function for backward compatibility
async function triggerBackgroundProcessingForDocument(documentId: string) {
  return triggerBackgroundProcessingWithRetry(documentId);
}

// Main document processing function with improved error handling
export async function processDocument(documentId: string): Promise<ProcessingResult> {
  const supabase = await createServerSupabaseClient();
  const { user, organizationId } = await getUserOrganization(supabase);

  console.log(`[Process] Starting processing for document: ${documentId}`);

  // Add timeout for the entire processing operation
  const PROCESSING_TIMEOUT = 120000; // 2 minutes
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Processing timeout exceeded')), PROCESSING_TIMEOUT);
  });

  try {
    return await Promise.race([
      processDocumentInternal(documentId, supabase, user, organizationId),
      timeoutPromise
    ]);
  } catch (error) {
    console.error('[Process] Document processing error:', {
      documentId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Ensure status is updated to failed
    try {
      await supabase
        .from('files')
        .update({ 
          processing_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);
    } catch (updateError) {
      console.error('[Process] Failed to update document status:', updateError);
    }
    
    throw error;
  }
}

// Internal processing function with all the logic
async function processDocumentInternal(
  documentId: string,
  supabase: any,
  user: any,
  organizationId: string
): Promise<ProcessingResult> {
  try {
    // 1. Get document with existing analysis and folder info
    const { data: document, error: docError } = await supabase
      .from('files')
      .select(`
        *,
        file_analysis (
          ocr_text,
          ai_description,
          ai_tags,
          confidence_score,
          analysis_metadata
        ),
        file_folder_assignments (
          folder:folders (
            id,
            name,
            extract_data
          )
        )
      `)
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found or access denied');
    }

    // 2. Check if we already have OCR text
    const existingAnalysis = document.file_analysis?.[0];
    const hasOcrText = existingAnalysis?.ocr_text && existingAnalysis.ocr_text.length > 0;
    
    // 3. Determine if we need field extraction
    const folder = document.file_folder_assignments?.[0]?.folder;
    const needsFieldExtraction = folder?.extract_data === true;

    console.log(`[Process] Document state: hasOCR=${hasOcrText}, needsExtraction=${needsFieldExtraction}`);

    let processingResult: ProcessingResult;

    // 4. Get signed URL for the document
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('organization-files')
      .createSignedUrl(document.storage_path, 3600);

    if (urlError || !signedUrlData?.signedUrl) {
      throw new Error('Failed to generate document URL');
    }

    // 5. Process based on current state
    if (hasOcrText && !needsFieldExtraction) {
      // Case 1: Already has OCR and doesn't need extraction - we're done
      console.log('[Process] Using existing OCR data');
      processingResult = {
        ocrText: existingAnalysis.ocr_text,
        description: existingAnalysis.ai_description || '',
        tags: existingAnalysis.ai_tags || [],
        confidence: existingAnalysis.confidence_score || 0.9,
        provider: 'cached'
      };
    } else if (hasOcrText && needsFieldExtraction) {
      // Case 2: Has OCR but needs field extraction
      console.log('[Process] Extracting fields from existing OCR');
      const fieldDefinitions = await getFieldDefinitions(supabase, folder.id);
      const extractedData = await extractFieldsFromText(
        existingAnalysis.ocr_text,
        fieldDefinitions,
        document.name
      );

      processingResult = {
        ocrText: existingAnalysis.ocr_text,
        description: existingAnalysis.ai_description || '',
        tags: existingAnalysis.ai_tags || [],
        extractedData,
        confidence: 0.85,
        provider: 'field-extraction'
      };
    } else {
      // Case 3: Needs full OCR processing
      console.log('[Process] Performing full OCR processing');
      processingResult = await performOCRWithProviderFallback(
        signedUrlData.signedUrl,
        document.name,
        document.file_type
      );

      // If extraction is needed, do it now
      if (needsFieldExtraction) {
        console.log('[Process] Extracting fields from new OCR');
        const fieldDefinitions = await getFieldDefinitions(supabase, folder.id);
        processingResult.extractedData = await extractFieldsFromText(
          processingResult.ocrText,
          fieldDefinitions,
          document.name
        );
      }
    }

    // 6. Save results
    await saveProcessingResults(
      supabase,
      documentId,
      user.id,
      processingResult,
      folder?.id
    );

    // 7. Update document status
    const { error: statusError } = await supabase
      .from('files')
      .update({ 
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (statusError) {
      console.error('[Process] Error updating status to completed:', statusError);
    } else {
      console.log(`[Process] Successfully updated status to completed for ${document.name}`);
    }

    console.log(`[Process] Completed processing for ${document.name}`);
    return processingResult;

  } catch (error) {
    console.error('[Process] Error:', error);
    throw error; // Status update handled in parent function
  }
}

// Perform OCR with automatic provider fallback and timeout handling
async function performOCRWithProviderFallback(
  documentUrl: string,
  fileName: string,
  fileType: string
): Promise<ProcessingResult> {
  console.log('[OCR] Starting OCR with provider fallback');

  const OCR_TIMEOUT = 30000; // 30 seconds per provider
  
  // Helper to add timeout to promises
  const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, providerName: string): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${providerName} OCR timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
  };

  // Try OpenAI first (best for images)
  if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg')) {
    try {
      console.log('[OCR] Trying OpenAI for image processing');
      return await withTimeout(
        processWithOpenAI(documentUrl, fileName, fileType),
        OCR_TIMEOUT,
        'OpenAI'
      );
    } catch (error) {
      console.error('[OCR] OpenAI failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName
      });
    }
  }

  // Try Mistral (good general purpose)
  try {
    console.log('[OCR] Trying Mistral');
    return await withTimeout(
      processWithMistral(documentUrl, fileName, fileType),
      OCR_TIMEOUT,
      'Mistral'
    );
  } catch (error) {
    console.error('[OCR] Mistral failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      fileName
    });
  }

  // Fallback: Basic extraction
  console.log('[OCR] All providers failed, returning basic result');
  return {
    ocrText: `Unable to extract text from ${fileName}. OCR providers unavailable.`,
    description: `Document: ${fileName}`,
    tags: ['ocr-failed', 'needs-manual-review'],
    confidence: 0.1,
    provider: 'fallback'
  };
}

// URL-based OCR functions (moved from url-ocr-functions.ts)
async function extractTextWithMistralUrl(
  documentUrl: string,
  fileName: string
): Promise<string> {
  const { Mistral } = await import('@mistralai/mistralai');
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

  try {
    let documentPayload: 
      | { type: 'document_url'; documentUrl: string }
      | { type: 'file'; fileId: string };

    if (documentUrl.startsWith('https://')) {
      documentPayload = { type: 'document_url', documentUrl };
    } else {
      const response = await fetch(documentUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      const { id: fileId } = await client.files.upload({
        file: { fileName, content: buffer },
        purpose: "ocr",
      });

      const { url: signedUrl } = await client.files.getSignedUrl({ fileId });
      documentPayload = { type: "document_url", documentUrl: signedUrl };
    }

    const ocrResponse = await client.ocr.process({
      model: 'mistral-ocr-latest',
      document: documentPayload,
      includeImageBase64: false,
    });

    const text = ocrResponse.pages
      .map((page) => page.markdown.trim())
      .join('\n\n')
      .trim();
    
    return text;
  } catch (error) {
    throw new Error(
      `Mistral URL OCR failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

async function extractTextWithOpenAIUrl(
  documentUrl: string,
  fileName: string
): Promise<string> {
  try {
    // Use the new structured extraction
    const result = await extractTextWithAI(documentUrl, fileName);
    return result.extractedText;
  } catch (error) {
    throw new Error(
      `OpenAI URL OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// OpenAI processing with structured output
async function processWithOpenAI(
  documentUrl: string,
  fileName: string,
  fileType: string
): Promise<ProcessingResult> {
  try {
    // Use the new AI helper that handles structured output
    return await processDocumentWithAI(documentUrl, fileName, fileType, 'openai');
  } catch (error) {
    console.error('[Process] OpenAI processing failed:', error);
    throw error;
  }
}

// Mistral processing with structured output
async function processWithMistral(
  documentUrl: string,
  fileName: string,
  fileType: string
): Promise<ProcessingResult> {
  try {
    // First extract text using Mistral OCR
    const ocrText = await extractTextWithMistralUrl(documentUrl, fileName);
    
    // Then analyze with structured output
    const result = await analyzeWithMistral(ocrText, fileName);
    
    // Ensure we have the OCR text in the result
    return {
      ...result,
      ocrText: ocrText, // Use the actual OCR text, not the one from analysis
    };
  } catch (error) {
    console.error('[Process] Mistral processing failed:', error);
    throw error;
  }
}

// Extract fields from text using structured AI output
async function extractFieldsFromText(
  ocrText: string,
  fieldDefinitions: FieldDefinition[],
  fileName: string
): Promise<Record<string, any>> {
  if (!fieldDefinitions.length || !ocrText) {
    return {};
  }

  try {
    // Use the new structured extraction helper
    return await extractStructuredFields(ocrText, fieldDefinitions, fileName);
  } catch (error) {
    console.error('[Extract] Field extraction failed:', error);
    return {};
  }
}

// Get field definitions for a folder
async function getFieldDefinitions(
  supabase: any,
  folderId: string
): Promise<FieldDefinition[]> {
  const { data, error } = await supabase
    .from('folder_field_definitions')
    .select('*')
    .eq('folder_id', folderId)
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('[Fields] Error fetching field definitions:', error);
    return [];
  }

  return data || [];
}

// Save processing results to database
async function saveProcessingResults(
  supabase: any,
  documentId: string,
  userId: string,
  result: ProcessingResult,
  folderId?: string
) {
  // Save or update file analysis
  const analysisData = {
    file_id: documentId,
    user_id: userId,
    ocr_text: result.ocrText,
    ai_description: result.description,
    ai_category: 'document',
    ai_tags: result.tags,
    confidence_score: result.confidence,
    analysis_metadata: {
      provider: result.provider,
      processed_at: new Date().toISOString(),
      has_extracted_data: !!result.extractedData
    }
  };

  const { error: analysisError } = await supabase
    .from('file_analysis')
    .upsert(analysisData, { onConflict: 'file_id' });

  if (analysisError) {
    console.error('[Save] Failed to save analysis:', analysisError);
  }

  // Save extracted data if available
  if (result.extractedData && folderId) {
    // Get field definitions to properly save each field
    const fieldDefs = await getFieldDefinitions(supabase, folderId);
    
    for (const [fieldName, value] of Object.entries(result.extractedData)) {
      const fieldDef = fieldDefs.find(f => f.field_name === fieldName);
      if (!fieldDef) continue;

      const extractedRecord = {
        file_id: documentId,
        folder_id: folderId,
        field_definition_id: fieldDef.id,
        user_id: userId,
        extracted_value: JSON.stringify(value),
        confidence_score: result.confidence,
        is_verified: false,
        extraction_metadata: {
          provider: result.provider,
          field_name: fieldName,
          extracted_at: new Date().toISOString()
        }
      };

      await supabase
        .from('extracted_data')
        .upsert(extractedRecord, {
          onConflict: 'file_id,field_definition_id'
        });
    }
  }
}

// Simple action to reprocess a document
export async function reprocessDocumentAction(formData: FormData) {
  const documentId = formData.get('document_id') as string;
  
  if (!documentId) {
    return { success: false, error: 'Document ID required' };
  }

  try {
    // Clear existing analysis to force reprocessing
    const supabase = await createServerSupabaseClient();
    await supabase
      .from('file_analysis')
      .delete()
      .eq('file_id', documentId);

    const result = await processDocument(documentId);
    
    revalidatePath('/files');
    
    return {
      success: true,
      message: 'Document reprocessed successfully',
      result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Reprocessing failed'
    };
  }
}

// Get all documents with their analysis
export async function getOrganizationDocumentsWithFolders() {
  const supabase = await createServerSupabaseClient();
  const { organizationId } = await getUserOrganization(supabase);

  const { data: documents, error } = await supabase
    .from('files')
    .select(`
      *,
      file_folder_assignments (
        folder:folders (
          id,
          name,
          color,
          icon,
          extract_data
        )
      ),
      file_analysis (
        ocr_text,
        ai_description,
        ai_category,
        ai_tags,
        confidence_score,
        analysis_metadata
      ),
      extracted_data (
        extracted_value,
        confidence_score,
        field_definition:folder_field_definitions (
          field_name,
          field_label
        )
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return { documents: [], error: error.message };
  }

  // Transform data for frontend
  const transformedDocs = documents?.map(doc => {
    const folder = doc.file_folder_assignments?.[0]?.folder;
    const analysis = doc.file_analysis?.[0];
    
    // Combine extracted data into single object
    const extractedData: Record<string, any> = {};
    doc.extracted_data?.forEach((item: any) => {
      if (item.field_definition?.field_name) {
        try {
          extractedData[item.field_definition.field_name] = JSON.parse(item.extracted_value);
        } catch {
          extractedData[item.field_definition.field_name] = item.extracted_value;
        }
      }
    });

    return {
      ...doc,
      folder_id: folder?.id || null,
      folder_name: folder?.name || null,
      folder_color: folder?.color || null,
      folder_icon: folder?.icon || null,
      ocr_content: analysis?.ocr_text || null,
      description: analysis?.ai_description || null,
      tags: analysis?.ai_tags || [],
      extracted_data: Object.keys(extractedData).length > 0 ? extractedData : null,
      processing_metadata: analysis?.analysis_metadata || null,
    };
  }) || [];

  return { documents: transformedDocs, error: null };
}

// Other basic CRUD operations remain the same
export async function createFolderAction(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { user, organizationId } = await getUserOrganization(supabase);

  const folderData = {
    organization_id: organizationId,
    name: formData.get('name') as string,
    description: formData.get('description') as string || undefined,
    parent_id: formData.get('parent_id') as string || undefined,
    color: formData.get('color') as string || undefined,
    icon: formData.get('icon') as string || undefined,
    user_id: user.id,
  };

  const { data: folder, error } = await supabase
    .from('folders')
    .insert(folderData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create folder: ${error.message}`);
  }

  revalidatePath('/files');
  return { success: true, folder };
}

export const updateDocumentAction = orgActionClient
  .schema(updateDocumentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const updates: any = {};
    
    if (parsedInput.name) updates.name = parsedInput.name;
    
    if (parsedInput.description) {
      await ctx.supabase
        .from('file_analysis')
        .update({ ai_description: parsedInput.description })
        .eq('file_id', parsedInput.id);
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await ctx.supabase
        .from('files')
        .update(updates)
        .eq('id', parsedInput.id)
        .eq('organization_id', ctx.organizationId);

      if (error) {
        throw new ActionError('Failed to update document', 'UPDATE_ERROR');
      }
    }

    revalidateHelpers.files();
    return { success: true };
  });

export const deleteDocumentAction = orgActionClient
  .schema(deleteDocumentSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Get file details
    const { data: file } = await ctx.supabase
      .from('files')
      .select('storage_path')
      .eq('id', parsedInput.id)
      .eq('organization_id', ctx.organizationId)
      .single();

    if (file?.storage_path) {
      await ctx.supabase.storage
        .from('organization-files')
        .remove([file.storage_path]);
    }

    // Delete all related records
    await ctx.supabase.from('file_folder_assignments').delete().eq('file_id', parsedInput.id);
    await ctx.supabase.from('file_analysis').delete().eq('file_id', parsedInput.id);
    await ctx.supabase.from('extracted_data').delete().eq('file_id', parsedInput.id);
    
    const { error } = await ctx.supabase.from('files').delete().eq('id', parsedInput.id);
    
    if (error) {
      throw new ActionError('Failed to delete document', 'DELETE_ERROR');
    }

    revalidateHelpers.files();
    return { success: true };
  });

export const deleteFolderAction = orgActionClient
  .schema(deleteFolderSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Remove file assignments
    await ctx.supabase.from('file_folder_assignments').delete().eq('folder_id', parsedInput.id);
    
    // Delete folder
    const { error } = await ctx.supabase
      .from('folders')
      .delete()
      .eq('id', parsedInput.id)
      .eq('organization_id', ctx.organizationId);

    if (error) {
      throw new ActionError('Failed to delete folder', 'DELETE_ERROR');
    }

    revalidateHelpers.files();
    return { success: true };
  });

export async function getOrganizationFolders() {
  const supabase = await createServerSupabaseClient();
  const { organizationId } = await getUserOrganization(supabase);

  const { data: folders, error } = await supabase
    .from('folders')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return { folders: folders || [], error };
}

// Get document download URL
export async function getDocumentDownloadUrl(documentId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user, organizationId } = await getUserOrganization(supabase);

    // Get file from organization files table
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single();

    if (fileError || !file) {
      throw new Error('Document not found or access denied');
    }

    // Generate signed URL for organization file
    if (file.storage_path) {
      const { data, error } = await supabase.storage
        .from('organization-files')
        .createSignedUrl(file.storage_path, 3600);

      if (error) {
        // File exists in database but not in storage
        return { 
          url: null, 
          document: file, 
          error: 'FILE_MISSING_FROM_STORAGE',
          message: 'File record exists but the actual file is missing from storage. This may be due to a migration or storage cleanup.'
        };
      }

      if (data?.signedUrl) {
        return { url: data.signedUrl, document: file };
      } else {
        throw new Error('Failed to generate signed URL for organization file');
      }
    } else {
      throw new Error('File storage path not found');
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to get download URL');
  }
}
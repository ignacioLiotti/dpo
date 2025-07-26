'use server';

import { createServerSupabaseClient, getUserOrganization } from '@/app/auth/server-utils';
import { authActionClient, orgActionClient, ActionError, revalidateHelpers } from '@/app/auth/safe-action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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

interface FieldDefinition {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  extraction_pattern?: string;
  is_required: boolean;
}


// Main document upload action with immediate processing
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

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        // 1. Upload file to storage
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${organizationId}/${timestamp}_${sanitizedName}`;
        
        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from('organization-files')
          .upload(storagePath, new Uint8Array(arrayBuffer), {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // 2. Create file record with 'pending' status for optimistic UI
        const { data: fileRecord, error: fileError } = await supabase
          .from('files')
          .insert({
            name: file.name,
            original_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: storagePath,
            organization_id: organizationId,
            user_id: user.id,
            processing_status: 'pending' // Start as pending instead of processing
          })
          .select()
          .single();

        if (fileError) {
          await supabase.storage.from('organization-files').remove([storagePath]);
          throw fileError;
        }

        // 3. Create folder assignment if needed
        if (folderId && fileRecord) {
          await supabase
            .from('file_folder_assignments')
            .insert({
              file_id: fileRecord.id,
              folder_id: folderId,
              user_id: user.id,
              sort_order: 0,
            });
        }

        // 4. Add to results immediately (optimistic response)
        results.push({
          file: fileRecord,
          processing: null // No processing result yet
        });

        console.log('[Processing] File uploaded and results added:', fileRecord.id);

        // 5. Trigger background processing
        // This happens asynchronously - we don't wait for it
        triggerBackgroundProcessingForDocument(fileRecord.id).catch(error => {
          console.error(`Background processing failed for ${fileRecord.id}:`, error);
        });

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        errors.push({ 
          file: file.name, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    revalidatePath('/files');
    
    console.log(`Upload completed: ${results.length} success, ${errors.length} errors`);
    
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
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

// Trigger background processing for a single document
async function triggerBackgroundProcessingForDocument(documentId: string) {
  try {
    // Update status to processing
    const supabase = await createServerSupabaseClient();
    await supabase
      .from('files')
      .update({ 
        processing_status: 'processing'
      })
      .eq('id', documentId);

    // Process the document
    await processDocument(documentId);
    
    // The processDocument function already updates the status to 'completed'
    // No need to update it again here
    
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    
    // Update status to failed
    const supabase = await createServerSupabaseClient();
    const { error: statusError } = await supabase
      .from('files')
      .update({ 
        processing_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
    
    if (statusError) {
      console.error('[Process] Error updating status to failed:', statusError);
    } else {
      console.log(`[Process] Successfully updated status to failed for ${documentId}`);
    }
  }
}

// Main document processing function with smart provider switching
export async function processDocument(documentId: string): Promise<ProcessingResult> {
  const supabase = await createServerSupabaseClient();
  const { user, organizationId } = await getUserOrganization(supabase);

  console.log(`[Process] Starting processing for document: ${documentId}`);

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
      throw new Error('Document not found');
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
    
    // Update status to failed
    await supabase
      .from('files')
      .update({ 
        processing_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    throw error;
  }
}

// Perform OCR with automatic provider fallback
async function performOCRWithProviderFallback(
  documentUrl: string,
  fileName: string,
  fileType: string
): Promise<ProcessingResult> {
  console.log('[OCR] Starting OCR with provider fallback');

  // Try OpenAI first (best for images)
  if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg')) {
    try {
      console.log('[OCR] Trying OpenAI for image processing');
      return await processWithOpenAI(documentUrl, fileName, fileType);
    } catch (error) {
      console.error('[OCR] OpenAI failed:', error);
    }
  }

  // Try Mistral (good general purpose)
  try {
    console.log('[OCR] Trying Mistral');
    return await processWithMistral(documentUrl, fileName, fileType);
  } catch (error) {
    console.error('[OCR] Mistral failed:', error);
  }

  // Fallback: Basic extraction
  console.log('[OCR] All providers failed, using basic extraction');
  throw new Error('All OCR providers failed');
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
    const { openai } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image. Return only the text content, preserving structure and formatting. Focus on readable text, numbers, and important details.'
            },
            {
              type: 'image',
              image: documentUrl
            }
          ]
        }
      ],
      temperature: 0.1
    });

    return text.trim();
  } catch (error) {
    throw new Error(
      `OpenAI URL OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// OpenAI processing (real implementation)
async function processWithOpenAI(
  documentUrl: string,
  fileName: string,
  fileType: string
): Promise<ProcessingResult> {
  const { openai } = await import('@ai-sdk/openai');
  const { generateText } = await import('ai');

  // Download and convert to base64
  const response = await fetch(documentUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const base64 = buffer.toString('base64');
  
  // Determine MIME type
  let mimeType = fileType || 'image/png';
  if (fileType === 'application/octet-stream') {
    const ext = fileName.toLowerCase().split('.').pop();
    mimeType = ext === 'pdf' ? 'application/pdf' : `image/${ext}`;
  }

  // Skip PDFs as OpenAI can't process them
  if (mimeType === 'application/pdf') {
    throw new Error('OpenAI cannot process PDF files directly');
  }

  const dataUrl = `data:${mimeType};base64,${base64}`;

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract and analyze this document:
1. Extract ALL text content exactly as it appears
2. Generate a search-optimized description (focus on keywords someone might search for)
3. Generate search tags (lowercase, relevant terms)

Format your response EXACTLY as:
===OCR_TEXT===
[all extracted text]
===DESCRIPTION===
[search-optimized description]
===TAGS===
[tag1, tag2, tag3, ...]`
          },
          {
            type: 'image',
            image: dataUrl
          }
        ]
      }
    ],
    temperature: 0.1
  });

  // Parse response
  const ocrMatch = text.match(/===OCR_TEXT===\n([\s\S]*?)(?=\n===DESCRIPTION===|$)/);
  const descMatch = text.match(/===DESCRIPTION===\n([\s\S]*?)(?=\n===TAGS===|$)/);
  const tagsMatch = text.match(/===TAGS===\n([\s\S]*?)$/);

  const ocrText = ocrMatch?.[1]?.trim() || text;
  const description = descMatch?.[1]?.trim() || `Document analysis of ${fileName}`;
  const tagsText = tagsMatch?.[1]?.trim() || '';
  const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean);

  return {
    ocrText,
    description,
    tags: tags.length > 0 ? tags : ['document', 'openai-processed'],
    confidence: 0.9,
    provider: 'openai-gpt4-vision'
  };
}

// Mistral processing (real implementation)
async function processWithMistral(
  documentUrl: string,
  fileName: string,
  fileType: string
): Promise<ProcessingResult> {
  // Use Mistral's OCR capability directly
  const ocrText = await extractTextWithMistralUrl(documentUrl, fileName);
  const { mistral } = await import('@ai-sdk/mistral');
  const { generateText } = await import('ai');

  // Generate description and tags
  const { text } = await generateText({
    model: mistral("mistral-small-latest"),
    messages: [
      {
        role: "user",
        content: `Given this document text, generate:
1. A search-optimized description (what would someone search to find this?)
2. Relevant search tags (lowercase, specific terms)

Text: ${ocrText.substring(0, 3000)}...

Format response as:
DESCRIPTION: [description]
TAGS: [tag1, tag2, tag3, ...]`,
      },
    ],
    temperature: 0.1,
  });

  // Parse response
  const descMatch = text.match(/DESCRIPTION:\s*(.+?)(?=\nTAGS:|$)/s);
  const tagsMatch = text.match(/TAGS:\s*(.+)$/s);

  const description = descMatch?.[1]?.trim() || `Document: ${fileName}`;
  const tagsText = tagsMatch?.[1]?.trim() || '';
  const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean);

  return {
    ocrText,
    description,
    tags: tags.length > 0 ? tags : ['document', 'mistral-processed'],
    confidence: 0.85,
    provider: 'mistral-large'
  };
}

// Extract fields from text using AI
async function extractFieldsFromText(
  ocrText: string,
  fieldDefinitions: FieldDefinition[],
  fileName: string
): Promise<Record<string, any>> {
  if (!fieldDefinitions.length || !ocrText) {
    return {};
  }

  const { openai } = await import('@ai-sdk/openai');
  const { generateText } = await import('ai');

  // Build field extraction prompt
  const fieldPrompt = fieldDefinitions.map(field => 
    `- ${field.field_label} (${field.field_name}): type=${field.field_type}, required=${field.is_required}`
  ).join('\n');

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [
      {
        role: 'user',
        content: `Extract the following fields from this document text.
Return ONLY a JSON object with the field names as keys.

Fields to extract:
${fieldPrompt}

Document text:
${ocrText.substring(0, 4000)}

Return JSON only, no explanation:`
      }
    ],
    temperature: 0.1
  });

  try {
    // Clean and parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch (error) {
    console.error('[Extract] Failed to parse extraction result:', error);
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
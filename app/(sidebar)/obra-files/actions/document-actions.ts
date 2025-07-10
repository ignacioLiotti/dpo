'use server';

import { createClient } from '@/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
// Import document processor for structured data extraction
import { processDocument } from '../services/document-processor';

// Import types from our local schema
import type { ObraDocument, Folder } from '../types';

// Schemas for validation
const uploadDocumentsSchema = z.object({
  obra_id: z.string().uuid(),
  files: z.array(z.any()),
  category: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder_id: z.string().uuid().optional(),
});

const createFolderSchema = z.object({
  obra_id: z.string().uuid(),
  name: z.string().min(1, 'Folder name is required'),
  description: z.string().optional(),
  parent_id: z.string().uuid().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const updateDocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder_id: z.string().uuid().optional(),
});

const deleteDocumentSchema = z.object({
  id: z.string().uuid(),
});

const deleteFolderSchema = z.object({
  id: z.string().uuid(),
});

// Get all documents for an obra with folder information
export async function getObraDocumentsWithFolders(obraId: string) {
  try {
    const supabase = await createClient();
    
    // Fetch documents with folder info and extracted data
    const { data: documents, error } = await supabase
      .from('obra_documents')
      .select(`
        *,
        folder_documents (
          folder_id,
          folder:folder_id (
            id,
            name,
            color,
            icon,
            extract_data
          )
        ),
        document_extracted_data (
          extracted_data,
          extraction_confidence,
          field_count,
          extraction_metadata
        )
      `)
      .eq('obra_id', obraId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return { documents: [], error: error.message };
    }

    // Transform the data to flatten the structure
    const flatDocuments = documents?.map(doc => {
      const folderData = doc.folder_documents?.[0]?.folder;
      const extractedData = doc.document_extracted_data?.[0];
      
      const flatDoc = {
        ...doc,
        folder_id: folderData?.id || null,
        folder_name: folderData?.name || null,
        folder_color: folderData?.color || null,
        folder_icon: folderData?.icon || null,
        folder_extract_data: folderData?.extract_data || false,
        extracted_data: extractedData?.extracted_data || null,
        extraction_confidence: extractedData?.extraction_confidence || null,
        field_count: extractedData?.field_count || null,
        extraction_metadata: extractedData?.extraction_metadata || null,
        // Remove the nested objects
        folder_documents: undefined,
        document_extracted_data: undefined
      };
      
      // Debug logging for documents with extracted data
      if (extractedData?.extracted_data) {
        console.log(`[DEBUG] Document ${doc.name} has extracted data:`, extractedData.extracted_data);
      }
      
      return flatDoc;
    }) || [];

    return { documents: flatDocuments, error: null };
  } catch (error) {
    console.error('Error in getObraDocumentsWithFolders:', error);
    return { documents: [], error: 'Failed to fetch documents' };
  }
}

// Get all folders for an obra
export async function getObraFolders(obraId: string) {
  try {
    const supabase = await createClient();
    
    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .eq('obra_id', obraId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching folders:', error);
      return { folders: [], error: error.message };
    }

    return { folders: folders || [], error: null };
  } catch (error) {
    console.error('Error in getObraFolders:', error);
    return { folders: [], error: 'Failed to fetch folders' };
  }
}

// Upload documents action
export async function uploadDocumentsAction(formData: FormData) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Extract form data
    const obraId = formData.get('obra_id') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const folderId = formData.get('folder_id') as string;
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    // Get files from formData
    const files: File[] = [];
    const entries = Array.from(formData.entries());
    
    for (const [key, value] of entries) {
      if (key.startsWith('file_') && value instanceof File && value.size > 0) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      throw new Error('No files provided');
    }

    // Validate input
    const validatedData = uploadDocumentsSchema.parse({
      obra_id: obraId,
      files,
      category: category || undefined,
      description: description || undefined,
      tags: tags.length > 0 ? tags : undefined,
      folder_id: folderId || undefined,
    });

    const uploadedDocuments = [];
    const uploadWarnings: string[] = [];

    // Process each file (upload only, no AI processing)
    for (const file of files) {
      console.log(`[UploadAction] Processing file upload: ${file.name} (${file.size} bytes)`);
      
      // Use basic metadata for upload (no AI processing)
      const basicDescription = description || `Documento subido: ${file.name}`;
      const basicTags = tags.length > 0 ? tags : [];
      
      // Basic file validation
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        uploadWarnings.push(`${file.name}: Archivo muy grande (máximo 10MB)`);
        continue;
      }
      
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/tiff',
        'image/bmp'
      ];
      
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        uploadWarnings.push(`${file.name}: Tipo de archivo no soportado (${file.type})`);
        continue;
      }

      // Step 2: Generate unique filename and upload to storage
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}-${file.name}`;
      const storagePath = `${obraId}/${fileName}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('obra-vault')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        console.error('Storage upload error:', storageError);
        throw new Error(`Failed to upload ${file.name}: ${storageError.message}`);
      }

      // Step 3: Insert document record (without AI processing data)
      const { data: document, error: documentError } = await supabase
        .from('obra_documents')
        .insert({
          obra_id: obraId,
          user_id: user.id,
          name: file.name,
          type: file.type,
          size: file.size,
          path: [obraId, fileName],
          description: basicDescription,
          category: category || null,
          tags: basicTags.length > 0 ? basicTags : null,
          folder: 'Sin Clasificar',
          ocr_content: null,
          is_public: false,
          version: 1,
          processing_status: 'pending',
        })
        .select()
        .single();

      if (documentError) {
        console.error('Document insert error:', documentError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('obra-vault').remove([storagePath]);
        throw new Error(`Failed to save document ${file.name}: ${documentError.message}`);
      }

      // Step 4: Link to folder if specified and check for auto-processing
      let shouldAutoProcess = false;
      if (folderId) {
        // Link to folder
        const { error: linkError } = await supabase
          .from('folder_documents')
          .insert({
            folder_id: folderId,
            document_id: document.id,
          });

        if (linkError) {
          console.error('Error linking document to folder:', linkError);
          uploadWarnings.push(`${file.name}: No se pudo vincular a la carpeta`);
        } else {
          // Check if folder has extraction enabled
          const { data: folder } = await supabase
            .from('folders')
            .select('extraction_enabled')
            .eq('id', folderId)
            .single();
          
          if (folder?.extraction_enabled) {
            shouldAutoProcess = true;
          }
        }
      }

      uploadedDocuments.push({ ...document, shouldAutoProcess });
      console.log(`[UploadAction] Successfully uploaded: ${file.name} → ${document.id}${shouldAutoProcess ? ' (will auto-process)' : ''}`);
    }

    // Step 5: Auto-process documents in folders with extraction enabled
    const documentsToProcess = uploadedDocuments.filter((doc: any) => doc.shouldAutoProcess);
    let processedCount = 0;

    if (documentsToProcess.length > 0) {
      console.log(`[UploadAction] Auto-processing ${documentsToProcess.length} documents...`);
      
      for (const doc of documentsToProcess) {
        try {
          // Generate signed URL for the document
          const storagePath = doc.path.join('/');
          const { data: signedUrlData, error: urlError } = await supabase.storage
            .from('obra-vault')
            .createSignedUrl(storagePath, 3600);

          if (urlError || !signedUrlData) {
            console.error(`[UploadAction] Failed to generate URL for ${doc.name}:`, urlError);
            continue;
          }

          // Process with document processor
          const { processDocument } = await import('../services/document-processor');
          
          // Get folder field definitions for extraction
          const { data: folderData } = await supabase
            .from('folders')
            .select(`
              *,
              folder_field_definitions(*)
            `)
            .eq('id', folderId)
            .single();

          const fieldDefinitions = folderData?.folder_field_definitions || [];
          const hasFieldDefinitions = fieldDefinitions.length > 0;

          const result = await processDocument(
            signedUrlData.signedUrl,
            doc.name,
            doc.type,
            hasFieldDefinitions,
            fieldDefinitions
          );

          // Update document with processing results
          const { error: updateError } = await supabase
            .from('obra_documents')
            .update({
              ocr_content: result.ocrText,
              description: result.aiDescription,
              tags: result.aiTags,
              processing_status: 'completed',
              processing_metadata: {
                provider: result.metadata.ocrProvider,
                processed_at: new Date().toISOString(),
                confidence: result.confidence
              }
            })
            .eq('id', doc.id);

          if (updateError) {
            console.error(`[UploadAction] Failed to update document ${doc.name}:`, updateError);
          } else {
            // Save extracted data if any
            if (result.extractedData && Object.keys(result.extractedData).length > 0) {
              const { error: extractedDataError } = await supabase
                .from('document_extracted_data')
                .insert({
                  document_id: doc.id,
                  extracted_data: result.extractedData,
                  confidence: result.confidence,
                  extraction_method: 'automatic',
                  field_count: Object.keys(result.extractedData).length
                });

              if (extractedDataError) {
                console.error(`[UploadAction] Failed to save extracted data for ${doc.name}:`, extractedDataError);
              }
            }

            processedCount++;
            console.log(`[UploadAction] Successfully auto-processed: ${doc.name}`);
          }
        } catch (processError) {
          console.error(`[UploadAction] Auto-processing failed for ${doc.name}:`, processError);
          
          // Update status to failed
          await supabase
            .from('obra_documents')
            .update({ 
              processing_status: 'failed',
              processing_metadata: {
                error: processError instanceof Error ? processError.message : 'Unknown error',
                failed_at: new Date().toISOString()
              }
            })
            .eq('id', doc.id);
        }
      }
    }

    // Revalidate relevant paths
    revalidatePath(`/obras/${obraId}`);
    revalidatePath(`/obra-files`);

    // Create appropriate success message
    let message = `${uploadedDocuments.length} archivo(s) subido(s) exitosamente.`;
    if (processedCount > 0) {
      message += ` ${processedCount} archivo(s) procesado(s) automáticamente con IA.`;
    }
    if (documentsToProcess.length > processedCount) {
      const failedCount = documentsToProcess.length - processedCount;
      uploadWarnings.push(`${failedCount} archivo(s) no se pudieron procesar automáticamente.`);
    }

    return { 
      success: true, 
      documents: uploadedDocuments.map((doc: any) => {
        const { shouldAutoProcess, ...cleanDoc } = doc;
        return cleanDoc;
      }),
      warnings: uploadWarnings.length > 0 ? uploadWarnings : undefined,
      message
    };
  } catch (error) {
    console.error('Upload documents error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload documents');
  }
}

// Create folder action
export async function createFolderAction(formData: FormData) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Extract and validate form data
    const rawData = {
      obra_id: formData.get('obra_id') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      parent_id: formData.get('parent_id') as string || undefined,
      color: formData.get('color') as string || undefined,
      icon: formData.get('icon') as string || undefined,
    };

    const validatedData = createFolderSchema.parse(rawData);

    // Insert folder
    const { data: folder, error } = await supabase
      .from('folders')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating folder:', error);
      throw new Error(`Failed to create folder: ${error.message}`);
    }

    // Revalidate paths
    revalidatePath(`/obras/${validatedData.obra_id}`);
    revalidatePath(`/obra-files`);

    return { success: true, folder };
  } catch (error) {
    console.error('Create folder error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create folder');
  }
}

// Delete folder action
export async function deleteFolderAction(formData: FormData) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Extract and validate form data
    const rawData = {
      id: formData.get('id') as string,
    };

    const validatedData = deleteFolderSchema.parse(rawData);

    // Get folder details first to ensure ownership and get obra_id
    const { data: folder, error: fetchError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', validatedData.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !folder) {
      throw new Error('Folder not found or access denied');
    }

    // Check if folder has documents linked to it
    const { data: folderDocuments, error: documentsError } = await supabase
      .from('folder_documents')
      .select('document_id')
      .eq('folder_id', validatedData.id);

    if (documentsError) {
      console.error('Error checking folder documents:', documentsError);
      throw new Error('Failed to check folder contents');
    }

    // If folder has documents, unlink them (don't delete the documents, just remove from folder)
    if (folderDocuments && folderDocuments.length > 0) {
      const { error: unlinkError } = await supabase
        .from('folder_documents')
        .delete()
        .eq('folder_id', validatedData.id);

      if (unlinkError) {
        console.error('Error unlinking documents from folder:', unlinkError);
        throw new Error('Failed to unlink documents from folder');
      }
    }

    // Delete folder field definitions
    const { error: fieldDefinitionsError } = await supabase
      .from('folder_field_definitions')
      .delete()
      .eq('folder_id', validatedData.id);

    if (fieldDefinitionsError) {
      console.error('Error deleting folder field definitions:', fieldDefinitionsError);
      // Don't fail the operation, just log the error
    }

    // Delete extracted data associated with this folder
    const { error: extractedDataError } = await supabase
      .from('document_extracted_data')
      .delete()
      .eq('folder_id', validatedData.id);

    if (extractedDataError) {
      console.error('Error deleting extracted data:', extractedDataError);
      // Don't fail the operation, just log the error
    }

    // Finally, delete the folder
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', validatedData.id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting folder:', deleteError);
      throw new Error(`Failed to delete folder: ${deleteError.message}`);
    }

    // Revalidate paths
    revalidatePath(`/obras/${folder.obra_id}`);
    revalidatePath(`/obra-files`);

    return { success: true };
  } catch (error) {
    console.error('Delete folder error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete folder');
  }
}

// Update document action
export async function updateDocumentAction(formData: FormData) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Extract and validate form data
    const rawData = {
      id: formData.get('id') as string,
      name: formData.get('name') as string || undefined,
      description: formData.get('description') as string || undefined,
      category: formData.get('category') as string || undefined,
      folder_id: formData.get('folder_id') as string || undefined,
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
    };

    const validatedData = updateDocumentSchema.parse(rawData);

    // Update document (without folder_id)
    const { data: document, error } = await supabase
      .from('obra_documents')
      .update({
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        tags: validatedData.tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.id)
      .eq('user_id', user.id) // Ensure user owns the document
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      throw new Error(`Failed to update document: ${error.message}`);
    }

    // Handle folder relationship separately if folder_id is provided
    if (validatedData.folder_id !== undefined) {
      // First remove existing folder relationships
      await supabase
        .from('folder_documents')
        .delete()
        .eq('document_id', validatedData.id);

      // Add new folder relationship if folder_id is provided
      if (validatedData.folder_id) {
        const { error: linkError } = await supabase
          .from('folder_documents')
          .insert({
            folder_id: validatedData.folder_id,
            document_id: validatedData.id,
          });

        if (linkError) {
          console.error('Error updating folder relationship:', linkError);
          // Don't fail the update, just warn
        }
      }
    }

    // Get obra_id for revalidation
    const obraId = document.obra_id;
    revalidatePath(`/obras/${obraId}`);
    revalidatePath(`/obra-files`);

    return { success: true, document };
  } catch (error) {
    console.error('Update document error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update document');
  }
}

// Delete document action
export async function deleteDocumentAction(formData: FormData) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Extract and validate form data
    const rawData = {
      id: formData.get('id') as string,
    };

    const validatedData = deleteDocumentSchema.parse(rawData);

    // Get document details first
    const { data: document, error: fetchError } = await supabase
      .from('obra_documents')
      .select('*')
      .eq('id', validatedData.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !document) {
      throw new Error('Document not found or access denied');
    }

    // Delete from storage
    if (document.path && document.path.length > 0) {
      const storagePath = document.path.join('/');
      const { error: storageError } = await supabase.storage
        .from('obra-vault')
        .remove([storagePath]);

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
        // Continue with database deletion even if storage fails
      }
    }

    // Delete folder relationships first
    await supabase
      .from('folder_documents')
      .delete()
      .eq('document_id', validatedData.id);

    // Delete extracted data
    await supabase
      .from('document_extracted_data')
      .delete()
      .eq('document_id', validatedData.id);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('obra_documents')
      .delete()
      .eq('id', validatedData.id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      throw new Error(`Failed to delete document: ${deleteError.message}`);
    }

    // Revalidate paths
    revalidatePath(`/obras/${document.obra_id}`);
    revalidatePath(`/obra-files`);

    return { success: true };
  } catch (error) {
    console.error('Delete document error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete document');
  }
}

// Get document extracted data
export async function getDocumentExtractedData(documentId: string) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get document with extracted data
    const { data: document, error: docError } = await supabase
      .from('obra_documents')
      .select(`
        *,
        extracted_data:document_extracted_data(*)
      `)
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      throw new Error('Document not found or access denied');
    }

    return {
      document,
      extractedData: document.extracted_data?.[0] || null,
      ocrContent: document.ocr_content || null
    };
  } catch (error) {
    console.error('Get extracted data error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get extracted data');
  }
}

// Simple GPT processing action
export async function processWithGPTAction(formData: FormData) {
  const documentId = formData.get('document_id') as string;
  return await processWithProvider(documentId, 'gpt', 'OpenAI GPT-4o-mini');
}

// Simple Mistral processing action
export async function processWithMistralAction(formData: FormData) {
  const documentId = formData.get('document_id') as string;
  return await processWithProvider(documentId, 'mistral', 'Mistral Small');
}

// Simple OCR-only action
export async function processWithOCROnlyAction(formData: FormData) {
  const documentId = formData.get('document_id') as string;
  return await processWithProvider(documentId, 'ocr-only', 'Basic OCR');
}

// Base processing function
async function processWithProvider(documentId: string, provider: string, providerName: string) {
  try {
    console.log(`[${provider}] Starting processing for document: ${documentId}`);
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, message: 'User not authenticated' };
    }

    if (!documentId) {
      return { success: false, message: 'Document ID is required' };
    }

    // Get document details first
    const { data: document, error: docError } = await supabase
      .from('obra_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      console.error(`[${provider}] Document query error:`, docError);
      return { success: false, message: 'Document not found or access denied' };
    }

    // Get folder information through folder_documents junction table
    let folderInfo = null;
    const { data: folderLink, error: folderError } = await supabase
      .from('folder_documents')
      .select(`
        folder_id,
        folder:folder_id (
          id,
          name,
          extract_data
        )
      `)
      .eq('document_id', documentId)
      .single();

    if (!folderError && folderLink?.folder) {
      folderInfo = folderLink.folder;
      console.log(`[${provider}] Document is in folder: ${folderInfo.name} (extract_data: ${folderInfo.extract_data})`);
    } else {
      console.log(`[${provider}] Document is not in any folder or folder lookup failed:`, folderError);
    }

    // Update status to processing
    await supabase
      .from('obra_documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Generate signed URL for the document
    const storagePath = document.path.join('/');
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('obra-vault')
      .createSignedUrl(storagePath, 3600);

    if (urlError || !signedUrlData) {
      return { success: false, message: `Failed to generate document URL: ${urlError?.message}` };
    }

    // Check if we need structured data extraction
    const shouldExtractStructuredData = folderInfo && folderInfo.extract_data;

    let fieldDefinitions: any[] = [];

    if (shouldExtractStructuredData && folderInfo) {
      console.log(`[${provider}] Document is in folder with extraction enabled, fetching field definitions...`);
      const { data: fields, error: fieldsError } = await supabase
        .from('folder_field_definitions')
        .select('*')
        .eq('folder_id', folderInfo.id)
        .order('sort_order');
      
      if (fieldsError) {
        console.error(`[${provider}] Error fetching field definitions:`, fieldsError);
      }
      
      const allFields = fields || [];
      fieldDefinitions = allFields.filter(f => f.is_active !== false); // Include undefined is_active as true
      
      console.log(`[${provider}] Found ${allFields.length} total field definitions for folder ${folderInfo.name}`);
      console.log(`[${provider}] Found ${allFields} total field definitions for folder ${folderInfo.name}`);
      console.log(`[${provider}] Found ${fieldDefinitions.length} active field definitions`);
      console.log(`[${provider}] All fields:`, allFields.map(f => ({
        name: f.field_name,
        active: f.is_active,
        type: f.field_type,
        extraction_method: f.extraction_method,
        extraction_pattern: f.extraction_pattern,
        validation_pattern: f.validation_pattern,
        is_required: f.is_required,
        default_value: f.default_value,
        sort_order: f.sort_order
      })));
      
      if (fieldDefinitions.length === 0) {
        console.log(`[${provider}] No active field definitions found - will fall back to simple processing`);
      } else {
        console.log(`[${provider}] Active field definitions:`, fieldDefinitions.map(f => f.field_name));
      }
    }

    let result: any = { ocrText: '', description: '', tags: [], extractedData: null };

    try {
      // Step 1: Always do the AI processing first to get high-quality OCR text
      let baseResult: any;
      
      if (provider === 'gpt') {
        console.log(`[${provider}] Processing with OpenAI...`);
        baseResult = await processWithOpenAI(signedUrlData.signedUrl, document.name, document.type);
      } else if (provider === 'mistral') {
        console.log(`[${provider}] Processing with Mistral...`);
        baseResult = await processWithMistralSimple(signedUrlData.signedUrl, document.name, document.type);
      } else if (provider === 'ocr-only') {
        console.log(`[${provider}] Processing with OCR only...`);
        baseResult = await processOCROnly(document.name);
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      result = { ...baseResult, extractedData: null };

      // Step 2: If structured extraction is needed, reuse the AI-extracted text
      if (shouldExtractStructuredData && fieldDefinitions.length > 0 && baseResult.ocrText) {
        console.log(`[${provider}] ========== ADDING STRUCTURED EXTRACTION ==========`);
        console.log(`[${provider}] Document: ${document.name}`);
        console.log(`[${provider}] Provider: ${provider}`);
        console.log(`[${provider}] Reusing AI-extracted text (${baseResult.ocrText.length} chars)`);
        console.log(`[${provider}] Field definitions:`, fieldDefinitions.map(f => ({
          name: f.field_name,
          type: f.field_type,
          label: f.field_label,
          pattern: f.extraction_pattern
        })));
        
        // Extract structured data using the existing OCR text
        const { extractStructuredData } = await import('../services/document-processor');
        const extractedData = await extractStructuredData(
          baseResult.ocrText,
          fieldDefinitions,
          document.name,
          document.type,
          signedUrlData.signedUrl
        );
        
        result.extractedData = extractedData;
        
        console.log(`[${provider}] Structured extraction result:`, {
          hasExtractedData: !!extractedData,
          extractedDataKeys: extractedData ? Object.keys(extractedData) : [],
          extractedData: extractedData
        });
      }

      // Update document with results
      const { error: updateError } = await supabase
        .from('obra_documents')
        .update({
          ocr_content: result.ocrText,
          description: result.description || result.aiDescription,
          tags: result.tags || result.aiTags,
          processing_status: 'completed',
          processing_metadata: {
            provider: providerName,
            processed_at: new Date().toISOString(),
            confidence: result.confidence
          }
        })
        .eq('id', documentId);

      if (updateError) {
        return { success: false, message: `Failed to save results: ${updateError.message}` };
      }

      // Save extracted data if available and we're in an extraction-enabled folder
      if (result.extractedData && Object.keys(result.extractedData).length > 0 && folderInfo) {
        console.log(`[${provider}] Saving extracted data with ${Object.keys(result.extractedData).length} fields`);
        
        // First delete any existing extracted data for this document
        await supabase
          .from('document_extracted_data')
          .delete()
          .eq('document_id', documentId);

        // Insert new extracted data
        const { error: extractedDataError } = await supabase
          .from('document_extracted_data')
          .insert({
            document_id: documentId,
            folder_id: folderInfo.id,
            user_id: user.id,
            extracted_data: result.extractedData,
            extraction_confidence: result.confidence || 0.8,
            field_count: Object.keys(result.extractedData).length,
            extraction_metadata: {
              method: 'manual',
              provider: providerName,
              processed_at: new Date().toISOString()
            }
          });

        if (extractedDataError) {
          console.error(`[${provider}] Failed to save extracted data:`, extractedDataError);
          console.error(`[${provider}] Error details:`, JSON.stringify(extractedDataError, null, 2));
          // Don't fail the entire operation, just log the error
        } else {
          console.log(`[${provider}] Successfully saved extracted data`);
        }
      }

      revalidatePath(`/obras/${document.obra_id}`);
      revalidatePath(`/obra-files`);

      // Log detailed results to console
      console.log(`[${provider}] ========== PROCESSING RESULTS ==========`);
      console.log(`[${provider}] Document: ${document.name}`);
      console.log(`[${provider}] Provider: ${providerName}`);
      console.log(`[${provider}] OCR Text Length: ${result.ocrText.length} characters`);
      console.log(`[${provider}] OCR Text Preview: "${result.ocrText.substring(0, 200)}${result.ocrText.length > 200 ? '...' : ''}"`);
      console.log(`[${provider}] Description: "${result.description || result.aiDescription}"`);
      console.log(`[${provider}] Tags: [${(result.tags || result.aiTags || []).join(', ')}]`);
      if (result.extractedData) {
        console.log(`[${provider}] Extracted Data: ${JSON.stringify(result.extractedData, null, 2)}`);
      }
      console.log(`[${provider}] =========================================`);

      return {
        success: true,
        message: `Documento procesado exitosamente con ${providerName}`,
        result: {
          ...result,
          provider: providerName,
          timestamp: new Date().toISOString()
        }
      };

    } catch (processingError) {
      // Update status to failed
      await supabase
        .from('obra_documents')
        .update({ 
          processing_status: 'failed',
          processing_metadata: {
            provider: providerName,
            error: processingError instanceof Error ? processingError.message : 'Unknown error',
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', documentId);

      return { success: false, message: `${providerName} processing failed: ${processingError instanceof Error ? processingError.message : 'Unknown error'}` };
    }

  } catch (error) {
    console.error(`[${provider}] Processing error:`, error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to process document' };
  }
}

// Simple OpenAI processing function
async function processWithOpenAI(documentUrl: string, fileName: string, fileType: string) {
  const { openai } = await import('@ai-sdk/openai');
  const { generateText } = await import('ai');

  console.log(`[GPT] ========== STARTING GPT PROCESSING ==========`);
  console.log(`[GPT] Document: ${fileName}`);
  console.log(`[GPT] File Type: ${fileType}`);
  console.log(`[GPT] Document URL: ${documentUrl.substring(0, 100)}...`);

  const startTime = Date.now();

  // Download the document and convert to base64 for OpenAI
  console.log(`[GPT] Downloading document from URL...`);
  let buffer: Buffer;
  let base64: string;
  
  try {
    const response = await fetch(documentUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    buffer = Buffer.from(await response.arrayBuffer());
    base64 = buffer.toString('base64');
    console.log(`[GPT] Successfully downloaded ${buffer.length} bytes`);
  } catch (downloadError) {
    console.error(`[GPT] Download failed:`, downloadError);
    throw new Error(`Failed to download document: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`);
  }
  
  // Determine MIME type based on file extension or original type
  let mimeType = fileType;
  if (!mimeType || mimeType === 'application/octet-stream') {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'png': mimeType = 'image/png'; break;
      case 'jpg':
      case 'jpeg': mimeType = 'image/jpeg'; break;
      case 'pdf': mimeType = 'application/pdf'; break;
      case 'gif': mimeType = 'image/gif'; break;
      case 'webp': mimeType = 'image/webp'; break;
      default: mimeType = 'image/png'; // Default fallback
    }
  }
  
  // Handle PDF files differently since OpenAI can't process them directly
  if (mimeType === 'application/pdf') {
    console.log(`[GPT] PDF detected - using text-only analysis`);
    // For PDFs, we'll do a simpler analysis since OpenAI can't process PDF directly
    return {
      ocrText: `PDF Document: ${fileName}\nFile size: ${buffer.length} bytes\nNote: PDF content cannot be directly analyzed by GPT-4o-mini vision model.`,
      description: `GPT analysis: PDF document "${fileName}" (${Math.round(buffer.length / 1024)}KB). PDF content analysis requires specialized OCR.`,
      tags: ['pdf', 'documento', 'gpt-processed'],
      metadata: {
        processingTime: Date.now() - startTime,
        model: 'gpt-4o-mini',
        note: 'PDF files require OCR preprocessing for content analysis',
        fileSize: buffer.length
      }
    };
  }
  
  const dataUrl = `data:${mimeType};base64,${base64}`;
  console.log(`[GPT] Downloaded ${buffer.length} bytes, converted to base64 data URL (${mimeType})`);

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this document and extract:
1. ALL readable text content
2. Document type and purpose
3. Key information (dates, numbers, names, amounts)
4. A brief description
5. Relevant tags

Format your response as:
TEXT: [extracted text]
TYPE: [document type]
KEY_INFO: [key information found]
DESCRIPTION: [brief description]
TAGS: [comma-separated tags]`
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

  const processingTime = Date.now() - startTime;
  console.log(`[GPT] Processing completed in ${processingTime}ms`);
  console.log(`[GPT] Raw response length: ${text.length} characters`);
  console.log(`[GPT] Raw response preview: "${text.substring(0, 300)}..."`);

  // Parse the structured response
  const sections = {
    text: '',
    type: '',
    keyInfo: '',
    description: '',
    tags: [] as string[]
  };

  const lines = text.split('\n');
  let currentSection = '';
  
  for (const line of lines) {
    if (line.startsWith('TEXT:')) {
      currentSection = 'text';
      sections.text = line.replace('TEXT:', '').trim();
    } else if (line.startsWith('TYPE:')) {
      currentSection = 'type';
      sections.type = line.replace('TYPE:', '').trim();
    } else if (line.startsWith('KEY_INFO:')) {
      currentSection = 'keyInfo';
      sections.keyInfo = line.replace('KEY_INFO:', '').trim();
    } else if (line.startsWith('DESCRIPTION:')) {
      currentSection = 'description';
      sections.description = line.replace('DESCRIPTION:', '').trim();
    } else if (line.startsWith('TAGS:')) {
      currentSection = 'tags';
      const tagsLine = line.replace('TAGS:', '').trim();
      sections.tags = tagsLine.split(',').map(tag => tag.trim()).filter(Boolean);
    } else if (currentSection && line.trim()) {
      // Continue previous section
      if (currentSection === 'text') sections.text += '\n' + line;
      else if (currentSection === 'type') sections.type += ' ' + line;
      else if (currentSection === 'keyInfo') sections.keyInfo += ' ' + line;
      else if (currentSection === 'description') sections.description += ' ' + line;
    }
  }

  // Fallback if parsing fails
  if (!sections.text && !sections.description) {
    sections.text = text;
    sections.description = `GPT-4o-mini analysis of ${fileName}`;
    sections.tags = ['gpt-processed', 'documento'];
  }

  console.log(`[GPT] ========== PARSED RESULTS ==========`);
  console.log(`[GPT] Extracted Text: "${sections.text.substring(0, 200)}${sections.text.length > 200 ? '...' : ''}"`);
  console.log(`[GPT] Document Type: "${sections.type}"`);
  console.log(`[GPT] Key Info: "${sections.keyInfo}"`);
  console.log(`[GPT] Description: "${sections.description}"`);
  console.log(`[GPT] Tags: [${sections.tags.join(', ')}]`);
  console.log(`[GPT] =====================================`);

  return {
    ocrText: sections.text || text,
    description: sections.description || `GPT-4o-mini analysis of ${fileName}`,
    tags: sections.tags.length > 0 ? sections.tags : ['gpt-processed', 'documento'],
    metadata: {
      processingTime,
      documentType: sections.type,
      keyInfo: sections.keyInfo,
      model: 'gpt-4o-mini'
    }
  };
}

// Simple Mistral processing function using Mistral-Large  
async function processWithMistralSimple(documentUrl: string, fileName: string, fileType: string) {
  console.log(`[Mistral] ========== STARTING MISTRAL PROCESSING ==========`);
  console.log(`[Mistral] Document: ${fileName}`);
  console.log(`[Mistral] File Type: ${fileType}`);
  console.log(`[Mistral] Document URL: ${documentUrl.substring(0, 100)}...`);
  
  const startTime = Date.now();

  try {
    // Use the actual Mistral URL-based OCR function
    console.log(`[Mistral] Calling Mistral-Large with document URL...`);
    const { extractTextWithMistralUrl } = await import('../services/url-ocr-functions');
    const ocrText = await extractTextWithMistralUrl(documentUrl, fileName);
    
    console.log(`[Mistral] OCR extraction completed, generating description and tags...`);
    
    // Generate enhanced description and tags using Mistral
    const { mistral } = await import('@ai-sdk/mistral');
    const { generateText } = await import('ai');
    
    const analysisResult = await generateText({
      model: mistral("mistral-small-latest"),
      messages: [
        {
          role: "user",
          content: `Analyze this document text and provide a description and tags in this exact format:

### **Description:**
[Write a clear, comprehensive description of the document]

### **Tags:**
- [Tag 1]
- [Tag 2]
- [Tag 3]
[etc...]

Document text to analyze:
${ocrText}`,
        },
      ],
      temperature: 0.1,
    });
    
    const processingTime = Date.now() - startTime;

    console.log(`[Mistral] Analysis completed, parsing results...`);
    
    // Parse the Mistral analysis result using the correct format
    const text = analysisResult.text;
    let description = `Mistral-Large analysis of ${fileName}`;
    let tags = ['mistral-processed', 'documento'];
    
    // Look for the Description section
    const descriptionMatch = text.match(/### \*\*Description:\*\*\s*\n([\s\S]*?)(?=\n### \*\*Tags:\*\*|$)/);
    if (descriptionMatch) {
      description = descriptionMatch[1].trim();
    }
    
    // Look for the Tags section - be more flexible with the format
    const tagsMatch = text.match(/### \*\*Tags:\*\*\s*\n([\s\S]*?)$/);
    if (tagsMatch) {
      const tagsSection = tagsMatch[1];
      console.log(`[Mistral] Raw tags section: "${tagsSection}"`);
      
      // Try multiple tag extraction patterns
      let extractedTags: string[] = [];
      
      // Pattern 1: - **Tag** (bold tags with dashes)
      const boldTagMatches = tagsSection.match(/- \*\*(.*?)\*\*/g);
      if (boldTagMatches) {
        extractedTags = boldTagMatches.map(tag => 
          tag.replace(/- \*\*(.*?)\*\*/, '$1').toLowerCase().trim()
        );
        console.log(`[Mistral] Extracted bold tags: [${extractedTags.join(', ')}]`);
      }
      
      // Pattern 2: - Tag (simple dashes, fallback)
      if (extractedTags.length === 0) {
        const simpleTagMatches = tagsSection.match(/- (.+)/g);
        if (simpleTagMatches) {
          extractedTags = simpleTagMatches.map(tag => 
            tag.replace(/- (.+)/, '$1').toLowerCase().trim().replace(/\*\*/g, '')
          );
          console.log(`[Mistral] Extracted simple tags: [${extractedTags.join(', ')}]`);
        }
      }
      
      // Pattern 3: Line-by-line fallback (if no dashes)
      if (extractedTags.length === 0) {
        const lines = tagsSection.split('\n').filter(line => line.trim());
        extractedTags = lines.map(line => 
          line.trim().toLowerCase().replace(/^-\s*/, '').replace(/\*\*/g, '')
        ).filter(tag => tag.length > 0);
        console.log(`[Mistral] Extracted line tags: [${extractedTags.join(', ')}]`);
      }
      
      if (extractedTags.length > 0) {
        tags = [...extractedTags, 'mistral-processed'];
      }
    }
    
    // Remove duplicates from tags
    const uniqueTags = Array.from(new Set(tags));
    
    console.log(`[Mistral] ========== MISTRAL RESULTS ==========`);
    console.log(`[Mistral] Processing completed in ${processingTime}ms`);
    console.log(`[Mistral] OCR Text Length: ${ocrText.length} characters`);
    console.log(`[Mistral] OCR Text Preview: "${ocrText.substring(0, 200)}${ocrText.length > 200 ? '...' : ''}"`);
    console.log(`[Mistral] Generated Description: "${description}"`);
    console.log(`[Mistral] Generated Tags: [${uniqueTags.join(', ')}]`);
    console.log(`[Mistral] Model: mistral-large-latest`);
    console.log(`[Mistral] ======================================`);
    
    return {
      ocrText,
      description,
      tags: uniqueTags,
      metadata: {
        processingTime,
        model: 'mistral-large-latest',
        ocrProvider: 'mistral-vision',
        aiProvider: 'mistral-large',
        textLength: ocrText.length
      }
    };
    
  } catch (mistralError) {
    console.error(`[Mistral] Mistral processing failed:`, mistralError);
    console.log(`[Mistral] Falling back to basic OCR analysis...`);
    
    // Fallback to basic OCR if Mistral fails
    const fallbackResult = await processOCROnly(fileName);
    const processingTime = Date.now() - startTime;
    
    console.log(`[Mistral] ========== FALLBACK RESULTS ==========`);
    console.log(`[Mistral] Fallback completed in ${processingTime}ms`);
    console.log(`[Mistral] Using basic filename analysis due to Mistral API error`);
    console.log(`[Mistral] Error: ${mistralError instanceof Error ? mistralError.message : 'Unknown error'}`);
    console.log(`[Mistral] =======================================`);
    
    return {
      ...fallbackResult,
      description: `Mistral processing failed, usando análisis básico: ${fallbackResult.description}`,
      tags: [...fallbackResult.tags, 'mistral-fallback'],
      metadata: {
        ...fallbackResult.metadata,
        processingTime,
        model: 'mistral-fallback',
        error: mistralError instanceof Error ? mistralError.message : 'Unknown error',
        note: 'Fell back to basic OCR due to Mistral API error'
      }
    };
  }
}

// Basic OCR function
async function processOCROnly(fileName: string) {
  console.log(`[OCR] ========== STARTING OCR-ONLY PROCESSING ==========`);
  console.log(`[OCR] Document: ${fileName}`);
  
  const startTime = Date.now();
  
  const patterns = [
    { name: 'dates_yyyy_mm_dd', pattern: /(\d{4}[-_]\d{2}[-_]\d{2})/g },
    { name: 'dates_dd_mm_yyyy', pattern: /(\d{2}[-_]\d{2}[-_]\d{4})/g },
    { name: 'numbers', pattern: /(\d{2,})/g },
    { name: 'document_types', pattern: /(factura|invoice|contrato|contract|plano|blueprint|certificado|reporte|informe)/gi },
    { name: 'construction_terms', pattern: /(obra|construccion|proyecto|licitacion|propuesta)/gi },
  ];
  
  const extractedData: { [key: string]: string[] } = {};
  const allMatches: string[] = [];
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  
  console.log(`[OCR] Analyzing filename: "${baseName}"`);
  
  for (const { name, pattern } of patterns) {
    const matches = baseName.match(pattern);
    if (matches) {
      extractedData[name] = Array.from(new Set(matches)); // Remove duplicates
      allMatches.push(...matches);
      console.log(`[OCR] Found ${name}: [${matches.join(', ')}]`);
    } else {
      console.log(`[OCR] No matches for ${name}`);
    }
  }
  
  // Analyze file extension
  const extension = fileName.split('.').pop()?.toLowerCase();
  const fileType = getFileTypeFromExtension(extension || '');
  
  console.log(`[OCR] File extension: .${extension}`);
  console.log(`[OCR] Detected file type: ${fileType}`);
  
  const processingTime = Date.now() - startTime;
  
  // Create detailed OCR text
  let ocrText = `DOCUMENTO ANALIZADO: ${baseName}\n`;
  ocrText += `TIPO DE ARCHIVO: ${fileType}\n`;
  ocrText += `EXTENSIÓN: .${extension}\n\n`;
  ocrText += `ELEMENTOS EXTRAÍDOS:\n`;
  
  for (const [category, matches] of Object.entries(extractedData)) {
    if (matches.length > 0) {
      ocrText += `- ${category.toUpperCase()}: ${matches.join(', ')}\n`;
    }
  }
  
  if (allMatches.length === 0) {
    ocrText += `- No se encontraron patrones reconocibles en el nombre del archivo\n`;
  }
  
  // Generate description based on patterns found
  let description = `OCR básico de "${fileName}". `;
  if (extractedData.document_types?.length > 0) {
    description += `Tipo de documento: ${extractedData.document_types.join(', ')}. `;
  }
  if (extractedData.dates_yyyy_mm_dd?.length > 0 || extractedData.dates_dd_mm_yyyy?.length > 0) {
    const dates = [...(extractedData.dates_yyyy_mm_dd || []), ...(extractedData.dates_dd_mm_yyyy || [])];
    description += `Fechas encontradas: ${dates.join(', ')}. `;
  }
  
  // Generate smart tags
  const tags = ['ocr-only'];
  if (extractedData.document_types?.length > 0) {
    tags.push(...extractedData.document_types.map(type => type.toLowerCase()));
  }
  if (extractedData.construction_terms?.length > 0) {
    tags.push('construccion');
  }
  if (extractedData.dates_yyyy_mm_dd?.length > 0 || extractedData.dates_dd_mm_yyyy?.length > 0) {
    tags.push('fechado');
  }
  tags.push(fileType);
  
  // Remove duplicates from tags
  const uniqueTags = Array.from(new Set(tags));
  
  console.log(`[OCR] ========== OCR RESULTS ==========`);
  console.log(`[OCR] Processing completed in ${processingTime}ms`);
  console.log(`[OCR] Total patterns found: ${Object.values(extractedData).flat().length}`);
  console.log(`[OCR] Extracted categories: [${Object.keys(extractedData).join(', ')}]`);
  console.log(`[OCR] Generated description: "${description}"`);
  console.log(`[OCR] Generated tags: [${uniqueTags.join(', ')}]`);
  console.log(`[OCR] Full OCR text length: ${ocrText.length} characters`);
  console.log(`[OCR] ===================================`);
  
  return {
    ocrText,
    description,
    tags: uniqueTags,
    metadata: {
      processingTime,
      patternsFound: Object.keys(extractedData).length,
      totalMatches: Object.values(extractedData).flat().length,
      fileType,
      extension,
      model: 'regex-patterns'
    }
  };
}

// Helper function to determine file type from extension
function getFileTypeFromExtension(extension: string): string {
  const typeMap: { [key: string]: string } = {
    'pdf': 'documento',
    'jpg': 'imagen',
    'jpeg': 'imagen', 
    'png': 'imagen',
    'gif': 'imagen',
    'tiff': 'imagen',
    'bmp': 'imagen',
    'doc': 'documento',
    'docx': 'documento',
    'xls': 'hoja-calculo',
    'xlsx': 'hoja-calculo',
    'ppt': 'presentacion',
    'pptx': 'presentacion',
    'txt': 'texto',
    'csv': 'datos'
  };
  
  return typeMap[extension] || 'archivo';
}

// Get document download URL
export async function getDocumentDownloadUrl(documentId: string) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get document
    const { data: document, error: docError } = await supabase
      .from('obra_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      throw new Error('Document not found or access denied');
    }

    // Generate signed URL
    if (document.path && document.path.length > 0) {
      const storagePath = document.path.join('/');
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('obra-vault')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      if (urlError) {
        throw new Error(`Failed to generate download URL: ${urlError.message}`);
      }

      return { url: signedUrl.signedUrl, document };
    } else {
      throw new Error('Document path not found');
    }
  } catch (error) {
    console.error('Get download URL error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get download URL');
  }
}
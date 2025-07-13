'use server';

import { revalidatePath } from 'next/cache';
import { getUserOrganization } from '../lib/auth-utils';
import { 
  uploadDocumentsSchema,
  createFolderSchema,
  updateDocumentSchema,
  deleteDocumentSchema,
  deleteFolderSchema,
  parseFormData
} from '../lib/validation-schemas';
import { withErrorHandling, ErrorCollector } from '../lib/error-handling';
import type { ObraDocument, Folder } from '../types';

// =============================================================================
// DOCUMENT QUERIES
// =============================================================================

/**
 * Get all documents for an organization using optimized view
 */
export const getOrganizationDocumentsWithFolders = withErrorHandling(
  async () => {
    const { supabase, organizationId } = await getUserOrganization();
    
    const { data: documents, error } = await supabase
      .from('documents_with_folders')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return { documents: documents || [] };
  },
  { revalidatePaths: ['/files'] }
);

/**
 * Get all folders for an organization using optimized view
 */
export const getOrganizationFolders = withErrorHandling(
  async () => {
    const { supabase, organizationId } = await getUserOrganization();
    
    const { data: folders, error } = await supabase
      .from('folders_with_counts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch folders: ${error.message}`);
    }

    return { folders: folders || [] };
  }
);

// =============================================================================
// DOCUMENT UPLOAD
// =============================================================================

/**
 * Upload documents with improved error handling and batch processing
 */
export const uploadDocumentsAction = withErrorHandling(
  async (formData: FormData) => {
    const { supabase, user, organizationId } = await getUserOrganization();
    
    // Parse and validate form data
    const { data: validatedData, error: validationError } = parseFormData(
      formData, 
      uploadDocumentsSchema
    );

    if (validationError || !validatedData) {
      throw new Error(`Invalid upload data: ${validationError}`);
    }

    const { files, folder_id, category, description } = validatedData;
    const errorCollector = new ErrorCollector();

    for (const file of files) {
      try {
        // Generate unique storage path
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${organizationId}/${timestamp}_${sanitizedName}`;
        
        // Upload to storage
        const fileBuffer = new Uint8Array(await file.arrayBuffer());
        const { error: uploadError } = await supabase.storage
          .from('organization-files')
          .upload(storagePath, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        // Create file record
        const { data: document, error: docError } = await supabase
          .from('files')
          .insert({
            name: file.name,
            original_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: storagePath,
            organization_id: organizationId,
            user_id: user.id,
            processing_status: 'pending',
          })
          .select()
          .single();

        if (docError) {
          // Clean up uploaded file on database error
          await supabase.storage
            .from('organization-files')
            .remove([storagePath]);
          throw new Error(`Database insert failed: ${docError.message}`);
        }

        // Create folder assignment if specified
        if (folder_id && document) {
          const { error: assignmentError } = await supabase
            .from('file_folder_assignments')
            .insert({
              file_id: document.id,
              folder_id: folder_id,
              user_id: user.id,
              sort_order: 0,
            });

          if (assignmentError) {
            console.warn(`Folder assignment failed for ${file.name}:`, assignmentError);
          }
        }

        errorCollector.addSuccess();
      } catch (fileError) {
        errorCollector.addError(
          file.name, 
          fileError instanceof Error ? fileError : new Error(String(fileError))
        );
      }
    }

    const result = errorCollector.getResult();
    
    if (!result.success) {
      throw new Error(`Failed to upload files: ${result.errors?.map(e => e.error).join(', ')}`);
    }

    return result;
  },
  { revalidatePaths: ['/files'] }
);

// =============================================================================
// FOLDER MANAGEMENT
// =============================================================================

/**
 * Create a new folder
 */
export const createFolderAction = withErrorHandling(
  async (formData: FormData) => {
    const { supabase, user, organizationId } = await getUserOrganization();
    
    const { data: validatedData, error: validationError } = parseFormData(
      formData,
      createFolderSchema
    );

    if (validationError || !validatedData) {
      throw new Error(`Invalid folder data: ${validationError}`);
    }

    const { data: folder, error } = await supabase
      .from('folders')
      .insert({
        ...validatedData,
        organization_id: organizationId,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }

    return { folder };
  },
  { revalidatePaths: ['/files'] }
);

/**
 * Delete a folder and handle document reassignment
 */
export const deleteFolderAction = withErrorHandling(
  async (formData: FormData) => {
    const { supabase, organizationId } = await getUserOrganization();
    
    const { data: validatedData, error: validationError } = parseFormData(
      formData,
      deleteFolderSchema
    );

    if (validationError || !validatedData) {
      throw new Error(`Invalid folder data: ${validationError}`);
    }

    const { id, move_to_folder_id } = validatedData;

    // Check folder ownership
    const { data: folder, error: fetchError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !folder) {
      throw new Error('Folder not found or access denied');
    }

    // Handle document reassignment
    if (move_to_folder_id) {
      // Move documents to another folder
      const { error: moveError } = await supabase
        .from('file_folder_assignments')
        .update({ folder_id: move_to_folder_id })
        .eq('folder_id', id);

      if (moveError) {
        throw new Error(`Failed to move documents: ${moveError.message}`);
      }
    } else {
      // Remove folder assignments (documents become unfoldered)
      const { error: unlinkError } = await supabase
        .from('file_folder_assignments')
        .delete()
        .eq('folder_id', id);

      if (unlinkError) {
        throw new Error(`Failed to unlink documents: ${unlinkError.message}`);
      }
    }

    // Delete field definitions
    await supabase
      .from('folder_field_definitions')
      .delete()
      .eq('folder_id', id);

    // Delete extracted data
    await supabase
      .from('extracted_data')
      .delete()
      .eq('folder_id', id);

    // Delete the folder
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (deleteError) {
      throw new Error(`Failed to delete folder: ${deleteError.message}`);
    }

    return { success: true };
  },
  { revalidatePaths: ['/files'] }
);

// =============================================================================
// DOCUMENT MANAGEMENT
// =============================================================================

/**
 * Update document metadata
 */
export const updateDocumentAction = withErrorHandling(
  async (formData: FormData) => {
    const { supabase, user, organizationId } = await getUserOrganization();
    
    const { data: validatedData, error: validationError } = parseFormData(
      formData,
      updateDocumentSchema
    );

    if (validationError || !validatedData) {
      throw new Error(`Invalid document data: ${validationError}`);
    }

    const { id, name, description, category, tags, folder_id } = validatedData;

    // Update file record
    const updates: any = {};
    if (name) updates.name = name;
    updates.updated_at = new Date().toISOString();

    const { data: file, error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update document: ${error.message}`);
    }

    // Update analysis data if provided
    if (description || category || tags) {
      await supabase
        .from('file_analysis')
        .upsert({
          file_id: id,
          user_id: user.id,
          ai_description: description,
          ai_category: category,
          ai_tags: tags,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'file_id'
        });
    }

    // Handle folder relationship
    if (folder_id !== undefined) {
      // Remove existing assignments
      await supabase
        .from('file_folder_assignments')
        .delete()
        .eq('file_id', id);

      // Add new assignment if folder_id provided
      if (folder_id) {
        await supabase
          .from('file_folder_assignments')
          .insert({
            file_id: id,
            folder_id: folder_id,
            user_id: user.id,
            sort_order: 0,
          });
      }
    }

    return { document: file };
  },
  { revalidatePaths: ['/files'] }
);

/**
 * Delete a document
 */
export const deleteDocumentAction = withErrorHandling(
  async (formData: FormData) => {
    const { supabase, organizationId } = await getUserOrganization();
    
    const { data: validatedData, error: validationError } = parseFormData(
      formData,
      deleteDocumentSchema
    );

    if (validationError || !validatedData) {
      throw new Error(`Invalid document data: ${validationError}`);
    }

    const { id } = validatedData;

    // Get file details
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !file) {
      throw new Error('Document not found or access denied');
    }

    // Delete from storage
    if (file.storage_path) {
      await supabase.storage
        .from('organization-files')
        .remove([file.storage_path]);
    }

    // Delete related records (cascade should handle this, but being explicit)
    await Promise.all([
      supabase.from('file_folder_assignments').delete().eq('file_id', id),
      supabase.from('file_analysis').delete().eq('file_id', id),
      supabase.from('extracted_data').delete().eq('file_id', id),
    ]);

    // Delete the file record
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (deleteError) {
      throw new Error(`Failed to delete document: ${deleteError.message}`);
    }

    return { success: true };
  },
  { revalidatePaths: ['/files'] }
);

// =============================================================================
// DOCUMENT PROCESSING
// =============================================================================

/**
 * Get document with extracted data
 */
export const getDocumentExtractedData = withErrorHandling(
  async (documentId: string) => {
    const { supabase, organizationId } = await getUserOrganization();

    const { data: document, error } = await supabase
      .from('documents_with_folders')
      .select('*')
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !document) {
      throw new Error('Document not found or access denied');
    }

    // Get extracted data separately for more control
    const { data: extractedData } = await supabase
      .from('extracted_data')
      .select('*')
      .eq('file_id', documentId);

    return {
      document,
      extractedData: extractedData || [],
      ocrContent: document.ocr_text
    };
  }
);

/**
 * Generate document download URL
 */
export const getDocumentDownloadUrl = withErrorHandling(
  async (documentId: string) => {
    const { supabase, organizationId } = await getUserOrganization();

    // Get file details
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single();

    if (fileError || !file) {
      throw new Error('Document not found or access denied');
    }

    if (!file.storage_path) {
      throw new Error('Document storage path not found');
    }

    // Generate signed URL
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('organization-files')
      .createSignedUrl(file.storage_path, 3600);

    if (urlError || !signedUrl) {
      throw new Error(`Failed to generate download URL: ${urlError?.message}`);
    }

    return { 
      url: signedUrl.signedUrl, 
      document: file 
    };
  }
);

// =============================================================================
// PROCESSING ACTIONS (Simple wrappers)
// =============================================================================

export const processWithGPTAction = withErrorHandling(
  async (formData: FormData) => {
    const documentId = formData.get('document_id') as string;
    if (!documentId) throw new Error('Document ID is required');
    
    const { processDocument } = await import('../services/document-processor');
    return await processDocument(documentId, 'gpt');
  },
  { revalidatePaths: ['/files'] }
);

export const processWithMistralAction = withErrorHandling(
  async (formData: FormData) => {
    const documentId = formData.get('document_id') as string;
    if (!documentId) throw new Error('Document ID is required');
    
    const { processDocument } = await import('../services/document-processor');
    return await processDocument(documentId, 'mistral');
  },
  { revalidatePaths: ['/files'] }
);

export const processWithOCROnlyAction = withErrorHandling(
  async (formData: FormData) => {
    const documentId = formData.get('document_id') as string;
    if (!documentId) throw new Error('Document ID is required');
    
    const { processDocument } = await import('../services/document-processor');
    return await processDocument(documentId, 'ocr-only');
  },
  { revalidatePaths: ['/files'] }
);
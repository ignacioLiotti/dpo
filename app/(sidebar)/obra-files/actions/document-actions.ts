'use server';

import { createClient } from '@/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
// Import document processor for structured data extraction
import { processDocument } from '../services/document-processor';

// Import types from our local schema
import type { ObraDocument, Folder } from '../types';

// Helper function to get user's organization
async function getUserOrganization(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Get user's organization
  const { data: orgId } = await supabase.rpc('get_user_organization_id');
  if (!orgId) {
    throw new Error('User is not a member of any organization');
  }

  return { user, organizationId: orgId };
}

// Schemas for validation
const uploadDocumentsSchema = z.object({
  organization_id: z.string().uuid().optional(), // Make optional since we'll get from user context
  files: z.array(z.any()),
  category: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder_id: z.string().uuid().optional(),
});

const createFolderSchema = z.object({
  organization_id: z.string().uuid().optional(), // Make optional since we'll get from user context
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

// Get all documents for an organization with folder information
export async function getOrganizationDocumentsWithFolders() {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);
    
    // Fetch files with folder info and analysis data
    const { data: documents, error } = await supabase
      .from('files')
      .select(`
        *,
        file_folder_assignments (
          folder_id,
          sort_order,
          folder:folder_id (
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
          is_verified
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return { documents: [], error: error.message };
    }

    // Transform the data to flatten the structure
    const flatDocuments = documents?.map(doc => {
      const folderAssignment = doc.file_folder_assignments?.[0];
      const folderData = folderAssignment?.folder;
      const analysis = doc.file_analysis?.[0];
      const extractedData = doc.extracted_data?.[0];
      
      const flatDoc = {
        ...doc,
        // Map to expected obra document format
        obra_id: organizationId, // Use organization ID for compatibility
        name: doc.name,
        type: doc.file_type,
        size: doc.file_size,
        path: [doc.storage_path],
        folder_id: folderData?.id || null,
        folder_name: folderData?.name || null,
        folder_color: folderData?.color || null,
        folder_icon: folderData?.icon || null,
        folder_extract_data: folderData?.extract_data || false,
        ocr_content: analysis?.ocr_text || null,
        description: analysis?.ai_description || null,
        category: analysis?.ai_category || null,
        tags: analysis?.ai_tags || [],
        extracted_data: extractedData ? JSON.parse(extractedData.extracted_value || '{}') : null,
        extraction_confidence: extractedData?.confidence_score || null,
        processing_status: doc.processing_status || 'completed',
        processing_metadata: analysis?.analysis_metadata || null,
        is_public: false,
        version: 1,
        checksum: doc.checksum,
      };
      
      // Remove the nested objects to avoid duplication
      delete flatDoc.file_folder_assignments;
      delete flatDoc.file_analysis;
      delete flatDoc.extracted_data;
      
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

// Get all folders for an organization
export async function getOrganizationFolders() {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);
    
    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching folders:', error);
      return { folders: [], error: error.message };
    }

    return { folders: folders || [], error: null };
  } catch (error) {
    console.error('Error in getOrganizationFolders:', error);
    return { folders: [], error: 'Failed to fetch folders' };
  }
}

// Upload documents action for organization files
export async function uploadDocumentsAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);

    // Extract files from FormData
    const files: File[] = Array
    .from(formData.values())
    .filter((v): v is File => v instanceof File);
    const folderId = formData.get('folder_id') as string || null;
    const category = formData.get('category') as string || 'general';
    const description = formData.get('description') as string || null;

    console.log('[uploadDocumentsAction] FormData keys:', Array.from(formData.keys()));
    console.log('[uploadDocumentsAction] Files extracted:', formData);
    console.log('[uploadDocumentsAction] Files extracted:', files.length, files.map(f => f.name));
    console.log('[uploadDocumentsAction] Folder ID:', folderId);
    console.log('[uploadDocumentsAction] Organization ID:', organizationId);

    if (!files || files.length === 0) {
      console.error('[uploadDocumentsAction] No files provided');
      throw new Error('No files provided');
    }

    const uploadedDocuments = [];
    const errors = [];

    console.log('[uploadDocumentsAction] Starting upload for', files.length, 'files');

    for (const file of files) {
      try {
        console.log(`[uploadDocumentsAction] Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);
        
        // Generate storage path for organization-files bucket
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${organizationId}/${timestamp}_${sanitizedName}`;
        
        console.log(`[uploadDocumentsAction] Storage path: ${storagePath}`);

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);
        
        console.log(`[uploadDocumentsAction] File buffer size: ${fileBuffer.length}`);

        // Upload file to organization-files storage bucket
        const { error: uploadError } = await supabase.storage
          .from('organization-files')
          .upload(storagePath, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error(`[uploadDocumentsAction] Storage upload error for ${file.name}:`, uploadError);
          errors.push({ file: file.name, error: uploadError.message });
          continue;
        }
        
        console.log(`[uploadDocumentsAction] Successfully uploaded ${file.name} to storage`);

        // Create file record in the files table
        const fileRecord = {
          name: file.name,
          original_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: storagePath,
          organization_id: organizationId,
          user_id: user.id,
          processing_status: 'pending',
        };
        
        console.log(`[uploadDocumentsAction] Inserting file record:`, fileRecord);
        
        const { data: document, error: docError } = await supabase
          .from('files')
          .insert(fileRecord)
          .select()
          .single();

        if (docError) {
          console.error(`[uploadDocumentsAction] Database insert error for ${file.name}:`, docError);
          errors.push({ file: file.name, error: docError.message });
          // Clean up uploaded file
          console.log(`[uploadDocumentsAction] Cleaning up storage file: ${storagePath}`);
          await supabase.storage.from('organization-files').remove([storagePath]);
          continue;
        }
        
        console.log(`[uploadDocumentsAction] Successfully created file record for ${file.name}:`, document);

        // If folder is specified, create folder assignment
        if (folderId && document) {
          console.log(`[uploadDocumentsAction] Creating folder assignment: file_id=${document.id}, folder_id=${folderId}`);
          
          const { error: assignmentError } = await supabase
            .from('file_folder_assignments')
            .insert({
              file_id: document.id,
              folder_id: folderId,
              user_id: user.id,
              sort_order: 0,
            });

          if (assignmentError) {
            console.error(`[uploadDocumentsAction] Error creating folder assignment for ${file.name}:`, assignmentError);
            // Don't fail the upload for this, just log it
          } else {
            console.log(`[uploadDocumentsAction] Successfully created folder assignment for ${file.name}`);
          }
        }

        uploadedDocuments.push(document);
      } catch (fileError) {
        errors.push({ 
          file: file.name, 
          error: fileError instanceof Error ? fileError.message : 'Unknown error' 
        });
      }
    }

    // Revalidate paths
    revalidatePath('/obra-files');
    
    // Determine success based on actual uploads
    const success = uploadedDocuments.length > 0;
    const hasErrors = errors.length > 0;
    
    if (!success) {
      throw new Error(`Failed to upload any files. Errors: ${errors.map(e => `${e.file}: ${e.error}`).join(', ')}`);
    }
    
    return {
      success: true,
      data: {
        uploaded: uploadedDocuments,
        errors: errors,
        totalFiles: files.length,
        successCount: uploadedDocuments.length,
        errorCount: errors.length,
      },
      warnings: hasErrors ? errors.map(e => `${e.file}: ${e.error}`) : undefined
    };
  } catch (error) {
    console.error('Upload documents error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

// Create folder action
export async function createFolderAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);

    // Extract and validate form data
    const rawData = {
      organization_id: organizationId, // Use organization ID from user context
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
    revalidatePath('/files');
    revalidatePath('/obra-files');

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
    const { user, organizationId } = await getUserOrganization(supabase);

    // Extract and validate form data
    const rawData = {
      id: formData.get('id') as string,
    };

    const validatedData = deleteFolderSchema.parse(rawData);

    // Get folder details first to ensure ownership and organization membership
    const { data: folder, error: fetchError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', validatedData.id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !folder) {
      throw new Error('Folder not found or access denied');
    }

    // Check if folder has files linked to it
    const { data: folderFiles, error: filesError } = await supabase
      .from('file_folder_assignments')
      .select('file_id')
      .eq('folder_id', validatedData.id);

    if (filesError) {
      console.error('Error checking folder files:', filesError);
      throw new Error('Failed to check folder contents');
    }

    // If folder has files, unlink them (don't delete the files, just remove from folder)
    if (folderFiles && folderFiles.length > 0) {
      const { error: unlinkError } = await supabase
        .from('file_folder_assignments')
        .delete()
        .eq('folder_id', validatedData.id);

      if (unlinkError) {
        console.error('Error unlinking files from folder:', unlinkError);
        throw new Error('Failed to unlink files from folder');
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
      .from('extracted_data')
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
      .eq('organization_id', organizationId);

    if (deleteError) {
      console.error('Error deleting folder:', deleteError);
      throw new Error(`Failed to delete folder: ${deleteError.message}`);
    }

    // Revalidate paths
    revalidatePath('/files');
    revalidatePath('/obra-files');

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
    const { user, organizationId } = await getUserOrganization(supabase);

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

    // Update file in the files table
    const { data: file, error } = await supabase
      .from('files')
      .update({
        name: validatedData.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.id)
      .eq('organization_id', organizationId) // Ensure file belongs to user's organization
      .select()
      .single();

    if (error) {
      console.error('Error updating file:', error);
      throw new Error(`Failed to update file: ${error.message}`);
    }

    // Update file analysis if description, category, or tags are provided
    if (validatedData.description || validatedData.category || validatedData.tags) {
      const { error: analysisError } = await supabase
        .from('file_analysis')
        .upsert({
          file_id: validatedData.id,
          user_id: user.id,
          ai_description: validatedData.description,
          ai_category: validatedData.category,
          ai_tags: validatedData.tags,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'file_id'
        });

      if (analysisError) {
        console.error('Error updating file analysis:', analysisError);
        // Don't fail the operation, just warn
      }
    }

    // Handle folder relationship separately if folder_id is provided
    if (validatedData.folder_id !== undefined) {
      // First remove existing folder relationships
      await supabase
        .from('file_folder_assignments')
        .delete()
        .eq('file_id', validatedData.id);

      // Add new folder relationship if folder_id is provided
      if (validatedData.folder_id) {
        const { error: linkError } = await supabase
          .from('file_folder_assignments')
          .insert({
            folder_id: validatedData.folder_id,
            file_id: validatedData.id,
            user_id: user.id,
            sort_order: 0,
          });

        if (linkError) {
          console.error('Error updating folder relationship:', linkError);
          // Don't fail the update, just warn
        }
      }
    }

    // Revalidate paths
    revalidatePath('/files');
    revalidatePath('/obra-files');

    return { success: true, document: file };
  } catch (error) {
    console.error('Update document error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update document');
  }
}

// Delete document action
export async function deleteDocumentAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);

    // Extract and validate form data
    const rawData = {
      id: formData.get('id') as string,
    };

    const validatedData = deleteDocumentSchema.parse(rawData);

    // Get file details first
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', validatedData.id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !file) {
      throw new Error('File not found or access denied');
    }

    // Delete from storage
    if (file.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('organization-files')
        .remove([file.storage_path]);

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
        // Continue with database deletion even if storage fails
      }
    }

    // Delete folder relationships first
    await supabase
      .from('file_folder_assignments')
      .delete()
      .eq('file_id', validatedData.id);

    // Delete file analysis
    await supabase
      .from('file_analysis')
      .delete()
      .eq('file_id', validatedData.id);

    // Delete extracted data
    await supabase
      .from('extracted_data')
      .delete()
      .eq('file_id', validatedData.id);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', validatedData.id)
      .eq('organization_id', organizationId);

    if (deleteError) {
      console.error('Error deleting file:', deleteError);
      throw new Error(`Failed to delete file: ${deleteError.message}`);
    }

    // Revalidate paths
    revalidatePath('/files');
    revalidatePath('/obra-files');

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
    const { user, organizationId } = await getUserOrganization(supabase);

    // Get file with extracted data
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select(`
        *,
        file_analysis (*),
        extracted_data (*)
      `)
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single();

    if (fileError || !file) {
      throw new Error('File not found or access denied');
    }

    const analysis = file.file_analysis?.[0];
    const extractedData = file.extracted_data?.[0];

    return {
      document: {
        ...file,
        // Map to expected format for compatibility
        ocr_content: analysis?.ocr_text || null,
        description: analysis?.ai_description || null,
        category: analysis?.ai_category || null,
        tags: analysis?.ai_tags || [],
        processing_metadata: analysis?.analysis_metadata || null,
      },
      extractedData: extractedData ? {
        ...extractedData,
        extracted_data: JSON.parse(extractedData.extracted_value || '{}'),
      } : null,
      ocrContent: analysis?.ocr_text || null
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
    const { user, organizationId } = await getUserOrganization(supabase);

    if (!documentId) {
      return { success: false, message: 'Document ID is required' };
    }

    // Get file details first
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single();

    if (fileError || !file) {
      console.error(`[${provider}] File query error:`, fileError);
      return { success: false, message: 'File not found or access denied' };
    }

    // Get folder information through file_folder_assignments junction table
    let folderInfo: { id: string; name: string; extract_data: boolean } | null = null;
    const { data: folderLink, error: folderError } = await supabase
      .from('file_folder_assignments')
      .select(`
        folder_id,
        folder:folder_id (
          id,
          name,
          extract_data
        )
      `)
      .eq('file_id', documentId)
      .single();

    if (!folderError && folderLink?.folder) {
      // Handle the case where folder might be typed as an array by Supabase
      const folder = Array.isArray(folderLink.folder) ? folderLink.folder[0] : folderLink.folder;
      if (folder) {
        folderInfo = {
          id: folder.id,
          name: folder.name,
          extract_data: folder.extract_data
        };
        console.log(`[${provider}] File is in folder: ${folderInfo.name} (extract_data: ${folderInfo.extract_data})`);
      }
    } else {
      console.log(`[${provider}] File is not in any folder or folder lookup failed:`, folderError);
    }

    // Update status to processing
    await supabase
      .from('files')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Generate signed URL for the file
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('organization-files')
      .createSignedUrl(file.storage_path, 3600);

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
        baseResult = await processWithOpenAI(signedUrlData.signedUrl, file.name, file.file_type);
      } else if (provider === 'mistral') {
        console.log(`[${provider}] Processing with Mistral...`);
        baseResult = await processWithMistralSimple(signedUrlData.signedUrl, file.name, file.file_type);
      } else if (provider === 'ocr-only') {
        console.log(`[${provider}] Processing with OCR only...`);
        baseResult = await processOCROnly(file.name);
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      result = { ...baseResult, extractedData: null };

      // Step 2: If structured extraction is needed, reuse the AI-extracted text
      if (shouldExtractStructuredData && fieldDefinitions.length > 0 && baseResult.ocrText) {
        console.log(`[${provider}] ========== ADDING STRUCTURED EXTRACTION ==========`);
        console.log(`[${provider}] File: ${file.name}`);
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
          file.name,
          file.file_type,
          signedUrlData.signedUrl
        );
        
        result.extractedData = extractedData;
        
        console.log(`[${provider}] Structured extraction result:`, {
          hasExtractedData: !!extractedData,
          extractedDataKeys: extractedData ? Object.keys(extractedData) : [],
          extractedData: extractedData
        });
      }

      // Update file status
      const { error: fileUpdateError } = await supabase
        .from('files')
        .update({
          processing_status: 'completed',
        })
        .eq('id', documentId);

      if (fileUpdateError) {
        console.error(`[${provider}] Failed to update file status:`, fileUpdateError);
      }

      // Update or insert file analysis
      const analysisMetadata: any = {
        provider: providerName,
        processed_at: new Date().toISOString(),
        confidence: result.confidence
      };

      // Add extracted data to metadata if available
      if (result.extractedData && Object.keys(result.extractedData).length > 0) {
        analysisMetadata.extracted_data = result.extractedData;
        analysisMetadata.extraction_enabled = folderInfo?.extract_data || false;
        analysisMetadata.folder_id = folderInfo?.id || null;
        analysisMetadata.field_count = Object.keys(result.extractedData).length;
      }

      const { error: updateError } = await supabase
        .from('file_analysis')
        .upsert({
          file_id: documentId,
          user_id: user.id,
          ocr_text: result.ocrText,
          ai_description: result.description || result.aiDescription,
          ai_category: result.category || 'document',
          ai_tags: result.tags || result.aiTags,
          confidence_score: result.confidence || 0.8,
          analysis_metadata: analysisMetadata
        }, {
          onConflict: 'file_id'
        });

      if (updateError) {
        return { success: false, message: `Failed to save results: ${updateError.message}` };
      }

      // Save structured extracted data to extracted_data table if available
      if (result.extractedData && Object.keys(result.extractedData).length > 0 && folderInfo) {
        console.log(`[${provider}] Saving structured extracted data to extracted_data table...`);
        
        // For AI extractions, we need to create a dummy extraction_config_id
        // since the table requires it but we're not using the formal extraction config system
        // We'll use a deterministic UUID based on the folder_id
        const dummyConfigId = `00000000-0000-0000-0000-${folderInfo.id.substring(24)}`;
        
        // First check if we need to create this dummy config
        const { data: existingConfig } = await supabase
          .from('folder_extraction_configs')
          .select('id')
          .eq('id', dummyConfigId)
          .single();
          
        if (!existingConfig) {
          // Create a dummy field config entry (required by schema)
          const { error: configError } = await supabase
            .from('folder_extraction_configs')
            .insert({
              id: dummyConfigId,
              folder_id: folderInfo.id,
              user_id: user.id,
              field_name: '_ai_extraction',
              field_label: 'AI Extracted Data',
              field_type: 'text',
              extraction_pattern: 'AI-based extraction',
              is_required: false,
              is_active: true
            });
            
          if (configError) {
            console.error(`[${provider}] Failed to create dummy extraction config:`, configError);
          }
        }
        
        // Check if there's already extracted data for this file
        const { data: existingData } = await supabase
          .from('extracted_data')
          .select('id')
          .eq('file_id', documentId)
          .single();

        if (existingData) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('extracted_data')
            .update({
              extracted_value: JSON.stringify(result.extractedData),
              confidence_score: result.confidence || 0.8,
              is_verified: false,
              extraction_metadata: {
                provider: providerName,
                processed_at: new Date().toISOString(),
                field_count: Object.keys(result.extractedData).length,
                extraction_method: 'ai_structured'
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', existingData.id);

          if (updateError) {
            console.error(`[${provider}] Failed to update extracted data:`, updateError);
          } else {
            console.log(`[${provider}] Successfully updated ${Object.keys(result.extractedData).length} extracted fields in extracted_data table`);
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('extracted_data')
            .insert({
              file_id: documentId,
              folder_id: folderInfo.id,
              extraction_config_id: dummyConfigId,
              user_id: user.id,
              extracted_value: JSON.stringify(result.extractedData),
              confidence_score: result.confidence || 0.8,
              is_verified: false,
              extraction_metadata: {
                provider: providerName,
                processed_at: new Date().toISOString(),
                field_count: Object.keys(result.extractedData).length,
                extraction_method: 'ai_structured'
              }
            });

          if (insertError) {
            console.error(`[${provider}] Failed to insert extracted data:`, insertError);
          } else {
            console.log(`[${provider}] Successfully saved ${Object.keys(result.extractedData).length} extracted fields to extracted_data table`);
          }
        }
      } else if (result.extractedData && Object.keys(result.extractedData).length > 0) {
        console.log(`[${provider}] AI analysis contains ${Object.keys(result.extractedData).length} extracted fields but no folder context - not saving to extracted_data table`);
      }

      revalidatePath('/files');
      revalidatePath('/obra-files');

      // Log detailed results to console
      console.log(`[${provider}] ========== PROCESSING RESULTS ==========`);
      console.log(`[${provider}] File: ${file.name}`);
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
        .from('files')
        .update({ 
          processing_status: 'failed'
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

// Get document download URL with fallback to legacy obra system
export async function getDocumentDownloadUrl(documentId: string) {
  try {
    const supabase = await createClient();
    
    // First try to get user organization for organization files
    try {
      console.log('[getDocumentDownloadUrl] Starting for document ID:', documentId);
      const { user, organizationId } = await getUserOrganization(supabase);

      // Try to get file from organization files table
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', documentId)
        .eq('organization_id', organizationId)
        .single();

      if (file && !fileError) {
        // Generate signed URL for organization file
        if (file.storage_path) {
          // Database might have organizationId/filename but storage has just filename in the org folder
          const fileName = file.storage_path.includes('/') ? file.storage_path.split('/')[1] : file.storage_path;
          const correctStoragePath = `${organizationId}/${fileName}`;
          
          const { data, error } = await supabase.storage
            .from('organization-files')
            .createSignedUrl(correctStoragePath, 3600);

          console.log('[getDocumentDownloadUrl] Signed URL:', data);
          console.log('[getDocumentDownloadUrl] URL Error:', error);

          if (error) {
            // Try to find the file in the old obra-vault bucket using the filename
            const fileName = file.storage_path.split('/')[1]; // Get just the filename
            
            // Try different potential paths in obra-vault
            const potentialPaths = [
              fileName, // Direct filename
              `documents/${fileName}`, // In documents folder
              `uploads/${fileName}`, // In uploads folder
              file.storage_path
            ];
            
            for (const path of potentialPaths) {
              console.log('[getDocumentDownloadUrl] Trying legacy path:', path);
              const { data: legacyUrl, error: legacyError } = await supabase.storage
                .from('organization-files')
                .createSignedUrl(path, 3600);

              console.log('[getDocumentDownloadUrl] Legacy URL:', legacyUrl);
              console.log('[getDocumentDownloadUrl] Legacy Error:', legacyError);
                
              if (!legacyError && legacyUrl?.signedUrl) {
                return { url: legacyUrl.signedUrl, document: file };
              }
            }
            
            // File exists in database but not in storage - return a special response indicating this
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
      }
    } catch (orgError) {
      // Organization system failed, try legacy system
    }

    // Fallback to legacy obra_documents system
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Try to get document from legacy obra_documents table
    const { data: document, error: docError } = await supabase
      .from('obra_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found in either system. Organization error: file not found, Legacy error: ${docError?.message || 'No document found'}`);
    }

    // Generate signed URL for legacy document
    if (document.path && document.path.length > 0) {
      const storagePath = document.path.join('/');
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from('obra-vault')
        .createSignedUrl(storagePath, 3600);

      if (urlError) {
        throw new Error(`Failed to generate legacy download URL: ${urlError.message}`);
      }

      return { url: signedUrl.signedUrl, document };
    } else {
      throw new Error('Document path not found in legacy system');
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to get download URL');
  }
}
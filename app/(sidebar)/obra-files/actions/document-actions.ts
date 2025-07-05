'use server';

import { createClient } from '@/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
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

// Get all documents for an obra with folder information
export async function getObraDocumentsWithFolders(obraId: string) {
  try {
    const supabase = await createClient();
    
    const { data: documents, error } = await supabase
      .from('documents_with_folders')
      .select('*')
      .eq('obra_id', obraId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return { documents: [], error: error.message };
    }

    return { documents: documents || [], error: null };
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
    const processingWarnings: string[] = [];
    const processingResults: Array<{
      documentId: string;
      fileName: string;
      ocrText: string;
      extractedData: Record<string, any> | null;
      confidence: number;
    }> = [];

    // Check folder extraction settings if folder is specified
    let folderExtractionEnabled = false;
    let fieldDefinitions: any[] = [];
    
    if (folderId) {
      try {
        // Check if folder has extraction enabled
        const { data: folder } = await supabase
          .from('folders')
          .select('extract_data')
          .eq('id', folderId)
          .single();
          
        if (folder?.extract_data) {
          folderExtractionEnabled = true;
          
          // Get field definitions for this folder
          const { data: fields } = await supabase
            .from('folder_field_definitions')
            .select('*')
            .eq('folder_id', folderId)
            .eq('is_active', true)
            .order('sort_order');
            
          fieldDefinitions = fields || [];
        }
      } catch (error) {
        console.warn('Error checking folder extraction settings:', error);
      }
    }

    // Process each file
    for (const file of files) {
      
      // Check if we have pre-processed data
      const processedDataKey = `processed_data_${files.indexOf(file)}`;
      const processedDataString = formData.get(processedDataKey) as string;
      
      let ocrText = '';
      let aiDescription = description || `Documento: ${file.name}`;
      let aiTags = tags.length > 0 ? tags : [];
      let extractedData: Record<string, any> | undefined;
      let processingResult: any = null;
      
      if (processedDataString) {
        // Use pre-processed data
        try {
          const processedData = JSON.parse(processedDataString);
          ocrText = processedData.ocrText || '';
          extractedData = processedData.extractedData;
          processingResult = {
            confidence: processedData.confidence || 0,
            metadata: processedData.metadata || {}
          };
          
          if (!description) {
            aiDescription = processedData.aiDescription || `Documento: ${file.name}`;
          }
          if (tags.length === 0) {
            aiTags = processedData.aiTags || [];
          }
          
          // console.log(`Using pre-processed data for ${file.name}:`, {
          //   ocrLength: ocrText.length,
          //   description: aiDescription,
          //   tags: aiTags,
          //   confidence: processingResult.confidence,
          //   extractedFieldsCount: extractedData ? Object.keys(extractedData).length : 0
          // });
          
        } catch (parseError) {
          console.warn(`Failed to parse processed data for ${file.name}:`, parseError);
          processingWarnings.push(`Error al procesar datos pre-procesados para ${file.name}`);
        }
      } else {
        // Fallback: Process document in real-time (legacy mode)
        try {
          processingResult = await processDocument(
            file,
            file.name,
            file.type,
            folderExtractionEnabled,
            fieldDefinitions
          );
          
          ocrText = processingResult.ocrText;
          extractedData = processingResult.extractedData;
          
          if (!description) {
            aiDescription = processingResult.aiDescription;
          }
          if (tags.length === 0) {
            aiTags = processingResult.aiTags;
          }
          
          // console.log(`Real-time processing completed for ${file.name}:`, {
          //   ocrLength: ocrText.length,
          //   description: aiDescription,
          //   tags: aiTags,
          //   confidence: processingResult.confidence,
          //   extractedFieldsCount: extractedData ? Object.keys(extractedData).length : 0
          // });
          
        } catch (processingError) {
          console.warn(`Document processing failed for ${file.name}:`, processingError);
          processingWarnings.push(`Error procesando ${file.name}: ${processingError instanceof Error ? processingError.message : 'Error desconocido'}`);
          // Continue with upload even if processing fails
        }
      }
      
      // Add warnings based on processing results
      if (processingResult?.metadata?.ocrProvider === 'all-failed') {
        processingWarnings.push(`OCR falló para ${file.name} - usando solo nombre del archivo`);
      } else if (processingResult?.metadata?.ocrProvider === 'regex') {
        processingWarnings.push(`${file.name}: OCR avanzado no disponible, usando análisis básico`);
      }
      
      if (processingResult?.confidence && processingResult.confidence < 0.5) {
        processingWarnings.push(`${file.name}: Procesamiento con baja confianza (${Math.round(processingResult.confidence * 100)}%)`);
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

      // Step 3: Insert document record with OCR content and AI data
      const { data: document, error: documentError } = await supabase
        .from('obra_documents')
        .insert({
          obra_id: obraId,
          user_id: user.id,
          name: file.name,
          type: file.type,
          size: file.size,
          path: [obraId, fileName],
          description: aiDescription,
          category: category || null,
          tags: aiTags.length > 0 ? aiTags : null,
          folder: 'Sin Clasificar', // Use old folder system for now
          ocr_content: ocrText || null, // Store OCR content
          is_public: false,
          version: 1,
        })
        .select()
        .single();

      if (documentError) {
        console.error('Document insert error:', documentError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('obra-vault').remove([storagePath]);
        throw new Error(`Failed to save document ${file.name}: ${documentError.message}`);
      }

      // Step 4: Link to folder if specified
      if (folderId) {
        const { error: linkError } = await supabase
          .from('folder_documents')
          .insert({
            folder_id: folderId,
            document_id: document.id,
          });

        if (linkError) {
          console.error('Error linking document to folder:', linkError);
          // Don't fail the upload, just warn
        }
        
        // Step 5: Save extracted data if available
        if (extractedData && Object.keys(extractedData).length > 0) {
          try {
            const { error: extractionError } = await supabase
              .from('document_extracted_data')
              .insert({
                document_id: document.id,
                folder_id: folderId,
                user_id: user.id,
                extracted_data: extractedData,
                extraction_confidence: processingResult?.confidence || 0,
                field_count: Object.keys(extractedData).length,
                extraction_metadata: {
                  processing_time: processingResult?.metadata?.processingTime || 0,
                  ocr_provider: processingResult?.metadata?.ocrProvider || 'none',
                  ai_provider: processingResult?.metadata?.aiProvider || 'none',
                  file_type: file.type
                }
              });
              
            if (extractionError) {
              console.error('Error saving extracted data:', extractionError);
              // Don't fail the upload, just warn
            } else {
              // console.log(`Saved extracted data for ${file.name}: ${Object.keys(extractedData).length} fields`);
            }
          } catch (error) {
            console.error('Error processing extracted data:', error);
          }
        }
      }

      uploadedDocuments.push(document);
      
      // Store processing results for client display
      processingResults.push({
        documentId: document.id,
        fileName: file.name,
        ocrText: ocrText || '',
        extractedData: extractedData || null,
        confidence: processingResult?.confidence || 0
      });
    }

    // Revalidate relevant paths
    revalidatePath(`/obras/${obraId}`);
    revalidatePath(`/obra-files`);

    return { 
      success: true, 
      documents: uploadedDocuments,
      warnings: processingWarnings.length > 0 ? processingWarnings : undefined,
      processingResults
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
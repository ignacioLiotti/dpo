'use server';

import { createClient } from '@/supabase/server';
import { action } from '@/lib/actions/safe-action';
import { 
  uploadDocumentSchema, 
  updateDocumentSchema, 
  deleteDocumentSchema, 
  createFolderSchema, 
  updateFolderSchema, 
  deleteFolderSchema, 
  moveFolderDocumentsSchema,
  addDocumentsToFolderSchema,
  removeDocumentsFromFolderSchema,
  type ObraDocument,
  type Folder 
} from '@/lib/schemas/document-schemas';
import { revalidatePath } from 'next/cache';

export const uploadDocumentsAction = action
  .schema(uploadDocumentSchema)
  .action(async ({ parsedInput }: { parsedInput: { obra_id: string; files: File[]; category?: string; description?: string; tags?: string[]; folder_id?: string } }) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Special bypass for development email
    const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
    
    if ((authError || !user) && !isDevelopmentUser) {
      throw new Error('No autorizado');
    }

    const { obra_id, files, category, description, tags, folder_id } = parsedInput;

    // For development user, skip obra ownership verification
    if (!isDevelopmentUser) {
      // Verify user owns the obra
      const { data: obra, error: obraError } = await supabase
        .from('obras')
        .select('id, user_id')
        .eq('id', obra_id)
        .eq('user_id', user.id)
        .single();

      if (obraError || !obra) {
        throw new Error('Obra no encontrada o no autorizada');
      }
    }

    // If folder_id is provided, verify it exists and belongs to the obra
    if (folder_id) {
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('id, obra_id')
        .eq('id', folder_id)
        .eq('obra_id', obra_id)
        .single();

      if (folderError || !folder) {
        throw new Error('Carpeta no encontrada o no válida');
      }
    }

    const uploadResults = [];

    for (const file of files) {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${obra_id}/${fileName}`;

        // Upload file to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('obra-vault')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          uploadResults.push({ success: false, fileName: file.name, error: uploadError.message });
          continue;
        }

        // Create document record
        const { data: documentData, error: documentError } = await supabase
          .from('obra_documents')
          .insert({
            obra_id,
            user_id: user?.id || '00000000-0000-0000-0000-000000000000', // Default user ID for development
            name: file.name,
            type: file.type,
            size: file.size,
            path: [obra_id, fileName],
            category: category || 'otros',
            description,
            tags: tags || [],
            // Remove the old folder field as we now use the join table
          })
          .select()
          .single();

        if (documentError) {
          // Cleanup uploaded file if document creation fails
          await supabase.storage.from('obra-vault').remove([filePath]);
          uploadResults.push({ success: false, fileName: file.name, error: documentError.message });
          continue;
        }

        // If a folder is specified, link the document to the folder
        if (folder_id && documentData) {
          const { error: linkError } = await supabase
            .from('folder_documents')
            .insert({
              folder_id,
              document_id: documentData.id,
            });

          if (linkError) {
            console.warn(`Failed to link document ${documentData.id} to folder ${folder_id}:`, linkError);
            // Don't fail the upload, just log the warning
          }
        }

        uploadResults.push({ success: true, fileName: file.name, document: documentData });
      } catch (error) {
        uploadResults.push({ 
          success: false, 
          fileName: file.name, 
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    revalidatePath(`/obras/${obra_id}`);
    return { 
      success: true, 
      data: uploadResults,
      message: `${uploadResults.filter(r => r.success).length} de ${uploadResults.length} archivos subidos correctamente`
    };
  });

export const updateDocumentAction = action
  .schema(updateDocumentSchema)
  .action(async ({ parsedInput }: { parsedInput: { id: string; name?: string; description?: string; category?: string; tags?: string[]; folder_id?: string; is_public?: boolean } }) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Special bypass for development email
    const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
    
    if ((authError || !user) && !isDevelopmentUser) {
      throw new Error('No autorizado');
    }

    const { id, folder_id, ...updateData } = parsedInput;

    // For development user, skip user ownership verification
    if (isDevelopmentUser) {
      const { data: document, error: documentError } = await supabase
        .from('obra_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (documentError || !document) {
        throw new Error('Documento no encontrado');
      }

      const { data: updatedDocument, error: updateError } = await supabase
        .from('obra_documents')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error al actualizar documento: ${updateError.message}`);
      }

      // Handle folder change if folder_id is provided
      if (folder_id !== undefined) {
        // First remove from all folders
        await supabase
          .from('folder_documents')
          .delete()
          .eq('document_id', id);

        // Then add to new folder if folder_id is provided
        if (folder_id) {
          const { error: linkError } = await supabase
            .from('folder_documents')
            .insert({
              folder_id,
              document_id: id,
            });

          if (linkError) {
            console.warn(`Failed to link document ${id} to folder ${folder_id}:`, linkError);
          }
        }
      }

      revalidatePath(`/obras/${document.obra_id}`);
      return { 
        success: true, 
        data: updatedDocument,
        message: 'Documento actualizado correctamente'
      };
    }

    // Normal user flow with ownership verification
    const { data: document, error: documentError } = await supabase
      .from('obra_documents')
      .select(`
        *,
        obras!inner(user_id)
      `)
      .eq('id', id)
      .eq('obras.user_id', user.id)
      .single();

    if (documentError || !document) {
      throw new Error('Documento no encontrado o no autorizado');
    }

    const { data: updatedDocument, error: updateError } = await supabase
      .from('obra_documents')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Error al actualizar documento: ${updateError.message}`);
    }

    // Handle folder change if folder_id is provided
    if (folder_id !== undefined) {
      // First remove from all folders
      await supabase
        .from('folder_documents')
        .delete()
        .eq('document_id', id);

      // Then add to new folder if folder_id is provided
      if (folder_id) {
        const { error: linkError } = await supabase
          .from('folder_documents')
          .insert({
            folder_id,
            document_id: id,
          });

        if (linkError) {
          console.warn(`Failed to link document ${id} to folder ${folder_id}:`, linkError);
        }
      }
    }

    revalidatePath(`/obras/${document.obra_id}`);
    return { 
      success: true, 
      data: updatedDocument,
      message: 'Documento actualizado correctamente'
    };
  });

export const deleteDocumentAction = action
  .schema(deleteDocumentSchema)
  .action(async ({ parsedInput }: { parsedInput: { id: string } }) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Special bypass for development email
    const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
    
    if ((authError || !user) && !isDevelopmentUser) {
      throw new Error('No autorizado');
    }

    const { id } = parsedInput;

    // For development user, skip user ownership verification
    if (isDevelopmentUser) {
      const { data: document, error: documentError } = await supabase
        .from('obra_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (documentError || !document) {
        throw new Error('Documento no encontrado');
      }

      // Delete from storage
      const filePath = document.path.join('/');
      const { error: storageError } = await supabase.storage
        .from('obra-vault')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('obra_documents')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(`Error al eliminar documento: ${deleteError.message}`);
      }

      revalidatePath(`/obras/${document.obra_id}`);
      return { 
        success: true,
        message: 'Documento eliminado correctamente'
      };
    }

    // Normal user flow with ownership verification
    const { data: document, error: documentError } = await supabase
      .from('obra_documents')
      .select(`
        *,
        obras!inner(user_id)
      `)
      .eq('id', id)
      .eq('obras.user_id', user.id)
      .single();

    if (documentError || !document) {
      throw new Error('Documento no encontrado o no autorizado');
    }

    // Delete from storage
    const filePath = document.path.join('/');
    const { error: storageError } = await supabase.storage
      .from('obra-vault')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('obra_documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(`Error al eliminar documento: ${deleteError.message}`);
    }

    revalidatePath(`/obras/${document.obra_id}`);
    return { 
      success: true,
      message: 'Documento eliminado correctamente'
    };
  });

// Get documents for an obra
export async function getObraDocuments(obraId: string): Promise<{ documents?: ObraDocument[]; error?: string; requiresAuth?: boolean }> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // Special bypass for development email
  const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
  
  if ((authError || !user) && !isDevelopmentUser) {
    return { error: 'No autorizado', requiresAuth: true };
  }

  // If development user, we need to get documents without user_id filtering
  if (isDevelopmentUser) {
    const { data: documents, error } = await supabase
      .from('obra_documents')
      .select('*')
      .eq('obra_id', obraId)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: `Error al obtener documentos: ${error.message}` };
    }

    return { documents: documents || [] };
  }

  // Normal user flow with user_id filtering
  const { data: documents, error } = await supabase
    .from('obra_documents')
    .select(`
      *,
      obras!inner(user_id)
    `)
    .eq('obra_id', obraId)
    .eq('obras.user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: `Error al obtener documentos: ${error.message}` };
  }

  return { documents: documents || [] };
}

// Get signed URL for document download
export async function getDocumentDownloadUrl(documentId: string): Promise<string> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // Special bypass for development email
  const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
  
  if ((authError || !user) && !isDevelopmentUser) {
    throw new Error('No autorizado');
  }

  // For development user, skip user ownership verification
  if (isDevelopmentUser) {
    const { data: document, error: documentError } = await supabase
      .from('obra_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (documentError || !document) {
      throw new Error('Documento no encontrado');
    }

    const filePath = document.path.join('/');
    
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('obra-vault')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (urlError) {
      throw new Error(`Error al generar URL de descarga: ${urlError.message}`);
    }

    return signedUrlData.signedUrl;
  }

  // Normal user flow with ownership verification
  const { data: document, error: documentError } = await supabase
    .from('obra_documents')
    .select(`
      *,
      obras!inner(user_id)
    `)
    .eq('id', documentId)
    .eq('obras.user_id', user.id)
    .single();

  if (documentError || !document) {
    throw new Error('Documento no encontrado o no autorizado');
  }

  const filePath = document.path.join('/');
  
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from('obra-vault')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (urlError) {
    throw new Error(`Error al generar URL de descarga: ${urlError.message}`);
  }

  return signedUrlData.signedUrl;
}

// New folder management actions - Updated for proper folder table system

export const createFolderAction = action
  .schema(createFolderSchema)
  .action(async ({ parsedInput }: { parsedInput: { obra_id: string; name: string; color?: string; icon?: string } }) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
    
    if ((authError || !user) && !isDevelopmentUser) {
      throw new Error('No autorizado');
    }

    const { obra_id, name, color = '#6B7280', icon = '📁' } = parsedInput;

    // Verify user owns the obra
    if (!isDevelopmentUser) {
      const { data: obra, error: obraError } = await supabase
        .from('obras')
        .select('id, user_id')
        .eq('id', obra_id)
        .eq('user_id', user.id)
        .single();

      if (obraError || !obra) {
        throw new Error('Obra no encontrada o no autorizada');
      }
    }

    // Create the folder
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .insert({
        obra_id,
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        name,
        color,
        icon,
        is_default: false,
      })
      .select()
      .single();

    if (folderError) {
      if (folderError.code === '23505') { // Unique constraint violation
        throw new Error('Ya existe una carpeta con ese nombre');
      }
      throw new Error(`Error al crear carpeta: ${folderError.message}`);
    }

    revalidatePath(`/obras/${obra_id}`);
    return { 
      success: true, 
      data: folder,
      message: `Carpeta "${name}" creada correctamente`
    };
  });

export const updateFolderAction = action
  .schema(updateFolderSchema)
  .action(async ({ parsedInput }: { parsedInput: { id: string; name: string; color?: string; icon?: string } }) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
    
    if ((authError || !user) && !isDevelopmentUser) {
      throw new Error('No autorizado');
    }

    const { id, name, color, icon } = parsedInput;

    // Get the folder and verify ownership
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select(`
        *,
        obras!inner(user_id)
      `)
      .eq('id', id)
      .eq('obras.user_id', isDevelopmentUser ? undefined : user.id)
      .single();

    if (folderError || !folder) {
      throw new Error('Carpeta no encontrada o no autorizada');
    }

    // Update the folder
    const { data: updatedFolder, error: updateError } = await supabase
      .from('folders')
      .update({
        name,
        color,
        icon,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') { // Unique constraint violation
        throw new Error('Ya existe una carpeta con ese nombre');
      }
      throw new Error(`Error al actualizar carpeta: ${updateError.message}`);
    }

    revalidatePath(`/obras/${folder.obra_id}`);
    return { 
      success: true, 
      data: updatedFolder,
      message: `Carpeta actualizada correctamente`
    };
  });

export const deleteFolderAction = action
  .schema(deleteFolderSchema)
  .action(async ({ parsedInput }: { parsedInput: { id: string; move_to_folder_id?: string } }) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
    
    if ((authError || !user) && !isDevelopmentUser) {
      throw new Error('No autorizado');
    }

    const { id, move_to_folder_id } = parsedInput;

    // Get the folder and verify ownership
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select(`
        *,
        obras!inner(user_id)
      `)
      .eq('id', id)
      .eq('obras.user_id', isDevelopmentUser ? undefined : user.id)
      .single();

    if (folderError || !folder) {
      throw new Error('Carpeta no encontrada o no autorizada');
    }

    // Prevent deletion of default folders
    if (folder.is_default) {
      throw new Error('No se pueden eliminar las carpetas predeterminadas');
    }

    // Get documents in this folder
    const { data: folderDocuments, error: documentsError } = await supabase
      .from('folder_documents')
      .select('document_id')
      .eq('folder_id', id);

    if (documentsError) {
      throw new Error(`Error al obtener documentos: ${documentsError.message}`);
    }

    const documentIds = folderDocuments?.map(fd => fd.document_id) || [];

    // If there are documents and a target folder is specified, move them
    if (documentIds.length > 0 && move_to_folder_id) {
      // Verify target folder exists and belongs to same obra
      const { data: targetFolder, error: targetError } = await supabase
        .from('folders')
        .select('id, obra_id')
        .eq('id', move_to_folder_id)
        .eq('obra_id', folder.obra_id)
        .single();

      if (targetError || !targetFolder) {
        throw new Error('Carpeta destino no válida');
      }

      // Remove documents from current folder
      await supabase
        .from('folder_documents')
        .delete()
        .eq('folder_id', id);

      // Add documents to target folder
      const folderDocumentLinks = documentIds.map(docId => ({
        folder_id: move_to_folder_id,
        document_id: docId,
      }));

      const { error: linkError } = await supabase
        .from('folder_documents')
        .insert(folderDocumentLinks);

      if (linkError) {
        console.warn('Error moving documents to target folder:', linkError);
      }
    } else {
      // Just remove the folder-document links (documents become unorganized)
      await supabase
        .from('folder_documents')
        .delete()
        .eq('folder_id', id);
    }

    // Delete the folder
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(`Error al eliminar carpeta: ${deleteError.message}`);
    }

    revalidatePath(`/obras/${folder.obra_id}`);
    return { 
      success: true, 
      data: { 
        folderId: id, 
        folderName: folder.name,
        documentsMovedCount: documentIds.length,
        moveToFolderId: move_to_folder_id
      },
      message: `Carpeta "${folder.name}" eliminada${documentIds.length > 0 ? ` (${documentIds.length} documentos movidos)` : ''}`
    };
  });

export const moveFolderDocumentsAction = action
  .schema(moveFolderDocumentsSchema)
  .action(async ({ parsedInput }: { parsedInput: { document_ids: string[]; target_folder_id: string } }) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
    
    if ((authError || !user) && !isDevelopmentUser) {
      throw new Error('No autorizado');
    }

    const { document_ids, target_folder_id } = parsedInput;

    // Verify target folder exists and user has access
    const { data: targetFolder, error: folderError } = await supabase
      .from('folders')
      .select(`
        *,
        obras!inner(user_id)
      `)
      .eq('id', target_folder_id)
      .eq('obras.user_id', isDevelopmentUser ? undefined : user.id)
      .single();

    if (folderError || !targetFolder) {
      throw new Error('Carpeta destino no encontrada o no autorizada');
    }

    // Verify all documents belong to the same obra as the target folder
    const { data: documents, error: documentsError } = await supabase
      .from('obra_documents')
      .select('id, obra_id')
      .in('id', document_ids)
      .eq('obra_id', targetFolder.obra_id);

    if (documentsError) {
      throw new Error(`Error al verificar documentos: ${documentsError.message}`);
    }

    if (!documents || documents.length !== document_ids.length) {
      throw new Error('Algunos documentos no fueron encontrados o no pertenecen a esta obra');
    }

    // Remove documents from all folders first
    await supabase
      .from('folder_documents')
      .delete()
      .in('document_id', document_ids);

    // Add documents to target folder
    const folderDocumentLinks = document_ids.map(docId => ({
      folder_id: target_folder_id,
      document_id: docId,
    }));

    const { error: linkError } = await supabase
      .from('folder_documents')
      .insert(folderDocumentLinks);

    if (linkError) {
      throw new Error(`Error al mover documentos: ${linkError.message}`);
    }

    revalidatePath(`/obras/${targetFolder.obra_id}`);
    return { 
      success: true, 
      data: { 
        documentIds: document_ids, 
        targetFolderId: target_folder_id,
        targetFolderName: targetFolder.name,
        documentsMovedCount: document_ids.length 
      },
      message: `${document_ids.length} documentos movidos a "${targetFolder.name}"`
    };
  });

// New actions for managing folder-document relationships
export const addDocumentsToFolderAction = action
  .schema(addDocumentsToFolderSchema)
  .action(async ({ parsedInput }: { parsedInput: { folder_id: string; document_ids: string[] } }) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
    
    if ((authError || !user) && !isDevelopmentUser) {
      throw new Error('No autorizado');
    }

    const { folder_id, document_ids } = parsedInput;

    // Verify folder exists and user has access
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select(`
        *,
        obras!inner(user_id)
      `)
      .eq('id', folder_id)
      .eq('obras.user_id', isDevelopmentUser ? undefined : user.id)
      .single();

    if (folderError || !folder) {
      throw new Error('Carpeta no encontrada o no autorizada');
    }

    // Verify documents belong to the same obra
    const { data: documents, error: documentsError } = await supabase
      .from('obra_documents')
      .select('id, obra_id')
      .in('id', document_ids)
      .eq('obra_id', folder.obra_id);

    if (documentsError) {
      throw new Error(`Error al verificar documentos: ${documentsError.message}`);
    }

    if (!documents || documents.length !== document_ids.length) {
      throw new Error('Algunos documentos no fueron encontrados o no pertenecen a esta obra');
    }

    // Add documents to folder (handle conflicts gracefully)
    const folderDocumentLinks = document_ids.map(docId => ({
      folder_id,
      document_id: docId,
    }));

    const { error: linkError } = await supabase
      .from('folder_documents')
      .insert(folderDocumentLinks);

    if (linkError) {
      // If it's a duplicate key error, it's not a real error
      if (linkError.code !== '23505') {
        throw new Error(`Error al agregar documentos a la carpeta: ${linkError.message}`);
      }
    }

    revalidatePath(`/obras/${folder.obra_id}`);
    return { 
      success: true, 
      data: { 
        folderId: folder_id,
        folderName: folder.name,
        documentIds: document_ids,
        documentsAddedCount: document_ids.length 
      },
      message: `${document_ids.length} documentos agregados a "${folder.name}"`
    };
  });

export const removeDocumentsFromFolderAction = action
  .schema(removeDocumentsFromFolderSchema)
  .action(async ({ parsedInput }: { parsedInput: { folder_id: string; document_ids: string[] } }) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
    
    if ((authError || !user) && !isDevelopmentUser) {
      throw new Error('No autorizado');
    }

    const { folder_id, document_ids } = parsedInput;

    // Verify folder exists and user has access
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select(`
        *,
        obras!inner(user_id)
      `)
      .eq('id', folder_id)
      .eq('obras.user_id', isDevelopmentUser ? undefined : user.id)
      .single();

    if (folderError || !folder) {
      throw new Error('Carpeta no encontrada o no autorizada');
    }

    // Remove documents from folder
    const { error: removeError } = await supabase
      .from('folder_documents')
      .delete()
      .eq('folder_id', folder_id)
      .in('document_id', document_ids);

    if (removeError) {
      throw new Error(`Error al remover documentos de la carpeta: ${removeError.message}`);
    }

    revalidatePath(`/obras/${folder.obra_id}`);
    return { 
      success: true, 
      data: { 
        folderId: folder_id,
        folderName: folder.name,
        documentIds: document_ids,
        documentsRemovedCount: document_ids.length 
      },
      message: `${document_ids.length} documentos removidos de "${folder.name}"`
    };
  });

// Get folders for an obra - Updated for new folder system
export async function getObraFolders(obraId: string): Promise<{ folders?: Folder[]; error?: string }> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
  
  if ((authError || !user) && !isDevelopmentUser) {
    return { error: 'No autorizado' };
  }

  // Get folders from the folders table
  const { data: folders, error } = await supabase
    .from('folders')
    .select('*')
    .eq('obra_id', obraId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return { error: `Error al obtener carpetas: ${error.message}` };
  }

  return { folders: folders || [] };
}

// Get documents with folder information using the new view
export async function getObraDocumentsWithFolders(obraId: string): Promise<{ documents?: ObraDocument[]; error?: string; requiresAuth?: boolean }> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // Special bypass for development email
  const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
  
  if ((authError || !user) && !isDevelopmentUser) {
    return { requiresAuth: true };
  }

  // For development user, skip user ownership verification
  if (isDevelopmentUser) {
    const { data: documents, error } = await supabase
      .from('documents_with_folders')
      .select('*')
      .eq('obra_id', obraId)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: `Error al obtener documentos: ${error.message}` };
    }

    return { documents: documents || [] };
  }

  // Normal user flow with user_id filtering
  const { data: documents, error } = await supabase
    .from('documents_with_folders')
    .select(`
      *,
      obras!inner(user_id)
    `)
    .eq('obra_id', obraId)
    .eq('obras.user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: `Error al obtener documentos: ${error.message}` };
  }

  return { documents: documents || [] };
}

// Function to ensure default folders exist for an obra
export async function ensureDefaultFolders(obraId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
  
  if ((authError || !user) && !isDevelopmentUser) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    // Use the SQL function we created (commented out for now)
    // const { error: sqlError } = await supabase.rpc('create_default_folders_for_obra', {
    //   obra_id: obraId,
    //   user_id: user?.id || '00000000-0000-0000-0000-000000000000'
    // });

    // if (sqlError) {
    //   return { success: false, error: `Error creating default folders: ${sqlError.message}` };
    // }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error creating default folders' 
    };
  }
}

// Function to get folder with document count
export async function getFolderWithDocumentCount(folderId: string): Promise<{ folder?: Folder & { documentCount: number }; error?: string }> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  const isDevelopmentUser = user?.email === 'ignacioliotti@gmail.com';
  
  if ((authError || !user) && !isDevelopmentUser) {
    return { error: 'No autorizado' };
  }

  // Get folder with document count
  const { data: result, error } = await supabase
    .from('folders')
    .select(`
      *,
      folder_documents(count),
      obras!inner(user_id)
    `)
    .eq('id', folderId)
    .eq('obras.user_id', isDevelopmentUser ? undefined : user.id)
    .single();

  if (error) {
    return { error: `Error al obtener carpeta: ${error.message}` };
  }

  if (!result) {
    return { error: 'Carpeta no encontrada' };
  }

  const folder = {
    ...result,
    documentCount: Array.isArray(result.folder_documents) ? result.folder_documents.length : (result.folder_documents as any)?.count || 0
  };

  // Remove the folder_documents and obras properties from the response
  delete (folder as any).folder_documents;
  delete (folder as any).obras;

  return { folder };
} 
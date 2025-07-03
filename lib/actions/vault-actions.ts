'use server';

import { createClient } from '@/supabase/server';
import { action } from '@/lib/actions/safe-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const uploadDocumentSchema = z.object({
  obra_id: z.string().uuid(),
  file_name: z.string(),
  file_type: z.string(),
  file_size: z.number(),
  folder: z.string().optional(),
  ocr_content: z.string().optional(),
  description: z.string().optional(),
});

export const uploadDocumentAction = action
  .schema(uploadDocumentSchema)
  .action(async ({ parsedInput }) => {
    try {
      console.log('Upload action started with input:', parsedInput);
      
      const supabase = await createClient();

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log('Auth check result:', { user: user?.id, email: user?.email, authError });

      if (authError || !user) {
        console.error('Auth error:', authError);
        throw new Error('User not authenticated');
      }

      const { obra_id, file_name, file_type, file_size, folder, ocr_content, description } = parsedInput;

      // Generate unique file path
      const fileExt = file_name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = [obra_id, fileName];

      console.log('Generated file path:', filePath);

      // Verify user owns the obra - but be more lenient for development
      console.log('Checking obra ownership for obra_id:', obra_id, 'user_id:', user.id);
      const { data: obra, error: obraError } = await supabase
        .from('obras')
        .select('id, user_id')
        .eq('id', obra_id)
        .single();

      if (obraError) {
        console.error('Obra query error:', obraError);
        throw new Error(`Obra query failed: ${obraError.message}`);
      }

      if (!obra) {
        console.error('Obra not found');
        throw new Error('Obra not found');
      }

      // For development, allow any user to upload to any obra
      const isDevelopmentUser = user.email === 'ignacioliotti@gmail.com';
      if (!isDevelopmentUser && obra.user_id !== user.id) {
        console.error('User does not own the obra');
        throw new Error('You do not have permission to upload to this obra');
      }

      console.log('Obra ownership verified:', obra);

      // Create obra_documents record
      const insertData = {
        obra_id,
        user_id: user.id,
        type: file_type,
        size: file_size,
        name: file_name,
        path: filePath,
        folder: folder || 'Sin Clasificar',
        description: description || null,
        ocr_content: ocr_content || null,
        is_public: false,
        tags: [],
        version: 1,
      };

      console.log('Attempting to insert document record:', insertData);

      const { data, error } = await supabase
        .from('obra_documents')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Insert error details:', error);
        console.error('Error code:', error.code);
        console.error('Error hint:', error.hint);
        console.error('Error details:', error.details);
        throw new Error(`Database insert failed: ${error.message} (Code: ${error.code})`);
      }

      console.log('Document record created successfully:', data);

      revalidatePath('/vault-demo');
      
      return { 
        success: true, 
        data: {
          document: data,
          storagePath: `${obra_id}/${fileName}`
        }
      };
    } catch (error) {
      console.error('Upload action error:', error);
      // Make sure we return a proper error response instead of throwing
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  });

const deleteDocumentSchema = z.object({
  document_id: z.string().uuid(),
  storage_path: z.string(),
});

export const deleteDocumentAction = action
  .schema(deleteDocumentSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { document_id, storage_path } = parsedInput;

    try {
      // Delete from database first
      const { error: dbError } = await supabase
        .from('obra_documents')
        .delete()
        .eq('id', document_id)
        .eq('user_id', user.id); // Ensure user owns the document

      if (dbError) {
        throw dbError;
      }

      // Then delete from storage
      const { error: storageError } = await supabase.storage
        .from('obra-vault')
        .remove([storage_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Don't throw here as the database record is already deleted
      }

      revalidatePath('/vault-demo');
      
      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  });
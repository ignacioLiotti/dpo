'use server';

import { createClient } from '@/supabase/server';
import { action } from '@/lib/actions/safe-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Types
export interface Document {
  id: string;
  name: string;
  description?: string;
  type: string;
  size: number;
  storage_path: string;
  folder: string;
  category?: string;
  tags: string[];
  ocr_content?: string;
  metadata: Record<string, any>;
  is_public: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  sort_order: number;
  is_default: boolean;
  parent_id?: string;
  created_at: string;
  document_count?: number;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon: string;
  fields: any[];
  validation_rules: Record<string, any>;
  default_metadata: Record<string, any>;
  is_system: boolean;
}

// Schemas
const createDocumentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.string().min(1),
  size: z.number().positive(),
  storage_path: z.string().min(1),
  folder: z.string().default('general'),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  is_public: z.boolean().default(false),
});

const updateDocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  folder: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  is_public: z.boolean().optional(),
});

const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().default('#3B82F6'),
  icon: z.string().default('📁'),
  parent_id: z.string().uuid().optional(),
});

const deleteDocumentSchema = z.object({
  id: z.string().uuid(),
});

const uploadDocumentsSchema = z.object({
  obra_id: z.string().uuid(),
  files: z.array(z.object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
    content: z.string(), // base64 content
  })),
  folder_id: z.string().uuid().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

// Actions
export const getDocumentsAction = action
  .schema(z.object({
    folder: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (parsedInput.folder) {
      query = query.eq('folder', parsedInput.folder);
    }

    if (parsedInput.category) {
      query = query.eq('category', parsedInput.category);
    }

    if (parsedInput.search) {
      query = query.or(`name.ilike.%${parsedInput.search}%, ocr_content.ilike.%${parsedInput.search}%`);
    }

    if (parsedInput.limit) {
      query = query.limit(parsedInput.limit);
    }

    if (parsedInput.offset) {
      query = query.range(parsedInput.offset, parsedInput.offset + (parsedInput.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get documents: ${error.message}`);

    return { success: true, data: data || [] };
  });

export const createDocumentAction = action
  .schema(createDocumentSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('documents')
      .insert({
        ...parsedInput,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create document: ${error.message}`);

    revalidatePath('/example-document');
    return { success: true, data };
  });

export const updateDocumentAction = action
  .schema(updateDocumentSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { id, ...updates } = parsedInput;

    const { data, error } = await supabase
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update document: ${error.message}`);

    revalidatePath('/example-document');
    return { success: true, data };
  });

export const deleteDocumentAction = action
  .schema(deleteDocumentSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Soft delete
    const { error } = await supabase
      .from('documents')
      .update({ is_active: false })
      .eq('id', parsedInput.id)
      .eq('user_id', user.id);

    if (error) throw new Error(`Failed to delete document: ${error.message}`);

    revalidatePath('/example-document');
    return { success: true };
  });

export const getFoldersAction = action
  .schema(z.object({}))
  .action(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: folders, error } = await supabase
      .from('document_folders')
      .select(`
        *,
        documents!inner(count)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw new Error(`Failed to get folders: ${error.message}`);

    return {
      success: true,
      data: folders?.map(folder => ({
        ...folder,
        document_count: folder.documents?.[0]?.count || 0
      })) || []
    };
  });

export const createFolderAction = action
  .schema(createFolderSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('document_folders')
      .insert({
        ...parsedInput,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create folder: ${error.message}`);

    revalidatePath('/example-document');
    return { success: true, data };
  });

export const getTemplatesAction = action
  .schema(z.object({
    category: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    let query = supabase
      .from('document_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (parsedInput.category) {
      query = query.eq('category', parsedInput.category);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get templates: ${error.message}`);

    return { success: true, data: data || [] };
  });

export const getDocumentStatsAction = action
  .schema(z.object({}))
  .action(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Get total documents
    const { count: totalDocuments } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Get total folders
    const { count: totalFolders } = await supabase
      .from('document_folders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Get total size
    const { data: sizeData } = await supabase
      .from('documents')
      .select('size')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const totalSize = sizeData?.reduce((sum, doc) => sum + (doc.size || 0), 0) || 0;

    // Get recent documents
    const { data: recentDocuments } = await supabase
      .from('documents')
      .select('id, name, created_at, type, folder')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      success: true,
      data: {
        totalDocuments: totalDocuments || 0,
        totalFolders: totalFolders || 0,
        totalSize,
        recentDocuments: recentDocuments || [],
      }
    };
  });

export const getDocumentByIdAction = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', parsedInput.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error) throw new Error(`Failed to get document: ${error.message}`);

    return { success: true, data };
  });

export const createDefaultDocumentAction = action
  .schema(z.object({}))
  .action(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if user already has documents
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (count && count > 0) {
      return { success: true, message: 'User already has documents' };
    }

    // Create default folder
    const { data: folder } = await supabase
      .from('document_folders')
      .insert({
        name: 'Getting Started',
        description: 'Your first folder to organize documents',
        color: '#10B981',
        icon: '🚀',
        is_default: true,
        user_id: user.id,
      })
      .select()
      .single();

    // Create a sample document
    const { data: document } = await supabase
      .from('documents')
      .insert({
        name: 'Welcome Document.md',
        description: 'A sample document to help you get started',
        type: 'text/markdown',
        size: 1024,
        storage_path: `${user.id}/welcome-document.md`,
        folder: 'getting-started',
        category: 'general',
        tags: ['sample', 'welcome'],
        metadata: {
          template: 'General Document',
          title: 'Welcome to Your Document System',
          author: 'System',
          content: `# Welcome to Your Document System

This is a sample document to help you get started with the document management system.

## Features
- Upload and organize documents
- Extract data using AI/OCR
- Create custom folders
- Tag and categorize documents
- Search through content

## Getting Started
1. Upload your first document
2. Organize it into folders
3. Use the search functionality
4. Try the data extraction features

Happy organizing! 🎉`
        },
        is_public: false,
        user_id: user.id,
      })
      .select()
      .single();

    revalidatePath('/example-document');
    return { 
      success: true, 
      data: { folder, document },
      message: 'Default document and folder created successfully'
    };
  });

// =================================================================
// OBRA-SPECIFIC DOCUMENT FUNCTIONS (for backward compatibility)
// =================================================================

export async function getObraDocumentsWithFolders(obraId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  try {
    // Get obra documents
    const { data: documents, error: documentsError } = await supabase
      .from('obra_documents')
      .select(`
        *,
        folders(*)
      `)
      .eq('obra_id', obraId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (documentsError) {
      console.error('Failed to get obra documents:', documentsError);
      return { documents: [] };
    }

    return { documents: documents || [] };
  } catch (error) {
    console.error('Error in getObraDocumentsWithFolders:', error);
    return { documents: [] };
  }
}

export async function getObraFolders(obraId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  try {
    // Get obra folders
    const { data: folders, error: foldersError } = await supabase
      .from('folders')
      .select('*')
      .eq('obra_id', obraId)
      .eq('user_id', user.id)
      .order('sort_order');

    if (foldersError) {
      console.error('Failed to get obra folders:', foldersError);
      return { folders: [] };
    }

    return { folders: folders || [] };
  } catch (error) {
    console.error('Error in getObraFolders:', error);
    return { folders: [] };
  }
}

// Upload documents action for obra files
export const uploadDocumentsAction = action
  .schema(uploadDocumentsSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { obra_id, files, folder_id, category, description } = parsedInput;

    try {
      // Verify user owns the obra
      const { data: obra, error: obraError } = await supabase
        .from('obras')
        .select('id, user_id')
        .eq('id', obra_id)
        .eq('user_id', user.id)
        .single();

      if (obraError || !obra) {
        throw new Error('Obra not found or you do not have permission');
      }

      const uploadedDocuments = [];
      const errors = [];

      for (const file of files) {
        try {
          // Generate storage path
          const timestamp = Date.now();
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storagePath = `${user.id}/${obra_id}/${timestamp}_${sanitizedName}`;

          // Upload file to storage
          const fileBuffer = Buffer.from(file.content, 'base64');
          const { error: uploadError } = await supabase.storage
            .from('obra-vault')
            .upload(storagePath, fileBuffer, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) {
            errors.push({ file: file.name, error: uploadError.message });
            continue;
          }

          // Create document record
          const { data: document, error: docError } = await supabase
            .from('obra_documents')
            .insert({
              name: file.name,
              type: file.type,
              size: file.size,
              path: storagePath,
              obra_id: obra_id,
              user_id: user.id,
              folder: folder_id || 'sin-clasificar',
              category: category || 'otros',
              description: description,
              checksum: null, // Could calculate MD5 if needed
              is_public: false,
              version: 1,
            })
            .select()
            .single();

          if (docError) {
            errors.push({ file: file.name, error: docError.message });
            // Clean up uploaded file
            await supabase.storage.from('obra-vault').remove([storagePath]);
            continue;
          }

          uploadedDocuments.push(document);
        } catch (fileError) {
          errors.push({ 
            file: file.name, 
            error: fileError instanceof Error ? fileError.message : 'Unknown error' 
          });
        }
      }

      revalidatePath(`/obras/${obra_id}`);
      
      return {
        success: true,
        data: {
          uploaded: uploadedDocuments,
          errors: errors,
          totalFiles: files.length,
          successCount: uploadedDocuments.length,
          errorCount: errors.length,
        }
      };
    } catch (error) {
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
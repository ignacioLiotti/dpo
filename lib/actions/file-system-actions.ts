'use server';

import { createClient } from '@/supabase/server';
import { action } from '@/lib/actions/safe-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Types
export interface UserFolder {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  file_count?: number;
}

export interface UserFile {
  id: string;
  name: string;
  type: string;
  size: number;
  folder_id?: string;
  description?: string;
  ocr_content?: string;
  category?: string;
  created_at: string;
}

export interface FieldDefinition {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  extraction_pattern: string;
  sort_order: number;
}

export interface ExtractedData {
  field_name: string;
  field_label: string;
  extracted_value: string | null;
  confidence_score: number;
}

export interface FileData {
  file: UserFile;
  extracted_data: ExtractedData[];
}

// Schemas
const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const createFieldSchema = z.object({
  folder_id: z.string().uuid(),
  field_name: z.string().min(1),
  field_label: z.string().min(1),
  field_type: z.enum(['text', 'number', 'date', 'currency', 'boolean', 'email', 'phone']),
  extraction_pattern: z.string().min(1),
});

const extractDataSchema = z.object({
  file_id: z.string().uuid(),
});

// Actions
export const getFoldersAction = action
  .schema(z.object({}))
  .action(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: folders, error } = await supabase
      .from('user_folders')
      .select(`
        *,
        user_files()
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    console.log('folders', folders)

    if (error) throw new Error(`Failed to get folders: ${error.message}`);

    return {
      success: true,
      data: folders?.map(folder => ({
        ...folder,
        file_count: folder.user_files?.[0]?.count || 0
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
      .from('user_folders')
      .insert({
        ...parsedInput,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create folder: ${error.message}`);

    revalidatePath('/files');
    return { success: true, data };
  });

export const getFilesAction = action
  .schema(z.object({ folder_id: z.string().uuid().optional() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('user_files')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (parsedInput.folder_id) {
      query = query.eq('folder_id', parsedInput.folder_id);
    } else {
      query = query.is('folder_id', null);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get files: ${error.message}`);

    return { success: true, data: data || [] };
  });

export const getTabularDataForFolderAction = action
  .schema(z.object({ folder_id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Get field definitions for the folder
    const { data: fields, error: fieldsError } = await supabase
      .from('folder_field_definitions_new')
      .select('*')
      .eq('folder_id', parsedInput.folder_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order');

    if (fieldsError) throw new Error(`Failed to get field definitions: ${fieldsError.message}`);

    if (!fields || fields.length === 0) {
      return {
        success: true,
        data: { fields: [], files: [], totalFiles: 0, totalFields: 0 }
      };
    }

    // Get files and their extracted data
    const { data: extractedData, error: dataError } = await supabase
      .from('file_extracted_data')
      .select(`
        *,
        user_files!inner(
          id,
          name,
          created_at,
          folder_id
        ),
        folder_field_definitions_new!inner(
          field_name,
          field_label,
          field_type
        )
      `)
      .eq('user_files.folder_id', parsedInput.folder_id)
      .eq('user_id', user.id);

    if (dataError) throw new Error(`Failed to get extracted data: ${dataError.message}`);

    // Transform to tabular format
    const fileMap = new Map<string, any>();
    
    if (extractedData) {
      for (const extraction of extractedData) {
        const fileId = extraction.user_files.id;
        
        if (!fileMap.has(fileId)) {
          fileMap.set(fileId, {
            file_id: fileId,
            file_name: extraction.user_files.name,
            file_date: new Date(extraction.user_files.created_at).toLocaleDateString(),
          });
        }
        
        const fileRow = fileMap.get(fileId);
        fileRow[extraction.folder_field_definitions_new.field_name] = extraction.extracted_value;
      }
    }

    // Get all files in folder (including those without extracted data)
    const { data: allFiles, error: filesError } = await supabase
      .from('user_files')
      .select('id, name, created_at')
      .eq('folder_id', parsedInput.folder_id)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (filesError) throw new Error(`Failed to get all files: ${filesError.message}`);

    // Ensure all files are represented
    if (allFiles) {
      for (const file of allFiles) {
        if (!fileMap.has(file.id)) {
          const fileRow: any = {
            file_id: file.id,
            file_name: file.name,
            file_date: new Date(file.created_at).toLocaleDateString(),
          };
          
          // Initialize all fields as null
          fields.forEach(field => {
            fileRow[field.field_name] = null;
          });
          
          fileMap.set(file.id, fileRow);
        }
      }
    }

    return {
      success: true,
      data: {
        fields: fields.map(f => ({
          field_name: f.field_name,
          field_label: f.field_label,
          field_type: f.field_type
        })),
        files: Array.from(fileMap.values()),
        totalFiles: fileMap.size,
        totalFields: fields.length
      }
    };
  });

export const createFieldDefinitionAction = action
  .schema(createFieldSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('folder_field_definitions_new')
      .insert({
        ...parsedInput,
        user_id: user.id,
        sort_order: 0,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create field definition: ${error.message}`);

    revalidatePath('/files');
    return { success: true, data };
  });

export const exportTabularDataAction = action
  .schema(z.object({ folder_id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const result = await getTabularDataForFolderAction({ parsedInput });
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get tabular data');
    }

    const { fields, files } = result.data;

    // Create CSV content
    const headers = ['File Name', 'Date', ...fields.map((f: any) => f.field_label)];
    const csvRows = files.map((file: any) => [
      `"${file.file_name}"`,
      file.file_date,
      ...fields.map((field: any) => {
        const value = file[field.field_name];
        return value ? `"${value}"` : '';
      })
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    return {
      success: true,
      csvContent,
      filename: `folder-data-${new Date().toISOString().split('T')[0]}.csv`,
    };
  });
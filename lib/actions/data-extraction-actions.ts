'use server';

import { createClient } from '@/supabase/server';
import { action } from '@/lib/actions/safe-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { DataExtractionEngine, type FieldDefinition, type ExtractionContext } from '../services/data-extraction-engine';

// Schema for creating field definitions
const createFieldDefinitionSchema = z.object({
  obra_id: z.string().uuid(),
  folder_name: z.string().min(1),
  field_name: z.string().min(1),
  field_type: z.enum(['text', 'number', 'date', 'currency', 'boolean', 'email', 'phone']),
  field_label: z.string().min(1),
  field_description: z.string().optional(),
  extraction_method: z.enum(['regex', 'ai', 'hybrid']),
  extraction_pattern: z.string().min(1),
  validation_pattern: z.string().optional(),
  is_required: z.boolean().default(false),
  default_value: z.string().optional(),
  sort_order: z.number().default(0),
});

// Schema for updating field definitions
const updateFieldDefinitionSchema = z.object({
  id: z.string().uuid(),
  field_label: z.string().min(1).optional(),
  field_description: z.string().optional(),
  extraction_pattern: z.string().min(1).optional(),
  validation_pattern: z.string().optional(),
  is_required: z.boolean().optional(),
  default_value: z.string().optional(),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
});

// Schema for running extraction on a document
const extractDocumentDataSchema = z.object({
  document_id: z.string().uuid(),
  force_reextraction: z.boolean().default(false),
});

// Schema for bulk template application
const applyTemplateSchema = z.object({
  obra_id: z.string().uuid(),
  folder_name: z.string().min(1),
  template_name: z.enum(['invoices', 'contracts', 'permits']),
});

export const createFieldDefinitionAction = action
  .schema(createFieldDefinitionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { obra_id, ...fieldData } = parsedInput;

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

      // Create field definition
      const { data, error } = await supabase
        .from('folder_field_definitions')
        .insert({
          obra_id,
          ...fieldData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Full error object:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to create field definition: ${error.message || error.details || JSON.stringify(error)}`);
      }

      revalidatePath('/vault-demo');
      
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Create field definition error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });

export const updateFieldDefinitionAction = action
  .schema(updateFieldDefinitionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { id, ...updateData } = parsedInput;

      // Update field definition (RLS will ensure user owns it)
      const { data, error } = await supabase
        .from('folder_field_definitions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Update field definition error object:', error);
        throw new Error(`Failed to update field definition: ${error.message || error.details || JSON.stringify(error)}`);
      }

      revalidatePath('/vault-demo');
      
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Update field definition error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });

export const deleteFieldDefinitionAction = action
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { id } = parsedInput;

      // Delete field definition (RLS will ensure user owns it)
      const { error } = await supabase
        .from('folder_field_definitions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Delete field definition error object:', error);
        throw new Error(`Failed to delete field definition: ${error.message || error.details || JSON.stringify(error)}`);
      }

      revalidatePath('/vault-demo');
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('Delete field definition error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });

export const extractDocumentDataAction = action
  .schema(extractDocumentDataSchema)
  .action(async ({ parsedInput }) => {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { document_id, force_reextraction } = parsedInput;

      // Get document details
      const { data: document, error: docError } = await supabase
        .from('obra_documents')
        .select(`
          *,
          obras!inner(id, user_id)
        `)
        .eq('id', document_id)
        .single();

      if (docError || !document) {
        throw new Error('Document not found');
      }

      // Verify user owns the obra
      if (document.obras.user_id !== user.id) {
        throw new Error('You do not have permission to access this document');
      }

      // Check if extraction already exists and we're not forcing re-extraction
      if (!force_reextraction) {
        const { data: existingData } = await supabase
          .from('document_extracted_data')
          .select('id')
          .eq('document_id', document_id)
          .limit(1);

        if (existingData && existingData.length > 0) {
          return {
            success: true,
            message: 'Data already extracted for this document',
          };
        }
      }

      // Get field definitions for this folder
      const { data: fieldDefinitions, error: fieldsError } = await supabase
        .from('folder_field_definitions')
        .select('*')
        .eq('obra_id', document.obra_id)
        .eq('folder_name', document.folder)
        .eq('is_active', true)
        .order('sort_order');

      if (fieldsError) {
        throw new Error(`Failed to get field definitions: ${fieldsError.message}`);
      }

      if (!fieldDefinitions || fieldDefinitions.length === 0) {
        return {
          success: true,
          message: 'No field definitions found for this folder',
          extractedCount: 0,
        };
      }

      // Create extraction context
      const context: ExtractionContext = {
        document_text: document.ocr_content || '',
        ocr_text: document.ocr_content || '',
        file_name: document.name,
        file_type: document.type,
        folder_name: document.folder,
      };

      // Run extraction
      const extractionEngine = new DataExtractionEngine();
      const results = await extractionEngine.extractFields(
        fieldDefinitions as FieldDefinition[],
        context
      );

      // Delete existing extractions if force re-extraction
      if (force_reextraction) {
        await supabase
          .from('document_extracted_data')
          .delete()
          .eq('document_id', document_id);
      }

      // Save extraction results
      const extractionRecords = results.map(result => ({
        document_id,
        field_definition_id: fieldDefinitions.find(f => f.field_name === result.field_name)?.id,
        extracted_value: result.extracted_value,
        confidence_score: result.confidence_score,
        extraction_method_used: result.extraction_method_used,
        raw_extracted_text: result.raw_extracted_text,
        is_verified: false,
      })).filter(record => record.field_definition_id); // Only include valid field definitions

      if (extractionRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('document_extracted_data')
          .insert(extractionRecords);

        if (insertError) {
          throw new Error(`Failed to save extraction results: ${insertError.message}`);
        }
      }

      revalidatePath('/vault-demo');
      
      return {
        success: true,
        extractedCount: extractionRecords.length,
        results: results,
      };
    } catch (error) {
      console.error('Extract document data error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });

export const applyTemplateAction = action
  .schema(applyTemplateSchema)
  .action(async ({ parsedInput }) => {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { obra_id, folder_name, template_name } = parsedInput;

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

      // Import template fields
      console.log('Importing templates for:', template_name);
      const { FIELD_TEMPLATES } = await import('../services/data-extraction-engine');
      console.log('Available templates:', Object.keys(FIELD_TEMPLATES));
      const templateFields = FIELD_TEMPLATES[template_name];
      console.log('Selected template fields:', templateFields);

      if (!templateFields) {
        throw new Error(`Template '${template_name}' not found. Available: ${Object.keys(FIELD_TEMPLATES).join(', ')}`);
      }

      // Create field definitions from template
      const fieldDefinitions = templateFields.map((field, index) => ({
        obra_id,
        folder_name,
        ...field,
        sort_order: index,
        user_id: user.id,
      }));
      
      console.log('Field definitions to insert:', fieldDefinitions);

      const { data, error } = await supabase
        .from('folder_field_definitions')
        .insert(fieldDefinitions)
        .select();

      if (error) {
        console.error('Template application error object:', error);
        console.error('Template error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to apply template: ${error.message || error.details || JSON.stringify(error)}`);
      }

      revalidatePath('/vault-demo');
      
      return {
        success: true,
        data: data,
        createdCount: data.length,
      };
    } catch (error) {
      console.error('Apply template error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });

export const getFieldDefinitionsAction = action
  .schema(z.object({
    obra_id: z.string().uuid(),
    folder_name: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { obra_id, folder_name } = parsedInput;

      let query = supabase
        .from('folder_field_definitions')
        .select('*')
        .eq('obra_id', obra_id)
        .eq('is_active', true)
        .order('folder_name')
        .order('sort_order');

      if (folder_name) {
        query = query.eq('folder_name', folder_name);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get field definitions: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Get field definitions error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });

export const getExtractedDataAction = action
  .schema(z.object({
    document_id: z.string().uuid().optional(),
    obra_id: z.string().uuid().optional(),
    folder_name: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { document_id, obra_id, folder_name } = parsedInput;

      let query = supabase
        .from('document_extracted_data')
        .select(`
          *,
          folder_field_definitions(*),
          obra_documents(*)
        `);

      if (document_id) {
        query = query.eq('document_id', document_id);
      } else if (obra_id) {
        query = query
          .eq('obra_documents.obra_id', obra_id);
        
        if (folder_name) {
          query = query.eq('obra_documents.folder', folder_name);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get extracted data: ${error.message}`);
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Get extracted data error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });

// Schema for preview extraction (without saving to database)
const previewExtractionSchema = z.object({
  obra_id: z.string().uuid(),
  folder_name: z.string(),
  ocr_text: z.string(),
  file_name: z.string(),
  file_type: z.string(),
});

export const previewDataExtractionAction = action
  .schema(previewExtractionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { obra_id, folder_name, ocr_text, file_name, file_type } = parsedInput;

      // Get field definitions for this folder
      const { data: fieldDefinitions, error: fieldsError } = await supabase
        .from('folder_field_definitions')
        .select('*')
        .eq('obra_id', obra_id)
        .eq('folder_name', folder_name)
        .eq('is_active', true)
        .order('sort_order');

      if (fieldsError) {
        throw new Error(`Failed to get field definitions: ${fieldsError.message}`);
      }

      if (!fieldDefinitions || fieldDefinitions.length === 0) {
        return {
          success: true,
          message: 'No field definitions found for this folder',
          results: [],
        };
      }

      // Create extraction context
      const context: ExtractionContext = {
        document_text: ocr_text,
        ocr_text: ocr_text,
        file_name: file_name,
        file_type: file_type,
        folder_name: folder_name,
      };

      // Run extraction
      const extractionEngine = new DataExtractionEngine();
      const results = await extractionEngine.extractFields(
        fieldDefinitions as FieldDefinition[],
        context
      );

      return {
        success: true,
        results: results,
        fieldCount: fieldDefinitions.length,
      };
    } catch (error) {
      console.error('Preview extraction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });

// Schema for saving manually edited extraction data
const saveEditedDataSchema = z.object({
  document_id: z.string().uuid(),
  extracted_data: z.array(z.object({
    field_name: z.string(),
    extracted_value: z.string().nullable(),
    confidence_score: z.number().min(0).max(1),
    extraction_method_used: z.string(),
    raw_extracted_text: z.string(),
  })),
});

export const saveEditedExtractionDataAction = action
  .schema(saveEditedDataSchema)
  .action(async ({ parsedInput }) => {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { document_id, extracted_data } = parsedInput;

      // Get document details to verify ownership
      const { data: document, error: docError } = await supabase
        .from('obra_documents')
        .select(`
          *,
          obras!inner(id, user_id)
        `)
        .eq('id', document_id)
        .single();

      if (docError || !document) {
        throw new Error('Document not found');
      }

      // Verify user owns the obra
      if (document.obras.user_id !== user.id) {
        throw new Error('You do not have permission to access this document');
      }

      // Get field definitions to map field names to IDs
      const { data: fieldDefinitions, error: fieldsError } = await supabase
        .from('folder_field_definitions')
        .select('*')
        .eq('obra_id', document.obra_id)
        .eq('folder_name', document.folder)
        .eq('is_active', true);

      if (fieldsError) {
        throw new Error(`Failed to get field definitions: ${fieldsError.message}`);
      }

      // Delete existing extractions for this document
      await supabase
        .from('document_extracted_data')
        .delete()
        .eq('document_id', document_id);

      // Create extraction records from edited data
      const extractionRecords = extracted_data.map(data => {
        const fieldDef = fieldDefinitions?.find(f => f.field_name === data.field_name);
        return {
          document_id,
          field_definition_id: fieldDef?.id,
          extracted_value: data.extracted_value,
          confidence_score: data.confidence_score,
          extraction_method_used: data.extraction_method_used + '_edited',
          raw_extracted_text: data.raw_extracted_text,
          is_verified: true, // Mark as verified since user edited it
        };
      }).filter(record => record.field_definition_id); // Only include valid field definitions

      if (extractionRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('document_extracted_data')
          .insert(extractionRecords);

        if (insertError) {
          throw new Error(`Failed to save extraction results: ${insertError.message || JSON.stringify(insertError)}`);
        }
      }

      revalidatePath('/vault-demo');
      
      return {
        success: true,
        savedCount: extractionRecords.length,
      };
    } catch (error) {
      console.error('Save edited extraction data error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });
'use server';

import { createClient } from '@/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { extractStructuredData } from '../services/document-processor';

// Default field definitions for invoice/document extraction
const DEFAULT_FIELD_DEFINITIONS = [
  {
    field_name: 'document_type',
    field_type: 'text' as const,
    field_label: 'Tipo de Documento',
    field_description: 'Tipo de documento (factura, contrato, etc.)',
    extraction_method: 'ai' as const,
    extraction_pattern: 'Identify the document type from the content',
    sort_order: 0
  },
  {
    field_name: 'document_number',
    field_type: 'text' as const,
    field_label: 'Número de Documento',
    field_description: 'Número de identificación del documento',
    extraction_method: 'ai' as const,
    extraction_pattern: 'Extract the document number or invoice number',
    sort_order: 1
  },
  {
    field_name: 'date',
    field_type: 'date' as const,
    field_label: 'Fecha',
    field_description: 'Fecha del documento',
    extraction_method: 'ai' as const,
    extraction_pattern: 'Extract the main date from the document',
    sort_order: 2
  },
  {
    field_name: 'amount',
    field_type: 'currency' as const,
    field_label: 'Monto',
    field_description: 'Monto total del documento',
    extraction_method: 'ai' as const,
    extraction_pattern: 'Extract the total amount or price',
    sort_order: 3
  },
  {
    field_name: 'supplier_name',
    field_type: 'text' as const,
    field_label: 'Proveedor/Emisor',
    field_description: 'Nombre del proveedor o emisor del documento',
    extraction_method: 'ai' as const,
    extraction_pattern: 'Extract the supplier or issuer name',
    sort_order: 4
  }
];

// Schema for field definitions
const createFieldDefinitionSchema = z.object({
  folder_id: z.string().uuid(),
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

// Schema for enabling extraction on folder
const toggleFolderExtractionSchema = z.object({
  folder_id: z.string().uuid(),
  enable_extraction: z.boolean(),
});

// Schema for extracting data from document
const extractDocumentDataSchema = z.object({
  document_id: z.string().uuid(),
  force_reextraction: z.boolean().default(false),
});

// Create default field definitions for a folder
export async function createDefaultFieldDefinitions(folderId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Get folder to validate ownership
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('id, organization_id, user_id')
      .eq('id', folderId)
      .eq('user_id', user.id)
      .single();

    if (folderError || !folder) {
      throw new Error('Folder not found or you do not have permission');
    }

    // Check if field definitions already exist
    const { data: existingFields, error: existingError } = await supabase
      .from('folder_field_definitions')
      .select('field_name')
      .eq('folder_id', folderId);

    if (existingError) {
      console.error('Error checking existing field definitions:', existingError);
      throw new Error(`Failed to check existing field definitions: ${existingError.message}`);
    }

    const existingFieldNames = new Set(existingFields?.map(f => f.field_name) || []);
    console.log(`Found ${existingFieldNames.size} existing field definitions:`, Array.from(existingFieldNames));

    // Only create fields that don't already exist
    const newFieldDefinitions = DEFAULT_FIELD_DEFINITIONS
      .filter(def => !existingFieldNames.has(def.field_name))
      .map(def => ({
        ...def,
        folder_id: folderId,
        organization_id: folder.organization_id,
        user_id: user.id,
        is_active: true
      }));

    if (newFieldDefinitions.length === 0) {
      console.log(`All default field definitions already exist for folder ${folderId}`);
      
      // Ensure existing fields are active
      const { error: updateError } = await supabase
        .from('folder_field_definitions')
        .update({ is_active: true })
        .eq('folder_id', folderId);

      if (updateError) {
        console.error('Error activating existing field definitions:', updateError);
      }

      return { success: true, fieldDefinitions: existingFields, message: 'Field definitions already exist and have been activated' };
    }

    const { data, error } = await supabase
      .from('folder_field_definitions')
      .insert(newFieldDefinitions)
      .select();

    if (error) {
      console.error('Error creating new field definitions:', error);
      throw new Error(`Failed to create field definitions: ${error.message}`);
    }

    console.log(`Created ${data.length} new field definitions for folder ${folderId}`);
    return { success: true, fieldDefinitions: data, message: `Created ${data.length} new field definitions` };
  } catch (error) {
    console.error('Create default field definitions error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create default field definitions');
  }
}

// Get field definitions for a folder
export async function getFolderFieldDefinitions(folderId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: fields, error } = await supabase
      .from('folder_field_definitions')
      .select('*')
      .eq('folder_id', folderId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching field definitions:', error);
      return { fields: [], error: error.message };
    }

    return { fields: fields || [], error: null };
  } catch (error) {
    console.error('Error in getFolderFieldDefinitions:', error);
    return { fields: [], error: 'Failed to fetch field definitions' };
  }
}

// Create field definition for folder
export async function createFolderFieldDefinition(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Extract and validate form data
    const rawData = {
      folder_id: formData.get('folder_id') as string,
      field_name: formData.get('field_name') as string,
      field_type: formData.get('field_type') as string,
      field_label: formData.get('field_label') as string,
      field_description: formData.get('field_description') as string || undefined,
      extraction_method: formData.get('extraction_method') as string,
      extraction_pattern: formData.get('extraction_pattern') as string,
      validation_pattern: formData.get('validation_pattern') as string || undefined,
      is_required: formData.get('is_required') === 'true',
      default_value: formData.get('default_value') as string || undefined,
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
    };

    const validatedData = createFieldDefinitionSchema.parse(rawData);

    // Verify user owns the folder
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('id, organization_id, user_id')
      .eq('id', validatedData.folder_id)
      .eq('user_id', user.id)
      .single();

    if (folderError || !folder) {
      throw new Error('Folder not found or you do not have permission');
    }

    // Create field definition
    const { data, error } = await supabase
      .from('folder_field_definitions')
      .insert({
        ...validatedData,
        user_id: user.id,
        organization_id: folder.organization_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating field definition:', error);
      throw new Error(`Failed to create field definition: ${error.message}`);
    }

    revalidatePath(`/obra-files`);
    
    return { success: true, data };
  } catch (error) {
    console.error('Create field definition error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create field definition');
  }
}

// Toggle extraction feature for folder
export async function toggleFolderExtraction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const rawData = {
      folder_id: formData.get('folder_id') as string,
      enable_extraction: formData.get('enable_extraction') === 'true',
    };

    const validatedData = toggleFolderExtractionSchema.parse(rawData);

    // Update folder extraction setting
    const { data, error } = await supabase
      .from('folders')
      .update({
        extract_data: validatedData.enable_extraction,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.folder_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling extraction:', error);
      throw new Error(`Failed to toggle extraction: ${error.message}`);
    }

    revalidatePath(`/obra-files`);
    
    return { success: true, data };
  } catch (error) {
    console.error('Toggle extraction error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to toggle extraction');
  }
}

// Extract structured data from document
export async function extractDocumentData(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const rawData = {
      document_id: formData.get('document_id') as string,
      force_reextraction: formData.get('force_reextraction') === 'true',
    };

    const validatedData = extractDocumentDataSchema.parse(rawData);

    // Get document with OCR content
    const { data: document, error: docError } = await supabase
      .from('documents_with_folders')
      .select('*')
      .eq('id', validatedData.document_id)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      throw new Error('Document not found or access denied');
    }

    if (!document.folder_id) {
      throw new Error('Document is not in a folder with extraction enabled');
    }

    // Get field definitions for the folder
    const { fields, error: fieldsError } = await getFolderFieldDefinitions(document.folder_id);
    
    if (fieldsError || fields.length === 0) {
      throw new Error('No field definitions found for this folder');
    }

    // Check if extraction is enabled for this folder
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('extract_data')
      .eq('id', document.folder_id)
      .single();

    if (folderError || !folder?.extract_data) {
      throw new Error('Data extraction is not enabled for this folder');
    }

    // Extract structured data using OCR content
    const ocrText = document.ocr_content || '';
    if (!ocrText) {
      throw new Error('No OCR content available for this document');
    }

    const extractionResult = await extractStructuredData(
      ocrText,
      fields,
      document.name,
      document.type || 'application/pdf'
    );

    // For now, skip saving to extracted_data table as it requires extraction_config_id
    // which would need to be set up properly for structured field-based extraction
    console.log('Structured data extraction completed', {
      fieldCount: extractionResult.fieldCount,
      confidence: extractionResult.confidence,
      documentId: validatedData.document_id
    });

    revalidatePath(`/obra-files`);
    
    return { 
      success: true, 
      data: extractionResult
    };
  } catch (error) {
    console.error('Extract document data error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to extract document data');
  }
}

// Apply template to folder (predefined field sets)
export async function applyExtractionTemplate(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const folderId = formData.get('folder_id') as string;
    const templateName = formData.get('template_name') as string;

    const templates = {
      invoice: [
        {
          field_name: 'invoice_number',
          field_type: 'text',
          field_label: 'Número de Factura',
          extraction_method: 'hybrid',
          extraction_pattern: '(?:factura|invoice)\\s*#?\\s*([A-Z0-9-]+)',
          is_required: true,
          sort_order: 1,
        },
        {
          field_name: 'total_amount',
          field_type: 'currency',
          field_label: 'Monto Total',
          extraction_method: 'ai',
          extraction_pattern: 'Encuentra el monto total de esta factura',
          is_required: true,
          sort_order: 2,
        },
        {
          field_name: 'invoice_date',
          field_type: 'date',
          field_label: 'Fecha de Factura',
          extraction_method: 'hybrid',
          extraction_pattern: '(?:fecha|date):\\s*(\\d{1,2}[/-]\\d{1,2}[/-]\\d{4})',
          is_required: true,
          sort_order: 3,
        },
        {
          field_name: 'vendor_name',
          field_type: 'text',
          field_label: 'Proveedor',
          extraction_method: 'ai',
          extraction_pattern: 'Encuentra el nombre del proveedor o empresa que emite esta factura',
          is_required: false,
          sort_order: 4,
        },
      ],
      contract: [
        {
          field_name: 'contract_number',
          field_type: 'text',
          field_label: 'Número de Contrato',
          extraction_method: 'hybrid',
          extraction_pattern: '(?:contrato|contract)\\s*#?\\s*([A-Z0-9-]+)',
          is_required: true,
          sort_order: 1,
        },
        {
          field_name: 'contract_amount',
          field_type: 'currency',
          field_label: 'Monto del Contrato',
          extraction_method: 'ai',
          extraction_pattern: 'Encuentra el monto total del contrato',
          is_required: true,
          sort_order: 2,
        },
        {
          field_name: 'start_date',
          field_type: 'date',
          field_label: 'Fecha de Inicio',
          extraction_method: 'ai',
          extraction_pattern: 'Encuentra la fecha de inicio del contrato',
          is_required: false,
          sort_order: 3,
        },
        {
          field_name: 'end_date',
          field_type: 'date',
          field_label: 'Fecha de Finalización',
          extraction_method: 'ai',
          extraction_pattern: 'Encuentra la fecha de finalización del contrato',
          is_required: false,
          sort_order: 4,
        },
        {
          field_name: 'contractor_name',
          field_type: 'text',
          field_label: 'Contratista',
          extraction_method: 'ai',
          extraction_pattern: 'Encuentra el nombre del contratista',
          is_required: false,
          sort_order: 5,
        },
      ],
      permit: [
        {
          field_name: 'permit_number',
          field_type: 'text',
          field_label: 'Número de Permiso',
          extraction_method: 'hybrid',
          extraction_pattern: '(?:permiso|permit)\\s*#?\\s*([A-Z0-9-]+)',
          is_required: true,
          sort_order: 1,
        },
        {
          field_name: 'issue_date',
          field_type: 'date',
          field_label: 'Fecha de Emisión',
          extraction_method: 'ai',
          extraction_pattern: 'Encuentra la fecha de emisión del permiso',
          is_required: false,
          sort_order: 2,
        },
        {
          field_name: 'expiry_date',
          field_type: 'date',
          field_label: 'Fecha de Vencimiento',
          extraction_method: 'ai',
          extraction_pattern: 'Encuentra la fecha de vencimiento del permiso',
          is_required: false,
          sort_order: 3,
        },
        {
          field_name: 'issuing_authority',
          field_type: 'text',
          field_label: 'Autoridad Emisora',
          extraction_method: 'ai',
          extraction_pattern: 'Encuentra la autoridad que emite este permiso',
          is_required: false,
          sort_order: 4,
        },
      ],
    };

    const template = templates[templateName as keyof typeof templates];
    if (!template) {
      throw new Error('Template not found');
    }

    // Get folder to verify ownership
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('organization_id')
      .eq('id', folderId)
      .eq('user_id', user.id)
      .single();

    if (folderError || !folder) {
      throw new Error('Folder not found or access denied');
    }

    // Insert template fields
    const fieldsToInsert = template.map(field => ({
      ...field,
      folder_id: folderId,
      user_id: user.id,
      organization_id: folder.organization_id,
    }));

    const { data, error } = await supabase
      .from('folder_field_definitions')
      .insert(fieldsToInsert)
      .select();

    if (error) {
      console.error('Error applying template:', error);
      throw new Error(`Failed to apply template: ${error.message}`);
    }

    // Enable extraction for the folder
    await supabase
      .from('folders')
      .update({ extract_data: true })
      .eq('id', folderId);

    revalidatePath(`/obra-files`);
    
    return { success: true, data };
  } catch (error) {
    console.error('Apply template error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to apply template');
  }
}

// Get extracted data for documents in a folder
export async function getFolderExtractedData(folderId: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user's organization for proper filtering
    const { data: orgId } = await supabase.rpc('get_user_organization_id');
    if (!orgId) {
      throw new Error('User is not a member of any organization');
    }

    console.log('[getFolderExtractedData] folderId:', folderId);
    console.log('[getFolderExtractedData] orgId:', orgId);

    console.log(`[getFolderExtractedData] → filtering for folder_id=[${folderId}] (length ${folderId.length}, type ${typeof folderId})`);


    // First try to get structured extracted data
    const { data: extractedData, error: extractedError } = await supabase
      .from('extracted_data')
      .select(`
        *,
        files!inner(
          id,
          name,
          file_type,
          file_size,
          created_at
        )
      `)
      .eq('folder_id', folderId)
      .order('updated_at', { ascending: false });

    console.log('[getFolderExtractedData] extractedData:', extractedData);

    // If we have structured extracted data, return it
    if (extractedData && extractedData.length > 0) {
      return { data: extractedData, error: null };
    }

    // If no structured data, fall back to AI analysis data
    // First try with folder assignments
    let { data: analysisData, error: analysisError } = await supabase
      .from('file_analysis')
      .select(`
        *,
        files!inner(
          id,
          name, 
          file_type, 
          file_size, 
          created_at,
          file_folder_assignments!inner(
            folder_id
          )
        )
      `)
      .eq('files.file_folder_assignments.folder_id', folderId)
      .eq('files.organization_id', orgId)
      .order('updated_at', { ascending: false });

    // If no data found with folder assignments, try without folder filter (for testing)
    if (!analysisData || analysisData.length === 0) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('file_analysis')
        .select(`
          *,
          files!inner(
            id,
            name, 
            file_type, 
            file_size, 
            created_at
          )
        `)
        .eq('files.organization_id', orgId)
        .order('updated_at', { ascending: false });
      
      analysisData = fallbackData;
      analysisError = fallbackError;
    }

    if (analysisError) {
      console.error('Error fetching analysis data:', analysisError);
      return { data: [], error: analysisError.message };
    }

    // Transform analysis data to match the expected format
    const transformedData = analysisData?.map(analysis => ({
      document_id: analysis.files.id,
      extracted_data: {
        ai_description: analysis.ai_description,
        ai_category: analysis.ai_category,
        ai_tags: analysis.ai_tags?.join(', ') || '',
        confidence_score: analysis.confidence_score,
        ocr_text_preview: analysis.ocr_text ? analysis.ocr_text.substring(0, 200) + '...' : null
      },
      files: analysis.files, // Change from obra_documents to files for compatibility
      updated_at: analysis.updated_at
    })) || [];

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error in getFolderExtractedData:', error);
    return { data: [], error: 'Failed to fetch extracted data' };
  }
}
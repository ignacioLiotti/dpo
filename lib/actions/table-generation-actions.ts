'use server';

import { createClient } from '@/supabase/server';
import { action } from '@/lib/actions/safe-action';
import { z } from 'zod';

// Schema for getting tabular data
const getTabularDataSchema = z.object({
  obra_id: z.string().uuid(),
  folder_name: z.string().optional(),
});

// Types for tabular data
export interface TabularField {
  field_name: string;
  field_label: string;
  field_type: string;
}

export interface TabularRow {
  document_id: string;
  document_name: string;
  document_date: string;
  [field_name: string]: string | null;
}

export interface TabularData {
  fields: TabularField[];
  rows: TabularRow[];
  totalDocuments: number;
  totalFields: number;
}

export const getTabularDataAction = action
  .schema(getTabularDataSchema)
  .action(async ({ parsedInput }) => {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { obra_id, folder_name } = parsedInput;

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


      // Get field definitions for the folder(s)
      let fieldQuery = supabase
        .from('folder_field_definitions')
        .select('field_name, field_label, field_type, folder_name')
        .eq('obra_id', obra_id)
        .eq('is_active', true)
        .order('folder_name')
        .order('sort_order');

      if (folder_name) {
        fieldQuery = fieldQuery.eq('folder_name', folder_name);
      }

      const { data: fieldDefinitions, error: fieldsError } = await fieldQuery;

      if (fieldsError) {
        throw new Error(`Failed to get field definitions: ${fieldsError.message}`);
      }

      if (!fieldDefinitions || fieldDefinitions.length === 0) {
        return {
          success: true,
          data: {
            fields: [],
            rows: [],
            totalDocuments: 0,
            totalFields: 0,
          } as TabularData,
        };
      }

      // Get all extracted data with document info
      let dataQuery = supabase
        .from('document_extracted_data')
        .select(`
          *,
          folder_field_definitions(
            field_name,
            field_label,
            field_type,
            folder_name
          ),
          obra_documents(
            id,
            name,
            created_at,
            folder,
            obra_id
          )
        `);

      const { data: extractedData, error: dataError } = await dataQuery;

      if (dataError) {
        throw new Error(`Failed to get extracted data: ${dataError.message}`);
      }

      // Filter data after fetching to avoid complex JOIN issues
      const filteredExtractedData = extractedData?.filter(item => {
        if (!item.obra_documents) return false;
        if (item.obra_documents.obra_id !== obra_id) return false;
        if (folder_name && item.obra_documents.folder !== folder_name) return false;
        return true;
      }) || [];

      // Transform data into tabular format
      const documentMap = new Map<string, TabularRow>();
      const fieldsSet = new Set<string>();

      // Process all extracted data
      if (filteredExtractedData) {
        for (const extraction of filteredExtractedData) {
          if (!extraction.obra_documents || !extraction.folder_field_definitions) {
            continue;
          }
          
          const docId = extraction.obra_documents.id;
          const fieldName = extraction.folder_field_definitions.field_name;
          
          fieldsSet.add(fieldName);

          // Initialize document row if it doesn't exist
          if (!documentMap.has(docId)) {
            documentMap.set(docId, {
              document_id: docId,
              document_name: extraction.obra_documents.name,
              document_date: new Date(extraction.obra_documents.created_at).toLocaleDateString(),
            });
          }

          // Add field value to document row
          const docRow = documentMap.get(docId)!;
          docRow[fieldName] = extraction.extracted_value;
        }
      }

      // Create unique fields array (remove duplicates and sort)
      const uniqueFields = Array.from(new Set(
        fieldDefinitions.map(f => JSON.stringify({ 
          field_name: f.field_name, 
          field_label: f.field_label, 
          field_type: f.field_type 
        }))
      )).map(str => JSON.parse(str) as TabularField);

      // Get all documents that should be included (even without extracted data)
      let documentsQuery = supabase
        .from('obra_documents')
        .select('id, name, created_at, folder')
        .eq('obra_id', obra_id);

      if (folder_name) {
        documentsQuery = documentsQuery.eq('folder', folder_name);
      }

      const { data: allDocuments, error: docsError } = await documentsQuery;

      if (docsError) {
        throw new Error(`Failed to get documents: ${docsError.message}`);
      }

      // Ensure all documents are represented in the output
      if (allDocuments) {
        for (const doc of allDocuments) {
          if (!documentMap.has(doc.id)) {
            const row: TabularRow = {
              document_id: doc.id,
              document_name: doc.name,
              document_date: new Date(doc.created_at).toLocaleDateString(),
            };
            
            // Initialize all fields as null for documents without extracted data
            uniqueFields.forEach(field => {
              row[field.field_name] = null;
            });
            
            documentMap.set(doc.id, row);
          } else {
            // Fill in missing fields with null
            const existingRow = documentMap.get(doc.id)!;
            uniqueFields.forEach(field => {
              if (!(field.field_name in existingRow)) {
                existingRow[field.field_name] = null;
              }
            });
          }
        }
      }

      const tabularData: TabularData = {
        fields: uniqueFields,
        rows: Array.from(documentMap.values()),
        totalDocuments: documentMap.size,
        totalFields: uniqueFields.length,
      };

      return {
        success: true,
        data: tabularData,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
      };
    }
  });

// Export to CSV functionality
export const exportTabularDataToCSVAction = action
  .schema(getTabularDataSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Get the tabular data first
      const result = await getTabularDataAction({ parsedInput });
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get tabular data');
      }

      const { fields, rows } = result.data;

      // Create CSV headers
      const headers = ['Document Name', 'Date', ...fields.map(f => f.field_label)];
      
      // Create CSV rows
      const csvRows = rows.map(row => [
        `"${row.document_name}"`,
        row.document_date,
        ...fields.map(field => {
          const value = row[field.field_name];
          return value ? `"${value}"` : '';
        })
      ]);

      // Combine headers and rows
      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');

      return {
        success: true,
        csvContent,
        filename: `extracted-data-${parsedInput.folder_name || 'all-folders'}-${new Date().toISOString().split('T')[0]}.csv`,
      };
    } catch (error) {
      console.error('Export CSV error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  });
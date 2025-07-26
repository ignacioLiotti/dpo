import { createServerSupabaseClient, getUserOrganization } from '@/app/auth/server-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { folderId } = await request.json();
    const supabase = await createServerSupabaseClient();

    // Get current user and organization
    const { user, organizationId } = await getUserOrganization(supabase);

    // Get folder
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .eq('organization_id', organizationId)
      .single();

    if (folderError || !folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Get field definitions
    const { data: fields, error: fieldsError } = await supabase
      .from('folder_field_definitions')
      .select('*')
      .eq('folder_id', folderId)
      .order('sort_order');

    const activeFields = fields?.filter(f => f.is_active !== false) || [];

    // Test data for extraction
    const testData = {
      folderId,
      folderName: folder.name,
      extractData: folder.extract_data,
      allFieldsCount: fields?.length || 0,
      activeFieldsCount: activeFields.length,
      fields: activeFields.map(f => ({
        name: f.field_name,
        type: f.field_type,
        label: f.field_label,
        active: f.is_active,
        pattern: f.extraction_pattern
      }))
    };

    // Also check if there are any documents with extracted data
    const { data: extractedDataRecords } = await supabase
      .from('document_extracted_data')
      .select('document_id, field_count, extracted_data')
      .eq('folder_id', folderId);

    return NextResponse.json({
      success: true,
      testData,
      extractedDataRecords: extractedDataRecords || [],
      recommendations: {
        hasFieldDefinitions: activeFields.length > 0,
        hasExtractedData: (extractedDataRecords?.length || 0) > 0,
        nextStep: activeFields.length === 0 
          ? 'Create field definitions'
          : (extractedDataRecords?.length || 0) === 0
          ? 'Process documents to extract data'
          : 'Data extraction is working correctly'
      }
    });

  } catch (error) {
    console.error('Test extraction API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
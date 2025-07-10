import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const folderId = params.id;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get folder info
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .single();

    // Get field definitions
    const { data: fieldDefinitions, error: fieldsError } = await supabase
      .from('folder_field_definitions')
      .select('*')
      .eq('folder_id', folderId)
      .eq('is_active', true)
      .order('sort_order');

    // Get documents in folder with extracted data
    const { data: documents, error: docsError } = await supabase
      .from('obra_documents')
      .select(`
        *,
        folder_documents!inner (folder_id),
        document_extracted_data (*)
      `)
      .eq('folder_documents.folder_id', folderId);

    // Get all extracted data records for this folder
    const { data: extractedDataRecords, error: extractedError } = await supabase
      .from('document_extracted_data')
      .select('*')
      .eq('folder_id', folderId);

    return NextResponse.json({
      folder: folder || null,
      fieldDefinitions: fieldDefinitions || [],
      documents: documents || [],
      extractedDataRecords: extractedDataRecords || [],
      debug: {
        folderError: folderError?.message || null,
        fieldsError: fieldsError?.message || null,
        docsError: docsError?.message || null,
        extractedError: extractedError?.message || null
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
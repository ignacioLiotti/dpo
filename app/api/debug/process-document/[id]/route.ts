import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const { provider = 'gpt' } = await request.json();
    
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get document details with folder information
    const { data: document, error: docError } = await supabase
      .from('obra_documents')
      .select(`
        *,
        folder_documents (
          folder_id,
          folder:folder_id (
            id,
            name,
            extract_data
          )
        )
      `)
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const folderData = document.folder_documents?.[0]?.folder;

    // Get field definitions if in a folder with extraction enabled
    let fieldDefinitions = [];
    if (folderData?.extract_data) {
      const { data: fields } = await supabase
        .from('folder_field_definitions')
        .select('*')
        .eq('folder_id', folderData.id)
        .order('sort_order');
      
      fieldDefinitions = fields?.filter(f => f.is_active !== false) || [];
    }

    // Check current extracted data
    const { data: currentExtractedData } = await supabase
      .from('document_extracted_data')
      .select('*')
      .eq('document_id', documentId);

    return NextResponse.json({
      document: {
        id: document.id,
        name: document.name,
        processing_status: document.processing_status,
        folder: folderData
      },
      fieldDefinitions,
      currentExtractedData: currentExtractedData || [],
      debug: {
        folderHasExtraction: !!folderData?.extract_data,
        fieldDefinitionsCount: fieldDefinitions.length,
        currentExtractedDataCount: currentExtractedData?.length || 0
      }
    });

  } catch (error) {
    console.error('Debug process document API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
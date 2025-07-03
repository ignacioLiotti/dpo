import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const documentId = params.id;

    // First verify the user owns this document
    const { data: document, error: docError } = await supabase
      .from('obra_documents')
      .select('id, user_id, ocr_content')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Get extracted data if it exists
    const { data: extractedData, error: extractedError } = await supabase
      .from('document_extracted_data')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .single();

    if (extractedError) {
      // No extracted data found - this is okay, return the document with OCR content only
      return NextResponse.json({
        success: true,
        data: {
          document_id: documentId,
          ocr_content: document.ocr_content,
          extracted_data: null,
          extraction_confidence: 0,
          field_count: 0
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        document_id: documentId,
        ocr_content: document.ocr_content,
        ...extractedData
      }
    });

  } catch (error) {
    console.error('Error fetching extracted data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
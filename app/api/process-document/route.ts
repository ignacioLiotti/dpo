import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';
import { processDocument } from '@/app/(sidebar)/files/services/document-processor';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const fileType = formData.get('fileType') as string;
    const folderId = formData.get('folder_id') as string;

    if (!file || !fileName || !fileType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Check folder extraction settings if folder is specified
    let folderExtractionEnabled = false;
    let fieldDefinitions: any[] = [];
    
    if (folderId) {
      try {
        // Check if folder has extraction enabled
        const { data: folder } = await supabase
          .from('folders')
          .select('extract_data')
          .eq('id', folderId)
          .single();
          
        if (folder?.extract_data) {
          folderExtractionEnabled = true;
          
          // Get field definitions for this folder
          const { data: fields } = await supabase
            .from('folder_field_definitions')
            .select('*')
            .eq('folder_id', folderId)
            .eq('is_active', true)
            .order('sort_order');
            
          fieldDefinitions = fields || [];
        }
      } catch (error) {
        console.warn('Error checking folder extraction settings:', error);
      }
    }

    // Process the document
    const processingResult = await processDocument(
      file,
      fileName,
      fileType,
      folderExtractionEnabled,
      fieldDefinitions
    );

    return NextResponse.json({
      success: true,
      ocrText: processingResult.ocrText,
      aiDescription: processingResult.aiDescription,
      aiTags: processingResult.aiTags,
      extractedData: processingResult.extractedData,
      confidence: processingResult.confidence,
      metadata: processingResult.metadata
    });

  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Document processing failed',
        success: false 
      },
      { status: 500 }
    );
  }
}
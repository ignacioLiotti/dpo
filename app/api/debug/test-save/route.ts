import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();
    
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: orgId, error: orgError } = await supabase.rpc('get_user_organization_id');
    if (orgError || !orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    console.log('[test-save] Starting save test for document:', documentId);

    // Step 1: Check if document exists
    const { data: document, error: docError } = await supabase
      .from('files')
      .select('*')
      .eq('id', documentId)
      .eq('organization_id', orgId)
      .single();

    if (docError || !document) {
      console.error('[test-save] Document not found:', docError);
      return NextResponse.json({ 
        error: 'Document not found',
        details: docError 
      }, { status: 404 });
    }

    console.log('[test-save] Document found:', document.name);

    // Step 2: Test file_analysis table save
    const analysisData = {
      file_id: documentId,
      user_id: user.id,
      ocr_text: `Test OCR for ${document.name}`,
      ai_description: `Test description for ${document.name}`,
      ai_category: 'test',
      ai_tags: ['test', 'debug'],
      confidence_score: 0.9,
      analysis_metadata: {
        test: true,
        processed_at: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    console.log('[test-save] Attempting to save analysis data...');
    
    const { data: analysisResult, error: analysisError } = await supabase
      .from('file_analysis')
      .upsert(analysisData, { onConflict: 'file_id' })
      .select();

    if (analysisError) {
      console.error('[test-save] Analysis save error:', analysisError);
      return NextResponse.json({
        error: 'Failed to save analysis',
        details: analysisError,
        step: 'file_analysis'
      }, { status: 500 });
    }

    console.log('[test-save] Analysis saved successfully:', analysisResult);

    // Step 3: Test file status update
    console.log('[test-save] Attempting to update file status...');
    
    const { data: fileUpdateResult, error: fileUpdateError } = await supabase
      .from('files')
      .update({
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select();

    if (fileUpdateError) {
      console.error('[test-save] File update error:', fileUpdateError);
      return NextResponse.json({
        error: 'Failed to update file status',
        details: fileUpdateError,
        step: 'file_update'
      }, { status: 500 });
    }

    console.log('[test-save] File status updated successfully:', fileUpdateResult);

    // Step 4: Test extracted data save (if folder has extraction)
    const { data: folderAssignment, error: folderError } = await supabase
      .from('file_folder_assignments')
      .select(`
        folder_id,
        folder:folder_id (
          id,
          name,
          extract_data
        )
      `)
      .eq('file_id', documentId)
      .single();

    let extractionTest = null;

    if (!folderError && folderAssignment?.folder?.extract_data) {
      const folderId = folderAssignment.folder.id;
      console.log('[test-save] Testing extraction save for folder:', folderId);

      // Get field definitions
      const { data: fieldDefinitions, error: fieldsError } = await supabase
        .from('folder_field_definitions')
        .select('*')
        .eq('folder_id', folderId)
        .eq('is_active', true);

      if (!fieldsError && fieldDefinitions && fieldDefinitions.length > 0) {
        console.log('[test-save] Found field definitions:', fieldDefinitions.length);

        // Create test extracted data
        const testExtractedData = {};
        fieldDefinitions.forEach((field, index) => {
          testExtractedData[field.field_name] = `Test value ${index + 1}`;
        });

        const extractedDataRecord = {
          file_id: documentId,
          folder_id: folderId,
          user_id: user.id,
          extracted_value: JSON.stringify(testExtractedData),
          confidence_score: 0.9,
          is_verified: false,
          extraction_metadata: {
            test: true,
            processed_at: new Date().toISOString(),
            field_count: Object.keys(testExtractedData).length
          }
        };

        console.log('[test-save] Attempting to save extracted data...');

        const { data: extractionResult, error: extractionError } = await supabase
          .from('extracted_data')
          .upsert(extractedDataRecord, { onConflict: 'file_id' })
          .select();

        if (extractionError) {
          console.error('[test-save] Extraction save error:', extractionError);
          extractionTest = { 
            success: false, 
            error: extractionError,
            step: 'extracted_data'
          };
        } else {
          console.log('[test-save] Extraction saved successfully:', extractionResult);
          extractionTest = { 
            success: true, 
            data: extractionResult,
            fieldCount: Object.keys(testExtractedData).length
          };
        }
      } else {
        console.log('[test-save] No field definitions found');
        extractionTest = { success: true, message: 'No field definitions found' };
      }
    } else {
      console.log('[test-save] No extraction-enabled folder');
      extractionTest = { success: true, message: 'No extraction-enabled folder' };
    }

    // Step 5: Verify data was saved by reading it back
    console.log('[test-save] Verifying saved data...');

    const { data: verifyAnalysis, error: verifyError } = await supabase
      .from('file_analysis')
      .select('*')
      .eq('file_id', documentId)
      .single();

    const { data: verifyFile, error: verifyFileError } = await supabase
      .from('files')
      .select('processing_status, updated_at')
      .eq('id', documentId)
      .single();

    const { data: verifyExtraction, error: verifyExtractionError } = await supabase
      .from('extracted_data')
      .select('*')
      .eq('file_id', documentId)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Save test completed successfully',
      results: {
        document: {
          id: documentId,
          name: document.name,
          status: document.processing_status
        },
        analysis: {
          saved: !!analysisResult,
          verified: !!verifyAnalysis,
          data: verifyAnalysis
        },
        fileUpdate: {
          saved: !!fileUpdateResult,
          verified: !!verifyFile,
          currentStatus: verifyFile?.processing_status
        },
        extraction: extractionTest,
        extractionVerification: {
          found: !!verifyExtraction,
          data: verifyExtraction
        }
      },
      debug: {
        userId: user.id,
        orgId: orgId,
        documentExists: !!document,
        hasFolder: !!folderAssignment,
        folderHasExtraction: !!folderAssignment?.folder?.extract_data
      }
    });

  } catch (error) {
    console.error('[test-save] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
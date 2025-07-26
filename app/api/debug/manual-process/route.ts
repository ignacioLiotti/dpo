import { createServerSupabaseClient, getUserOrganization } from '@/app/auth/server-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();
    
    const supabase = await createServerSupabaseClient();
    const { user, organizationId } = await getUserOrganization(supabase);

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    console.log(`[manual-process] Starting manual processing for document: ${documentId}`);

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('files')
      .select(`
        *,
        file_folder_assignments (
          folder_id,
          folder:folder_id (
            id,
            name,
            extract_data
          )
        )
      `)
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (docError || !document) {
      console.error(`[manual-process] Document not found:`, docError);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    console.log(`[manual-process] Document found:`, {
      name: document.name,
      type: document.file_type,
      status: document.processing_status
    });

    // Update processing status
    const { error: updateError } = await supabase
      .from('files')
      .update({ 
        processing_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error(`[manual-process] Failed to update status:`, updateError);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    // Simulate basic processing (for testing)
    const analysisResult = {
      ocr_text: `Manual processing test for ${document.name}.\nFile type: ${document.file_type}\nProcessed at: ${new Date().toISOString()}`,
      ai_description: `Test processing for ${document.name}. This is a ${document.file_type} file that was processed manually for testing purposes.`,
      ai_category: 'test-document',
      ai_tags: ['manual-processing', 'test', document.file_type.split('/')[0]],
      confidence_score: 0.9,
      analysis_metadata: {
        processed_at: new Date().toISOString(),
        processing_type: 'manual-test',
        provider: 'Manual Test',
        test_mode: true
      }
    };

    // Save analysis results
    const { error: analysisError } = await supabase
      .from('file_analysis')
      .upsert({
        file_id: documentId,
        user_id: user.id,
        ocr_text: analysisResult.ocr_text,
        ai_description: analysisResult.ai_description,
        ai_category: analysisResult.ai_category,
        ai_tags: analysisResult.ai_tags,
        confidence_score: analysisResult.confidence_score,
        analysis_metadata: analysisResult.analysis_metadata,
        updated_at: new Date().toISOString()
      }, { onConflict: 'file_id' });

    if (analysisError) {
      console.error(`[manual-process] Failed to save analysis:`, analysisError);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    // Check if document is in extraction-enabled folder
    const folderAssignment = document.file_folder_assignments?.[0];
    const folderData = folderAssignment?.folder;
    const hasExtraction = folderData?.extract_data || false;

    console.log(`[manual-process] Folder info:`, {
      hasFolder: !!folderData,
      folderName: folderData?.name,
      hasExtraction
    });

    // If extraction is enabled, get field definitions and create dummy extracted data
    if (hasExtraction && folderData) {
      const { data: fieldDefinitions, error: fieldsError } = await supabase
        .from('folder_field_definitions')
        .select('*')
        .eq('folder_id', folderData.id)
        .eq('is_active', true)
        .order('sort_order');

      if (!fieldsError && fieldDefinitions && fieldDefinitions.length > 0) {
        console.log(`[manual-process] Found ${fieldDefinitions.length} field definitions`);
        
        // Create dummy extracted data for testing
        const extractedData: any = {};
        fieldDefinitions.forEach(field => {
          switch (field.field_type) {
            case 'text':
              extractedData[field.field_name] = `Test ${field.field_label}`;
              break;
            case 'number':
              extractedData[field.field_name] = 123.45;
              break;
            case 'date':
              extractedData[field.field_name] = new Date().toISOString().split('T')[0];
              break;
            case 'currency':
              extractedData[field.field_name] = '$999.99';
              break;
            case 'boolean':
              extractedData[field.field_name] = true;
              break;
            case 'email':
              extractedData[field.field_name] = 'test@example.com';
              break;
            case 'phone':
              extractedData[field.field_name] = '+1-555-123-4567';
              break;
            default:
              extractedData[field.field_name] = `Test value for ${field.field_label}`;
          }
        });

        console.log(`[manual-process] Generated extracted data:`, extractedData);

        // Save extracted data
        const { error: extractionError } = await supabase
          .from('extracted_data')
          .upsert({
            file_id: documentId,
            folder_id: folderData.id,
            user_id: user.id,
            extracted_value: JSON.stringify(extractedData),
            confidence_score: 0.9,
            is_verified: false,
            extraction_metadata: {
              provider: 'Manual Test',
              processed_at: new Date().toISOString(),
              field_count: Object.keys(extractedData).length,
              extraction_method: 'manual_test'
            }
          }, { onConflict: 'file_id' });

        if (extractionError) {
          console.error(`[manual-process] Failed to save extracted data:`, extractionError);
        } else {
          console.log(`[manual-process] Successfully saved extracted data`);
        }
      } else {
        console.log(`[manual-process] No field definitions found for folder`);
      }
    }

    // Update document status to completed
    const { error: completeError } = await supabase
      .from('files')
      .update({
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (completeError) {
      console.error(`[manual-process] Failed to mark as completed:`, completeError);
      return NextResponse.json({ error: 'Failed to mark as completed' }, { status: 500 });
    }

    console.log(`[manual-process] Processing completed successfully`);

    return NextResponse.json({
      success: true,
      message: 'Manual processing completed successfully',
      result: {
        documentId,
        hasExtraction,
        folderName: folderData?.name,
        analysis: analysisResult,
        processingCompleted: true
      }
    });

  } catch (error) {
    console.error('[manual-process] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
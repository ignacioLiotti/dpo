import { createServerSupabaseClient, getUserOrganization } from '@/app/auth/server-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: folderId } = await params;
    const supabase = await createServerSupabaseClient();
    const { user, organizationId } = await getUserOrganization(supabase);

    // Verify folder belongs to user's organization
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('id')
      .eq('id', folderId)
      .eq('organization_id', organizationId)
      .single();

    if (folderError || !folder) {
      return NextResponse.json({ error: 'Folder not found or access denied' }, { status: 404 });
    }

    // Get field count from folder_extraction_configs
    const { data: fieldConfigs, error: fieldError } = await supabase
      .from('folder_extraction_configs')
      .select('id')
      .eq('folder_id', folderId);

    const fieldCount = fieldConfigs?.length || 0;

    // Get total documents count in this folder
    const { data: totalFiles, error: totalError } = await supabase
      .from('file_folder_assignments')
      .select('file_id', { count: 'exact' })
      .eq('folder_id', folderId);

    const totalDocumentsCount = totalFiles?.length || 0;

    // Get extracted documents count (files with extracted data)
    const { data: extractedFiles, error: extractedError } = await supabase
      .from('extracted_data')
      .select('file_id', { count: 'exact' })
      .eq('folder_id', folderId);

    const extractedDocumentsCount = extractedFiles?.length || 0;

    // Get average confidence score
    const { data: confidenceData, error: confidenceError } = await supabase
      .from('extracted_data')
      .select('confidence_score')
      .eq('folder_id', folderId);

    let avgConfidence = 0;
    if (confidenceData && confidenceData.length > 0) {
      const validScores = confidenceData
        .map(d => d.confidence_score)
        .filter(score => score !== null && score !== undefined);
      
      if (validScores.length > 0) {
        avgConfidence = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
      }
    }

    // Return the stats in the format expected by the component
    return NextResponse.json({
      fieldCount,
      extractedDocumentsCount,
      totalDocumentsCount,
      avgConfidence: Math.round(avgConfidence * 100) / 100 // Round to 2 decimal places
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
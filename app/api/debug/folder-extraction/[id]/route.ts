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

    // Get folder info (verify it belongs to user's organization)
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .eq('organization_id', organizationId)
      .single();

    // Get field definitions
    const { data: fieldDefinitions, error: fieldsError } = await supabase
      .from('folder_extraction_configs')
      .select('*')
      .eq('folder_id', folderId)
      .order('field_name');

    // Get files in folder with extracted data
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select(`
        *,
        file_folder_assignments!inner (
          folder_id
        ),
        file_analysis (*),
        extracted_data (*)
      `)
      .eq('file_folder_assignments.folder_id', folderId)
      .eq('organization_id', organizationId);

    // Get all extracted data records for this folder
    const { data: extractedDataRecords, error: extractedError } = await supabase
      .from('extracted_data')
      .select('*')
      .eq('folder_id', folderId);

    return NextResponse.json({
      folder: folder || null,
      fieldDefinitions: fieldDefinitions || [],
      files: files || [],
      extractedDataRecords: extractedDataRecords || [],
      debug: {
        folderError: folderError?.message || null,
        fieldsError: fieldsError?.message || null,
        filesError: filesError?.message || null,
        extractedError: extractedError?.message || null,
        organizationId
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
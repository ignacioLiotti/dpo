import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to get user's organization
async function getUserOrganization(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Get user's organization
  const { data: orgId } = await supabase.rpc('get_user_organization_id');
  if (!orgId) {
    throw new Error('User is not a member of any organization');
  }

  return { user, organizationId: orgId };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const { provider = 'gpt' } = await request.json();
    
    const supabase = await createClient();
    const { user, organizationId } = await getUserOrganization(supabase);

    // Get file details with folder information
    const { data: file, error: fileError } = await supabase
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
      .single();

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const folderAssignment = file.file_folder_assignments?.[0];
    const folderData = folderAssignment?.folder;

    // Get field definitions if in a folder with extraction enabled
    let fieldDefinitions = [];
    if (folderData?.extract_data) {
      const { data: fields } = await supabase
        .from('folder_extraction_configs')
        .select('*')
        .eq('folder_id', folderData.id)
        .order('field_name');
      
      fieldDefinitions = fields || [];
    }

    // Check current extracted data
    const { data: currentExtractedData } = await supabase
      .from('extracted_data')
      .select('*')
      .eq('file_id', documentId);

    return NextResponse.json({
      file: {
        id: file.id,
        name: file.name,
        processing_status: file.processing_status,
        folder: folderData
      },
      fieldDefinitions,
      currentExtractedData: currentExtractedData || [],
      debug: {
        folderHasExtraction: !!folderData?.extract_data,
        fieldDefinitionsCount: fieldDefinitions.length,
        currentExtractedDataCount: currentExtractedData?.length || 0,
        organizationId
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
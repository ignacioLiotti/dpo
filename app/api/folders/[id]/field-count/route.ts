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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: folderId } = await params;
    const supabase = await createClient();
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

    // Count field definitions for the folder
    const { count, error } = await supabase
      .from('folder_extraction_configs')
      .select('*', { count: 'exact', head: true })
      .eq('folder_id', folderId);

    if (error) {
      console.error('Error counting field definitions:', error);
      return NextResponse.json({ error: 'Failed to count field definitions' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
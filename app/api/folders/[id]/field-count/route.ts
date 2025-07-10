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

    // Count field definitions for the folder
    const { count, error } = await supabase
      .from('folder_field_definitions')
      .select('*', { count: 'exact', head: true })
      .eq('folder_id', folderId)
      .eq('is_active', true);

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
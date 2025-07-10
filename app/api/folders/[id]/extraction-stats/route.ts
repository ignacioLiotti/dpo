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

    // Get extraction stats from the view
    const { data: folderStats, error: statsError } = await supabase
      .from('folder_extraction_overview')
      .select('*')
      .eq('folder_id', folderId)
      .single();

    if (statsError) {
      console.error('Error fetching folder stats:', statsError);
      return NextResponse.json({ error: 'Failed to fetch extraction stats' }, { status: 500 });
    }

    // Return the stats in the format expected by the component
    return NextResponse.json({
      fieldCount: folderStats.field_count || 0,
      extractedDocumentsCount: folderStats.extracted_documents_count || 0,
      totalDocumentsCount: folderStats.total_documents_count || 0,
      avgConfidence: folderStats.avg_confidence || 0
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
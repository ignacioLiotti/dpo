// app/api/documents/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getUserOrganization } from '@/app/auth/server-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user, organizationId } = await getUserOrganization(supabase);
    const { id: documentId } = await params;

    // Get document with extracted data count
    const { data: document, error } = await supabase
      .from('files')
      .select(`
        id,
        processing_status,
        extracted_data (
          id
        )
      `)
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: document.processing_status,
      hasExtractedData: document.extracted_data && document.extracted_data.length > 0
    });
  } catch (error) {
    console.error('Error fetching document status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
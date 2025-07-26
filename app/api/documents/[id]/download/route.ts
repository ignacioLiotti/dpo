import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/app/auth/server-utils';
import { getDocumentDownloadUrl } from '@/app/(sidebar)/files/actions/document-actions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    const result = await getDocumentDownloadUrl(id);
    
    if (!result) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Handle case where file exists in database but not in storage
    if (result.error === 'FILE_MISSING_FROM_STORAGE') {
      return NextResponse.json({ 
        error: 'File not available',
        message: result.message,
        document: result.document
      }, { status: 410 }); // 410 Gone - resource no longer available
    }

    if (!result.url) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }

    // Return the signed URL as JSON
    return NextResponse.json({ url: result.url, document: result.document });
    
  } catch (error) {
    console.error('Error getting download URL:', error);
    return NextResponse.json(
      { error: `Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getDocumentDownloadUrl } from '@/lib/actions/document-actions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const downloadUrl = await getDocumentDownloadUrl(id);
    
    if (!downloadUrl) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Return the signed URL as JSON
    return NextResponse.json({ url: downloadUrl });
    
  } catch (error) {
    console.error('Error getting download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
} 
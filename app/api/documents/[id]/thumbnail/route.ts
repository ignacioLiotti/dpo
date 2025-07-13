import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: orgId, error: orgError } = await supabase.rpc('get_user_organization_id');
    if (orgError || !orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('files')
      .select('id, name, storage_path, file_type, organization_id')
      .eq('id', params.id)
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Only generate thumbnails for images to optimize costs
    if (!document.file_type.startsWith('image/')) {
      return NextResponse.json({ error: 'Thumbnails only available for images' }, { status: 400 });
    }

    // For images, we can use Supabase's transform feature or return the original with cache headers
    // This is cost-efficient as we're not generating new files, just using query parameters
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('organization-files')
      .createSignedUrl(document.storage_path, 3600, {
        transform: {
          width: 200,
          height: 200,
          resize: 'cover',
          quality: 80
        }
      });

    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      return NextResponse.json({ error: 'Failed to generate thumbnail' }, { status: 500 });
    }

    // Cache the response for 1 hour to reduce API calls
    const response = NextResponse.json({
      url: signedUrlData.signedUrl,
      cached_until: new Date(Date.now() + 3600000).toISOString()
    });

    response.headers.set('Cache-Control', 'public, max-age=3600');
    
    return response;
  } catch (error) {
    console.error('Thumbnail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
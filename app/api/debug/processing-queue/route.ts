import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    // Check processing queue
    const { data: queueData, error: queueError } = await supabase
      .from('processing_queue')
      .select(`
        id,
        file_id,
        processing_type,
        priority,
        status,
        attempts,
        error_message,
        created_at,
        updated_at,
        files (
          name,
          processing_status
        )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (queueError) {
      console.error('Error fetching queue:', queueError);
      return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
    }

    // Check recent files
    const { data: filesData, error: filesError } = await supabase
      .from('files')
      .select('id, name, processing_status, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (filesError) {
      console.error('Error fetching files:', filesError);
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }

    // Check for pending jobs
    const { data: pendingJobs, error: pendingError } = await supabase
      .rpc('get_pending_processing_jobs', { batch_size: 10 });

    if (pendingError) {
      console.error('Error fetching pending jobs:', pendingError);
    }

    return NextResponse.json({
      success: true,
      data: {
        queue: queueData || [],
        recentFiles: filesData || [],
        pendingJobs: pendingJobs || [],
        organization_id: orgId,
        user_id: user.id
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Test manual processing
export async function POST(request: NextRequest) {
  try {
    const { documentId, processingType = 'basic' } = await request.json();
    
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

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Try to manually enqueue the document
    const { data: queueResult, error: queueError } = await supabase
      .rpc('enqueue_document_processing', {
        p_file_id: documentId,
        p_processing_type: processingType,
        p_priority: 'high'
      });

    if (queueError) {
      console.error('Error enqueuing document:', queueError);
      return NextResponse.json({ 
        error: 'Failed to enqueue document', 
        details: queueError.message 
      }, { status: 500 });
    }

    // Try to call the edge function directly
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-document-ai`;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json({ 
        error: 'Service role key not configured',
        queueResult 
      }, { status: 500 });
    }

    try {
      const edgeResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_id: documentId,
          processing_type: processingType,
          priority: 'high'
        })
      });

      const edgeResult = await edgeResponse.json();
      
      return NextResponse.json({
        success: true,
        queueResult,
        edgeFunction: {
          status: edgeResponse.status,
          result: edgeResult
        }
      });

    } catch (edgeError) {
      console.error('Edge function error:', edgeError);
      return NextResponse.json({
        success: false,
        error: 'Edge function call failed',
        queueResult,
        edgeError: edgeError instanceof Error ? edgeError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Manual processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
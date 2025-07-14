import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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

    console.log('[fix-queue] Starting queue analysis and fix');

    // Check current queue state
    const { data: queueData, error: queueError } = await supabase
      .from('processing_queue')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (queueError) {
      console.error('[fix-queue] Error fetching queue:', queueError);
      return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
    }

    console.log('[fix-queue] Current queue items:', queueData?.length || 0);

    // Test the get_pending_processing_jobs function directly
    const { data: pendingJobs, error: pendingError } = await supabase
      .rpc('get_pending_processing_jobs', { batch_size: 10 });

    console.log('[fix-queue] get_pending_processing_jobs result:', { 
      pendingJobs: pendingJobs?.length || 0, 
      error: pendingError 
    });

    if (pendingError) {
      console.error('[fix-queue] Error with get_pending_processing_jobs:', pendingError);
      
      // Let's try to query the processing queue manually
      const { data: manualQuery, error: manualError } = await supabase
        .from('processing_queue')
        .select(`
          id,
          file_id,
          organization_id,
          processing_type,
          priority,
          status,
          attempts,
          max_attempts,
          scheduled_at,
          files (
            name,
            file_type,
            storage_path
          )
        `)
        .eq('status', 'pending')
        .eq('organization_id', orgId)
        .lt('attempts', 3) // max_attempts
        .lte('scheduled_at', new Date().toISOString())
        .order('priority', { ascending: true }) // High priority first
        .order('scheduled_at', { ascending: true })
        .limit(10);

      console.log('[fix-queue] Manual query result:', { 
        manualQuery: manualQuery?.length || 0, 
        error: manualError 
      });

      if (manualError) {
        return NextResponse.json({ 
          error: 'Both RPC function and manual query failed',
          rpcError: pendingError,
          manualError: manualError
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        issue: 'RPC function failed but manual query worked',
        queueCount: queueData?.length || 0,
        pendingJobs: manualQuery || [],
        rpcError: pendingError,
        suggestion: 'The get_pending_processing_jobs function may not exist or have issues'
      });
    }

    // If we get here, the RPC function worked
    console.log('[fix-queue] RPC function is working, checking why jobs are not processing');

    // Check if there are any jobs that should be processed
    const shouldBeProcessed = queueData?.filter(job => 
      job.status === 'pending' && 
      job.attempts < job.max_attempts &&
      new Date(job.scheduled_at) <= new Date()
    );

    console.log('[fix-queue] Jobs that should be processed:', shouldBeProcessed?.length || 0);

    // Try to process one job manually
    if (shouldBeProcessed && shouldBeProcessed.length > 0) {
      const jobToProcess = shouldBeProcessed[0];
      console.log('[fix-queue] Attempting to process job:', jobToProcess.id);

      // Update status to processing
      const { error: updateError } = await supabase
        .from('processing_queue')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobToProcess.id);

      if (updateError) {
        console.error('[fix-queue] Failed to update job status:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update job status',
          details: updateError
        }, { status: 500 });
      }

      // Try to call our manual processing for this document
      try {
        const processResponse = await fetch(`${request.url.split('/api')[0]}/api/debug/manual-process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify({
            documentId: jobToProcess.file_id
          })
        });

        const processResult = await processResponse.json();

        if (processResponse.ok) {
          // Update queue status to completed
          await supabase
            .from('processing_queue')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', jobToProcess.id);

          console.log('[fix-queue] Successfully processed job:', jobToProcess.id);
        } else {
          // Update queue status to failed
          await supabase
            .from('processing_queue')
            .update({
              status: 'failed',
              error_message: processResult.error || 'Processing failed',
              attempts: jobToProcess.attempts + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', jobToProcess.id);

          console.error('[fix-queue] Failed to process job:', processResult.error);
        }

        return NextResponse.json({
          success: true,
          message: 'Attempted to process one job',
          jobId: jobToProcess.id,
          documentId: jobToProcess.file_id,
          processResult: processResult,
          queueCount: queueData?.length || 0,
          pendingJobs: pendingJobs || [],
          shouldBeProcessed: shouldBeProcessed.length
        });

      } catch (processError) {
        console.error('[fix-queue] Error calling manual process:', processError);
        
        // Update queue status to failed
        await supabase
          .from('processing_queue')
          .update({
            status: 'failed',
            error_message: processError instanceof Error ? processError.message : 'Unknown error',
            attempts: jobToProcess.attempts + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobToProcess.id);

        return NextResponse.json({
          success: false,
          error: 'Failed to process job',
          jobId: jobToProcess.id,
          processError: processError instanceof Error ? processError.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Queue analysis complete',
      queueCount: queueData?.length || 0,
      pendingJobs: pendingJobs || [],
      shouldBeProcessed: shouldBeProcessed?.length || 0,
      analysis: {
        rpcFunctionWorks: !pendingError,
        hasQueuedJobs: (queueData?.length || 0) > 0,
        hasPendingJobs: (pendingJobs?.length || 0) > 0,
        hasJobsToProcess: (shouldBeProcessed?.length || 0) > 0
      }
    });

  } catch (error) {
    console.error('[fix-queue] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
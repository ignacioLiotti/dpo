import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
  schema: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const payload: WebhookPayload = await req.json()
    
    console.log('Webhook payload:', JSON.stringify(payload, null, 2))
    
    // Handle different types of events
    switch (payload.table) {
      case 'files':
        await handleFileEvent(supabase, payload)
        break
      case 'processing_queue':
        await handleProcessingQueueEvent(supabase, payload)
        break
      default:
        console.log(`Unhandled table: ${payload.table}`)
    }
    
    return new Response(
      JSON.stringify({ message: 'Webhook processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleFileEvent(supabase: any, payload: WebhookPayload) {
  const { type, record, old_record } = payload
  
  if (type === 'INSERT') {
    console.log('New file uploaded:', record.name)
    
    // Check if file is in a folder with extraction enabled
    if (record.folder_id) {
      const { data: folder } = await supabase
        .from('folders')
        .select('extract_data')
        .eq('id', record.folder_id)
        .single()
      
      if (folder?.extract_data) {
        console.log('File in extraction-enabled folder, prioritizing processing')
        
        // Update processing queue to high priority
        await supabase
          .from('processing_queue')
          .update({ priority: 'high' })
          .eq('file_id', record.id)
      }
    }
  } else if (type === 'UPDATE') {
    // Check for processing status changes
    if (old_record?.processing_status !== record.processing_status) {
      console.log(`File processing status changed: ${old_record?.processing_status} -> ${record.processing_status}`)
      
      // Emit real-time notification
      await supabase
        .channel('document-processing')
        .send({
          type: 'broadcast',
          event: 'processing_status_changed',
          payload: {
            file_id: record.id,
            file_name: record.name,
            old_status: old_record?.processing_status,
            new_status: record.processing_status,
            timestamp: new Date().toISOString()
          }
        })
    }
  }
}

async function handleProcessingQueueEvent(supabase: any, payload: WebhookPayload) {
  const { type, record, old_record } = payload
  
  if (type === 'INSERT') {
    console.log('New processing job queued:', record.file_id)
    
    // If high priority, trigger immediate processing
    if (record.priority === 'high') {
      console.log('High priority job detected, triggering immediate processing')
      
      // Call the processing function directly
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-document-ai`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            document_id: record.file_id,
            processing_type: record.processing_type || 'full',
            priority: record.priority
          })
        })
        
        console.log('High priority processing triggered successfully')
      } catch (error) {
        console.error('Failed to trigger high priority processing:', error)
      }
    }
  } else if (type === 'UPDATE') {
    // Check for status changes
    if (old_record?.status !== record.status) {
      console.log(`Processing job status changed: ${old_record?.status} -> ${record.status}`)
      
      // Emit real-time notification
      await supabase
        .channel('processing-queue')
        .send({
          type: 'broadcast',
          event: 'queue_status_changed',
          payload: {
            queue_id: record.id,
            file_id: record.file_id,
            old_status: old_record?.status,
            new_status: record.status,
            attempts: record.attempts,
            error_message: record.error_message,
            timestamp: new Date().toISOString()
          }
        })
    }
  }
}
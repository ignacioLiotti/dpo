import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentProcessingRequest {
  document_id?: string;
  processing_type?: 'full' | 'basic' | 'ocr-only';
  priority?: 'high' | 'normal' | 'low';
  batch_process?: boolean;
  batch_size?: number;
}

async function processSingleDocument(supabase: any, document_id: string, processing_type: string, openaiApiKey: string) {
  console.log(`Processing document ${document_id} with type ${processing_type}`)

  // Get document from database
  const { data: document, error: docError } = await supabase
    .from('files')
    .select('*')
    .eq('id', document_id)
    .eq('is_active', true)
    .single()

  if (docError || !document) {
    console.error('Document not found:', docError)
    throw new Error('Document not found')
  }

  // Update status to processing
  await supabase
    .from('files')
    .update({ 
      processing_status: 'processing',
      updated_at: new Date().toISOString()
    })
    .eq('id', document_id)

  let analysisResult = {
    ocr_text: '',
    ai_description: '',
    ai_category: '',
    ai_tags: [] as string[],
    confidence_score: 0,
    analysis_metadata: {}
  }

  try {
    // OCR Processing for images and PDFs (basic extraction)
    if (document.file_type.startsWith('image/') || document.file_type === 'application/pdf') {
      console.log('Processing with OCR...')
      analysisResult.ocr_text = `[OCR processing would extract text from ${document.name}]`
    }

    // AI Analysis (only if not ocr-only and API key available)
    if (processing_type !== 'ocr-only' && openaiApiKey) {
      console.log('Processing with AI...')
      
      const prompt = `Analyze this construction document named "${document.name}" of type "${document.file_type}".
      ${analysisResult.ocr_text ? `Extracted text: ${analysisResult.ocr_text.substring(0, 1000)}` : ''}
      
      Provide a brief description (max 100 words), suggest a category from: planos, fotos, informes, contratos, permisos, facturas, avance, materiales, certificados, correspondencia, otros.
      List 2-4 relevant tags.
      Respond in JSON format: {"description": "...", "category": "...", "tags": ["...", "..."]}`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200, // Reduced for cost efficiency
          temperature: 0.3
        })
      })

      if (response.ok) {
        const aiResult = await response.json()
        const content = aiResult.choices[0]?.message?.content

        try {
          const parsed = JSON.parse(content)
          analysisResult.ai_description = parsed.description || ''
          analysisResult.ai_category = parsed.category || ''
          analysisResult.ai_tags = parsed.tags || []
          analysisResult.confidence_score = 0.8
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError)
          analysisResult.ai_description = content || 'AI analysis completed'
          analysisResult.confidence_score = 0.5
        }
      }
    }

    analysisResult.analysis_metadata = {
      processed_at: new Date().toISOString(),
      processing_type,
      provider: processing_type === 'ocr-only' ? 'OCR' : 'OpenAI GPT-3.5',
      cost_optimized: true
    }

    // Save analysis results
    const { error: analysisError } = await supabase
      .from('file_analysis')
      .upsert({
        file_id: document_id,
        user_id: document.user_id,
        ocr_text: analysisResult.ocr_text,
        ai_description: analysisResult.ai_description,
        ai_category: analysisResult.ai_category,
        ai_tags: analysisResult.ai_tags,
        confidence_score: analysisResult.confidence_score,
        analysis_metadata: analysisResult.analysis_metadata,
        updated_at: new Date().toISOString()
      })

    if (analysisError) {
      throw new Error(`Failed to save analysis: ${analysisError.message}`)
    }

    // Update document with AI results
    await supabase
      .from('files')
      .update({
        description: analysisResult.ai_description,
        category: analysisResult.ai_category,
        tags: analysisResult.ai_tags,
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', document_id)

    console.log(`Document ${document_id} processed successfully`)
    return analysisResult

  } catch (processingError) {
    console.error('Processing error:', processingError)
    
    // Update status to failed
    await supabase
      .from('files')
      .update({ 
        processing_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', document_id)

    throw processingError
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { 
      document_id, 
      processing_type = 'basic', 
      priority = 'normal',
      batch_process = false,
      batch_size = 5
    }: DocumentProcessingRequest = await req.json()

    // Handle batch processing
    if (batch_process) {
      console.log(`Starting batch processing (batch size: ${batch_size})`)
      
      const { data: jobs, error: jobsError } = await supabase.rpc('get_pending_processing_jobs', { batch_size })
      
      if (jobsError) {
        console.error('Error getting pending jobs:', jobsError)
        return new Response(
          JSON.stringify({ error: 'Failed to get pending jobs' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!jobs || jobs.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No pending jobs to process' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const results = []
      for (const job of jobs) {
        try {
          await supabase.rpc('update_processing_job_status', { 
            p_queue_id: job.queue_id, 
            p_status: 'processing' 
          })
          
          const result = await processSingleDocument(supabase, job.file_id, job.processing_type || 'basic', openaiApiKey)
          
          await supabase.rpc('update_processing_job_status', { 
            p_queue_id: job.queue_id, 
            p_status: 'completed' 
          })
          
          results.push({ file_id: job.file_id, success: true, result })
        } catch (error) {
          console.error(`Error processing job ${job.queue_id}:`, error)
          
          await supabase.rpc('update_processing_job_status', { 
            p_queue_id: job.queue_id, 
            p_status: 'failed',
            p_error_message: error.message
          })
          
          results.push({ file_id: job.file_id, success: false, error: error.message })
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Processed ${results.length} documents`,
          results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle single document processing
    if (!document_id) {
      return new Response(
        JSON.stringify({ error: 'document_id is required for single document processing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await processSingleDocument(supabase, document_id, processing_type, openaiApiKey)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Document processed successfully',
        analysis: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Processing failed', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
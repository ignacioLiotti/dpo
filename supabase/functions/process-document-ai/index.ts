import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced logging function
function log(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

interface DocumentProcessingRequest {
  document_id?: string;
  processing_type?: 'full' | 'basic' | 'ocr-only';
  priority?: 'high' | 'normal' | 'low';
  batch_process?: boolean;
  batch_size?: number;
}

async function processSingleDocument(supabase: any, document_id: string, processing_type: string, openaiApiKey: string) {
  log('INFO', `Starting document processing`, { document_id, processing_type });

  // Get document from database with folder information
  const { data: document, error: docError } = await supabase
    .from('files')
    .select(`
      *,
      file_folder_assignments (
        folder_id,
        folder:folder_id (
          id,
          name,
          extract_data
        )
      )
    `)
    .eq('id', document_id)
    .eq('is_active', true)
    .single()

  if (docError || !document) {
    log('ERROR', 'Document not found', { document_id, error: docError });
    throw new Error('Document not found')
  }

  // Check if document is in a folder with extraction enabled
  const folderAssignment = document.file_folder_assignments?.[0];
  const folderData = folderAssignment?.folder;
  const hasExtraction = folderData?.extract_data || false;
  
  log('INFO', 'Document context', {
    document_name: document.name,
    folder_name: folderData?.name,
    has_extraction: hasExtraction,
    processing_type
  });

  // Update status to processing
  await supabase
    .from('files')
    .update({ 
      processing_status: 'processing',
      updated_at: new Date().toISOString()
    })
    .eq('id', document_id)

  // Generate signed URL for document processing
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from('organization-files')
    .createSignedUrl(document.storage_path, 3600);

  if (urlError || !signedUrlData) {
    log('ERROR', 'Failed to generate signed URL', { document_id, error: urlError });
    throw new Error('Failed to generate document URL');
  }

  log('INFO', 'Generated signed URL for processing', { document_id, url_length: signedUrlData.signedUrl.length });

  let analysisResult = {
    ocr_text: '',
    ai_description: '',
    ai_category: '',
    ai_tags: [] as string[],
    confidence_score: 0,
    analysis_metadata: {}
  }

  try {
    // Enhanced OCR Processing using actual vision models
    if (document.file_type.startsWith('image/') || document.file_type === 'application/pdf') {
      log('INFO', 'Starting OCR processing', { file_type: document.file_type });
      
      if (document.file_type.startsWith('image/')) {
        // Process image with GPT-4 Vision
        const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract ALL readable text from this image. Return only the extracted text, maintaining the original structure and formatting as much as possible.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: signedUrlData.signedUrl
                  }
                }
              ]
            }],
            max_tokens: 4000,
            temperature: 0.1
          })
        });

        if (visionResponse.ok) {
          const visionResult = await visionResponse.json();
          analysisResult.ocr_text = visionResult.choices[0]?.message?.content || '';
          log('INFO', 'OCR extraction completed', { text_length: analysisResult.ocr_text.length });
        } else {
          log('WARN', 'OCR processing failed, using filename analysis', { document_id });
          analysisResult.ocr_text = `Document: ${document.name}\nFile type: ${document.file_type}`;
        }
      } else {
        // For PDFs, use filename analysis for now
        analysisResult.ocr_text = `PDF Document: ${document.name}\nFile type: ${document.file_type}\nNote: Advanced PDF OCR requires specialized processing.`;
      }
    }

    // AI Analysis (only if not ocr-only and API key available)
    if (processing_type !== 'ocr-only' && openaiApiKey) {
      log('INFO', 'Starting AI analysis', { has_ocr_text: !!analysisResult.ocr_text });
      
      const prompt = `Analyze this construction document named "${document.name}" of type "${document.file_type}".
      ${analysisResult.ocr_text ? `Extracted text: ${analysisResult.ocr_text.substring(0, 2000)}` : ''}
      
      Provide a brief description (max 150 words), suggest a category from: planos, fotos, informes, contratos, permisos, facturas, avance, materiales, certificados, correspondencia, otros.
      List 3-5 relevant tags in Spanish that describe the content.
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
          max_tokens: 300,
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
          log('INFO', 'AI analysis completed', { 
            description_length: analysisResult.ai_description.length,
            category: analysisResult.ai_category,
            tags_count: analysisResult.ai_tags.length
          });
        } catch (parseError) {
          log('WARN', 'Failed to parse AI response, using raw content', { parseError });
          analysisResult.ai_description = content || 'AI analysis completed'
          analysisResult.confidence_score = 0.5
        }
      } else {
        log('ERROR', 'AI analysis failed', { status: response.status, statusText: response.statusText });
      }
    }

    // Enhanced structured data extraction for folders with extraction enabled
    if (hasExtraction && folderData && analysisResult.ocr_text) {
      log('INFO', 'Starting structured data extraction', { folder_id: folderData.id });
      
      // Get field definitions for this folder
      const { data: fieldDefinitions, error: fieldsError } = await supabase
        .from('folder_field_definitions')
        .select('*')
        .eq('folder_id', folderData.id)
        .eq('is_active', true)
        .order('sort_order');

      if (!fieldsError && fieldDefinitions && fieldDefinitions.length > 0) {
        log('INFO', 'Found field definitions', { count: fieldDefinitions.length });
        
        // Create extraction prompt
        const extractionPrompt = `Extract the following fields from this document text:

${fieldDefinitions.map(field => `- ${field.field_label} (${field.field_type}): ${field.extraction_pattern || 'Extract relevant value'}`).join('\n')}

Document text:
${analysisResult.ocr_text}

Return a JSON object with the field names as keys and extracted values. Use null for fields not found.
Field names: ${fieldDefinitions.map(f => f.field_name).join(', ')}`;

        const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: extractionPrompt }],
            max_tokens: 500,
            temperature: 0.1
          })
        });

        if (extractionResponse.ok) {
          const extractionResult = await extractionResponse.json();
          const extractedContent = extractionResult.choices[0]?.message?.content;
          
          try {
            const extractedData = JSON.parse(extractedContent);
            log('INFO', 'Structured extraction completed', { extracted_fields: Object.keys(extractedData) });
            
            // Save extracted data
            const { error: extractionError } = await supabase
              .from('extracted_data')
              .upsert({
                file_id: document_id,
                folder_id: folderData.id,
                user_id: document.user_id,
                extracted_value: JSON.stringify(extractedData),
                confidence_score: 0.8,
                is_verified: false,
                extraction_metadata: {
                  provider: 'OpenAI GPT-3.5',
                  processed_at: new Date().toISOString(),
                  field_count: Object.keys(extractedData).length,
                  extraction_method: 'ai_structured'
                }
              }, { onConflict: 'file_id' });

            if (extractionError) {
              log('ERROR', 'Failed to save extracted data', { error: extractionError });
            } else {
              log('INFO', 'Successfully saved extracted data', { document_id, field_count: Object.keys(extractedData).length });
            }
          } catch (parseError) {
            log('ERROR', 'Failed to parse extraction result', { parseError, content: extractedContent });
          }
        } else {
          log('ERROR', 'Structured extraction failed', { status: extractionResponse.status });
        }
      } else {
        log('INFO', 'No field definitions found for folder', { folder_id: folderData.id });
      }
    }

    analysisResult.analysis_metadata = {
      processed_at: new Date().toISOString(),
      processing_type,
      provider: processing_type === 'ocr-only' ? 'OCR' : 'OpenAI GPT-3.5',
      cost_optimized: true,
      has_structured_extraction: hasExtraction,
      folder_id: folderData?.id || null,
      folder_name: folderData?.name || null,
      ocr_text_length: analysisResult.ocr_text.length,
      confidence_score: analysisResult.confidence_score
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

    log('INFO', 'Document processing completed successfully', {
      document_id,
      processing_type,
      has_description: !!analysisResult.ai_description,
      has_tags: analysisResult.ai_tags.length > 0,
      ocr_text_length: analysisResult.ocr_text.length,
      confidence_score: analysisResult.confidence_score
    });
    
    return analysisResult

  } catch (processingError) {
    log('ERROR', 'Document processing failed', {
      document_id,
      error: processingError.message,
      stack: processingError.stack
    });
    
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
      log('INFO', 'Starting batch processing', { batch_size });
      
      const { data: jobs, error: jobsError } = await supabase.rpc('get_pending_processing_jobs', { batch_size })
      
      if (jobsError) {
        log('ERROR', 'Error getting pending jobs', { error: jobsError });
        return new Response(
          JSON.stringify({ error: 'Failed to get pending jobs' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!jobs || jobs.length === 0) {
        log('INFO', 'No pending jobs to process');
        return new Response(
          JSON.stringify({ message: 'No pending jobs to process' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      log('INFO', 'Processing jobs', { job_count: jobs.length });
      const results = []
      
      for (const job of jobs) {
        try {
          log('INFO', 'Starting job processing', { 
            queue_id: job.queue_id, 
            file_id: job.file_id, 
            file_name: job.file_name,
            processing_type: job.processing_type 
          });
          
          await supabase.rpc('update_processing_job_status', { 
            p_queue_id: job.queue_id, 
            p_status: 'processing' 
          })
          
          const result = await processSingleDocument(supabase, job.file_id, job.processing_type || 'basic', openaiApiKey)
          
          await supabase.rpc('update_processing_job_status', { 
            p_queue_id: job.queue_id, 
            p_status: 'completed' 
          })
          
          log('INFO', 'Job completed successfully', { queue_id: job.queue_id, file_id: job.file_id });
          results.push({ file_id: job.file_id, success: true, result })
        } catch (error) {
          log('ERROR', 'Job processing failed', { 
            queue_id: job.queue_id, 
            file_id: job.file_id, 
            error: error.message 
          });
          
          await supabase.rpc('update_processing_job_status', { 
            p_queue_id: job.queue_id, 
            p_status: 'failed',
            p_error_message: error.message
          })
          
          results.push({ file_id: job.file_id, success: false, error: error.message })
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      log('INFO', 'Batch processing completed', {
        total_jobs: results.length,
        successful: successCount,
        failed: failureCount
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Processed ${results.length} documents (${successCount} successful, ${failureCount} failed)`,
          results,
          stats: {
            total: results.length,
            successful: successCount,
            failed: failureCount
          }
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
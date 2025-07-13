-- Setup background processing with cron jobs for AI document processing
-- Migration: 20250713000005_setup_background_processing.sql

-- =============================================================================
-- PROCESSING QUEUE TABLE
-- =============================================================================

-- Create a queue table for background processing
CREATE TABLE IF NOT EXISTS public.processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    processing_type TEXT NOT NULL DEFAULT 'full' CHECK (processing_type IN ('full', 'basic', 'ocr-only')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure no duplicate processing requests
    UNIQUE(file_id, processing_type)
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_processing_queue_status_priority ON public.processing_queue(status, priority, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_processing_queue_org_status ON public.processing_queue(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_processing_queue_file_id ON public.processing_queue(file_id);

-- RLS policies
ALTER TABLE public.processing_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's processing queue" ON public.processing_queue
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = processing_queue.organization_id
    AND om.is_active = true
  )
);

CREATE POLICY "Users can insert processing jobs for their organization" ON public.processing_queue
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = processing_queue.organization_id
    AND om.is_active = true
  )
);

-- =============================================================================
-- PROCESSING FUNCTIONS
-- =============================================================================

-- Function to add a document to the processing queue
CREATE OR REPLACE FUNCTION public.enqueue_document_processing(
  p_file_id UUID,
  p_processing_type TEXT DEFAULT 'full',
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
  v_file_record RECORD;
BEGIN
  -- Get file details and verify access
  SELECT f.*, om.organization_id INTO v_file_record
  FROM public.files f
  JOIN public.organization_memberships om ON om.organization_id = f.organization_id
  WHERE f.id = p_file_id 
    AND om.user_id = auth.uid() 
    AND om.is_active = true
    AND f.is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'File not found or access denied';
  END IF;

  -- Insert into processing queue (or update if exists)
  INSERT INTO public.processing_queue (
    file_id,
    organization_id,
    user_id,
    processing_type,
    priority,
    status,
    scheduled_at
  ) VALUES (
    p_file_id,
    v_file_record.organization_id,
    auth.uid(),
    p_processing_type,
    p_priority,
    'pending',
    NOW()
  )
  ON CONFLICT (file_id, processing_type) DO UPDATE SET
    priority = EXCLUDED.priority,
    status = 'pending',
    attempts = 0,
    error_message = NULL,
    scheduled_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next batch of documents to process
CREATE OR REPLACE FUNCTION public.get_pending_processing_jobs(batch_size INTEGER DEFAULT 5)
RETURNS TABLE (
  queue_id UUID,
  file_id UUID,
  organization_id UUID,
  processing_type TEXT,
  priority TEXT,
  file_name TEXT,
  file_type TEXT,
  storage_path TEXT,
  attempts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pq.id as queue_id,
    pq.file_id,
    pq.organization_id,
    pq.processing_type,
    pq.priority,
    f.name as file_name,
    f.file_type,
    f.storage_path,
    pq.attempts
  FROM public.processing_queue pq
  JOIN public.files f ON f.id = pq.file_id
  WHERE pq.status = 'pending'
    AND pq.attempts < pq.max_attempts
    AND pq.scheduled_at <= NOW()
    AND f.is_active = true
  ORDER BY 
    CASE pq.priority 
      WHEN 'high' THEN 1 
      WHEN 'normal' THEN 2 
      WHEN 'low' THEN 3 
    END,
    pq.scheduled_at ASC
  LIMIT batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update processing job status
CREATE OR REPLACE FUNCTION public.update_processing_job_status(
  p_queue_id UUID,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.processing_queue
  SET 
    status = p_status,
    error_message = p_error_message,
    started_at = CASE WHEN p_status = 'processing' THEN NOW() ELSE started_at END,
    completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE completed_at END,
    attempts = CASE WHEN p_status = 'failed' THEN attempts + 1 ELSE attempts END,
    updated_at = NOW()
  WHERE id = p_queue_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGER TO AUTO-ENQUEUE NEW DOCUMENTS
-- =============================================================================

-- Function to automatically enqueue new documents for processing
CREATE OR REPLACE FUNCTION public.auto_enqueue_document()
RETURNS TRIGGER AS $$
BEGIN
  -- Only enqueue if document is newly created (not updated)
  IF TG_OP = 'INSERT' THEN
    -- Enqueue with basic processing by default to optimize costs
    INSERT INTO public.processing_queue (
      file_id,
      organization_id,
      user_id,
      processing_type,
      priority,
      status,
      scheduled_at
    ) VALUES (
      NEW.id,
      NEW.organization_id,
      NEW.user_id,
      'basic', -- Start with basic processing for cost efficiency
      'normal',
      'pending',
      NOW() + INTERVAL '30 seconds' -- Small delay to ensure file is fully uploaded
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on files table
DROP TRIGGER IF EXISTS trigger_auto_enqueue_document ON public.files;
CREATE TRIGGER trigger_auto_enqueue_document
  AFTER INSERT ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_enqueue_document();

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.enqueue_document_processing(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_processing_jobs(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_processing_job_status(UUID, TEXT, TEXT) TO service_role;

-- =============================================================================
-- CRON JOB SETUP (REQUIRES pg_cron EXTENSION)
-- =============================================================================

-- Note: The following cron job needs to be set up manually or via Supabase Dashboard
-- This is because pg_cron requires superuser privileges

/*
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule background processing job to run every 2 minutes
SELECT cron.schedule(
  'process-documents-ai',
  '*/2 * * * *', -- Every 2 minutes
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/process-document-ai',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{"batch_process": true}'::jsonb
  );
  $$
);
*/

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.processing_queue IS 'Queue for background AI document processing jobs';
COMMENT ON FUNCTION public.enqueue_document_processing(UUID, TEXT, TEXT) IS 'Add a document to the AI processing queue';
COMMENT ON FUNCTION public.get_pending_processing_jobs(INTEGER) IS 'Get next batch of documents to process (service role only)';
COMMENT ON FUNCTION public.update_processing_job_status(UUID, TEXT, TEXT) IS 'Update the status of a processing job (service role only)';

-- =============================================================================
-- COST OPTIMIZATION SETTINGS
-- =============================================================================

-- Create a settings table for processing configuration
CREATE TABLE IF NOT EXISTS public.processing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, setting_key)
);

ALTER TABLE public.processing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's processing settings" ON public.processing_settings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = processing_settings.organization_id
    AND om.is_active = true
  )
);

-- Insert default cost-optimization settings
INSERT INTO public.processing_settings (organization_id, setting_key, setting_value)
SELECT 
  o.id,
  'ai_processing_config',
  '{
    "default_processing_type": "basic",
    "max_daily_ai_calls": 100,
    "prefer_batch_processing": true,
    "enable_smart_queueing": true,
    "cost_limit_per_month": 50
  }'::jsonb
FROM public.organizations o
ON CONFLICT (organization_id, setting_key) DO NOTHING;
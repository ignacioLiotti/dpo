'use client';

import { createClient } from '@/supabase/client';
import { toast } from 'sonner';

interface ProcessingEvent {
  type: 'upload_started' | 'upload_completed' | 'processing_started' | 'processing_completed' | 'processing_failed' | 'extraction_completed';
  documentId: string;
  fileName: string;
  progress?: number;
  metadata?: any;
}

interface ProcessingListener {
  id: string;
  callback: (event: ProcessingEvent) => void;
}

export class DocumentProcessingOrchestrator {
  private supabase;
  private listeners: ProcessingListener[] = [];
  private subscriptions: any[] = [];
  private activeProcessing: Set<string> = new Set();

  constructor() {
    this.supabase = createClient();
  }

  // Add event listener
  addListener(callback: (event: ProcessingEvent) => void): string {
    const id = Math.random().toString(36).substring(7);
    this.listeners.push({ id, callback });
    return id;
  }

  // Remove event listener
  removeListener(id: string) {
    this.listeners = this.listeners.filter(l => l.id !== id);
  }

  // Emit event to all listeners
  private emit(event: ProcessingEvent) {
    this.listeners.forEach(listener => {
      try {
        listener.callback(event);
      } catch (error) {
        console.error('Error in processing listener:', error);
      }
    });
  }

  // Start monitoring for a specific document
  async startMonitoring(documentId: string) {
    if (this.activeProcessing.has(documentId)) {
      return; // Already monitoring
    }

    this.activeProcessing.add(documentId);

    // Set up real-time subscription for this document
    const subscription = this.supabase
      .channel(`document-processing-${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'files',
          filter: `id=eq.${documentId}`,
        },
        (payload) => {
          this.handleFileUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'file_analysis',
          filter: `file_id=eq.${documentId}`,
        },
        (payload) => {
          this.handleAnalysisUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'extracted_data',
          filter: `file_id=eq.${documentId}`,
        },
        (payload) => {
          this.handleExtractionUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'processing_queue',
          filter: `file_id=eq.${documentId}`,
        },
        (payload) => {
          this.handleQueueUpdate(payload);
        }
      )
      .subscribe();

    this.subscriptions.push(subscription);
  }

  // Stop monitoring for a specific document
  async stopMonitoring(documentId: string) {
    this.activeProcessing.delete(documentId);
    
    // Remove specific subscriptions for this document
    this.subscriptions = this.subscriptions.filter(sub => {
      if (sub.channel === `document-processing-${documentId}`) {
        sub.unsubscribe();
        return false;
      }
      return true;
    });
  }

  // Handle file table updates
  private async handleFileUpdate(payload: any) {
    const { new: newRecord, old: oldRecord } = payload;
    
    // Get file name
    const fileName = newRecord.name || 'Unknown file';
    
    // Check for processing status changes
    if (oldRecord?.processing_status !== newRecord.processing_status) {
      const event: ProcessingEvent = {
        type: this.getEventTypeFromStatus(newRecord.processing_status),
        documentId: newRecord.id,
        fileName,
        metadata: {
          oldStatus: oldRecord?.processing_status,
          newStatus: newRecord.processing_status,
          updatedAt: newRecord.updated_at
        }
      };
      
      this.emit(event);
      
      // Show toast notifications
      this.showStatusNotification(fileName, newRecord.processing_status);
    }
  }

  // Handle file analysis updates
  private async handleAnalysisUpdate(payload: any) {
    const { new: newRecord, old: oldRecord } = payload;
    
    if (payload.eventType === 'INSERT' || (oldRecord && newRecord.updated_at !== oldRecord.updated_at)) {
      // Get file name
      const { data: file } = await this.supabase
        .from('files')
        .select('name')
        .eq('id', newRecord.file_id)
        .single();
      
      const fileName = file?.name || 'Unknown file';
      
      const event: ProcessingEvent = {
        type: 'processing_completed',
        documentId: newRecord.file_id,
        fileName,
        metadata: {
          hasDescription: !!newRecord.ai_description,
          hasTags: newRecord.ai_tags?.length > 0,
          confidenceScore: newRecord.confidence_score,
          ocrTextLength: newRecord.ocr_text?.length || 0
        }
      };
      
      this.emit(event);
      
      // Show success notification
      toast.success(`🤖 AI analysis completed for "${fileName}"`, {
        description: newRecord.ai_description ? newRecord.ai_description.substring(0, 100) + '...' : 'Analysis completed',
        duration: 5000,
      });
    }
  }

  // Handle extracted data updates
  private async handleExtractionUpdate(payload: any) {
    const { new: newRecord, old: oldRecord } = payload;
    
    if (payload.eventType === 'INSERT' || (oldRecord && newRecord.updated_at !== oldRecord.updated_at)) {
      // Get file name
      const { data: file } = await this.supabase
        .from('files')
        .select('name')
        .eq('id', newRecord.file_id)
        .single();
      
      const fileName = file?.name || 'Unknown file';
      
      let extractedData = {};
      try {
        extractedData = JSON.parse(newRecord.extracted_value || '{}');
      } catch (e) {
        console.error('Failed to parse extracted data:', e);
      }
      
      const event: ProcessingEvent = {
        type: 'extraction_completed',
        documentId: newRecord.file_id,
        fileName,
        metadata: {
          extractedFields: Object.keys(extractedData).length,
          confidenceScore: newRecord.confidence_score,
          isVerified: newRecord.is_verified,
          extractedData
        }
      };
      
      this.emit(event);
      
      // Show extraction success notification
      toast.success(`📊 Data extraction completed for "${fileName}"`, {
        description: `Extracted ${Object.keys(extractedData).length} fields`,
        duration: 5000,
      });
    }
  }

  // Handle processing queue updates
  private async handleQueueUpdate(payload: any) {
    const { new: newRecord, old: oldRecord } = payload;
    
    if (oldRecord?.status !== newRecord.status) {
      // Get file name
      const { data: file } = await this.supabase
        .from('files')
        .select('name')
        .eq('id', newRecord.file_id)
        .single();
      
      const fileName = file?.name || 'Unknown file';
      
      // Handle queue status changes
      if (newRecord.status === 'processing') {
        const event: ProcessingEvent = {
          type: 'processing_started',
          documentId: newRecord.file_id,
          fileName,
          metadata: {
            queueId: newRecord.id,
            processingType: newRecord.processing_type,
            priority: newRecord.priority
          }
        };
        
        this.emit(event);
        
        toast.info(`🔄 Processing started for "${fileName}"`, {
          description: `Type: ${newRecord.processing_type} | Priority: ${newRecord.priority}`,
          duration: 3000,
        });
      } else if (newRecord.status === 'failed') {
        const event: ProcessingEvent = {
          type: 'processing_failed',
          documentId: newRecord.file_id,
          fileName,
          metadata: {
            error: newRecord.error_message,
            attempts: newRecord.attempts,
            maxAttempts: newRecord.max_attempts
          }
        };
        
        this.emit(event);
        
        toast.error(`❌ Processing failed for "${fileName}"`, {
          description: newRecord.error_message || 'Unknown error',
          duration: 8000,
        });
      }
    }
  }

  // Convert processing status to event type
  private getEventTypeFromStatus(status: string): ProcessingEvent['type'] {
    switch (status) {
      case 'pending':
        return 'upload_completed';
      case 'processing':
        return 'processing_started';
      case 'completed':
        return 'processing_completed';
      case 'failed':
        return 'processing_failed';
      default:
        return 'upload_completed';
    }
  }

  // Show status notification
  private showStatusNotification(fileName: string, status: string) {
    switch (status) {
      case 'pending':
        toast.info(`📝 "${fileName}" queued for processing`, {
          duration: 2000,
        });
        break;
      case 'processing':
        toast.loading(`🔄 Processing "${fileName}"...`, {
          duration: 3000,
        });
        break;
      case 'completed':
        toast.success(`✅ "${fileName}" processed successfully`, {
          duration: 4000,
        });
        break;
      case 'failed':
        toast.error(`❌ Processing failed for "${fileName}"`, {
          duration: 6000,
        });
        break;
    }
  }

  // Manually trigger processing for a document
  async triggerProcessing(documentId: string, processingType: 'full' | 'basic' | 'ocr-only' = 'full', priority: 'high' | 'normal' | 'low' = 'normal') {
    try {
      const { data, error } = await this.supabase.rpc('enqueue_document_processing', {
        p_file_id: documentId,
        p_processing_type: processingType,
        p_priority: priority
      });

      if (error) {
        throw error;
      }

      toast.success('Processing queued successfully', {
        description: `Priority: ${priority} | Type: ${processingType}`,
        duration: 3000,
      });

      return data;
    } catch (error) {
      console.error('Failed to trigger processing:', error);
      toast.error('Failed to queue processing', {
        description: error instanceof Error ? error.message : 'Unknown error',
        duration: 5000,
      });
      throw error;
    }
  }

  // Get processing status for a document
  async getProcessingStatus(documentId: string) {
    try {
      const { data: file, error } = await this.supabase
        .from('files')
        .select(`
          processing_status,
          name,
          updated_at,
          processing_queue (
            status,
            priority,
            processing_type,
            attempts,
            error_message
          )
        `)
        .eq('id', documentId)
        .single();

      if (error) {
        throw error;
      }

      return {
        fileStatus: file.processing_status,
        fileName: file.name,
        updatedAt: file.updated_at,
        queueStatus: file.processing_queue?.[0] || null
      };
    } catch (error) {
      console.error('Failed to get processing status:', error);
      throw error;
    }
  }

  // Cleanup - unsubscribe from all channels
  cleanup() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
    this.subscriptions = [];
    this.activeProcessing.clear();
    this.listeners = [];
  }
}
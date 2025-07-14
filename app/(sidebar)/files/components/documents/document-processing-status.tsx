'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/supabase/client';
import { Clock, CheckCircle, AlertCircle, Bot, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentProcessingStatusProps {
  documentId: string;
  onStatusChange?: (status: string) => void;
  showDetails?: boolean;
}

interface ProcessingStatus {
  processing_status: string;
  file_name: string;
  updated_at: string;
  analysis?: {
    ai_description?: string;
    ai_tags?: string[];
    ocr_text?: string;
    confidence_score?: number;
  };
  extractedData?: any;
}

export function DocumentProcessingStatus({ 
  documentId, 
  onStatusChange, 
  showDetails = false 
}: DocumentProcessingStatusProps) {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let subscription: any;

    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('files')
          .select(`
            processing_status,
            name,
            updated_at,
            file_analysis (
              ai_description,
              ai_tags,
              ocr_text,
              confidence_score
            ),
            extracted_data (
              extracted_value
            )
          `)
          .eq('id', documentId)
          .single();

        if (error) {
          console.error('Error fetching document status:', error);
          setError(error.message);
          return;
        }

        const analysis = data.file_analysis?.[0];
        const extractedData = data.extracted_data?.[0];

        const statusData: ProcessingStatus = {
          processing_status: data.processing_status,
          file_name: data.name,
          updated_at: data.updated_at,
          analysis: analysis || undefined,
          extractedData: extractedData ? JSON.parse(extractedData.extracted_value || '{}') : undefined,
        };

        setStatus(statusData);
        onStatusChange?.(data.processing_status);

        // Show toast notifications for status changes
        if (data.processing_status === 'completed' && analysis) {
          toast.success(`🤖 AI analysis completed for "${data.name}"`, {
            duration: 5000,
          });
        } else if (data.processing_status === 'failed') {
          toast.error(`❌ Processing failed for "${data.name}"`, {
            duration: 5000,
          });
        }
      } catch (err) {
        console.error('Error fetching document status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up real-time subscription
    subscription = supabase
      .channel(`document-${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'files',
          filter: `id=eq.${documentId}`,
        },
        (payload) => {
          console.log('Document status update:', payload);
          fetchStatus(); // Refetch to get complete data
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
          console.log('Analysis update:', payload);
          fetchStatus(); // Refetch to get complete data
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
          console.log('Extracted data update:', payload);
          fetchStatus(); // Refetch to get complete data
        }
      )
      .subscribe();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [documentId, onStatusChange]);

  const getStatusIcon = () => {
    switch (status?.processing_status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status?.processing_status) {
      case 'pending':
        return 'Queued for processing';
      case 'processing':
        return 'AI analysis in progress...';
      case 'completed':
        return 'AI analysis completed';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (status?.processing_status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading status...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <AlertCircle className="h-4 w-4" />
        Error loading status
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 text-sm px-2 py-1 rounded-md ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="font-medium">{getStatusText()}</span>
        {status.processing_status === 'processing' && (
          <Bot className="h-4 w-4 text-blue-500 animate-pulse" />
        )}
      </div>

      {showDetails && status.processing_status === 'completed' && status.analysis && (
        <div className="space-y-2 text-sm">
          {status.analysis.ai_description && (
            <div className="p-2 bg-gray-50 rounded text-xs">
              <strong>AI Description:</strong> {status.analysis.ai_description}
            </div>
          )}
          
          {status.analysis.ai_tags && status.analysis.ai_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {status.analysis.ai_tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {status.extractedData && Object.keys(status.extractedData).length > 0 && (
            <div className="p-2 bg-green-50 rounded text-xs">
              <strong>Extracted Fields:</strong>
              <ul className="mt-1 space-y-1">
                {Object.entries(status.extractedData).map(([key, value]) => (
                  <li key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span>{String(value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {status.analysis.confidence_score && (
            <div className="text-xs text-gray-500">
              Confidence: {Math.round(status.analysis.confidence_score * 100)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}
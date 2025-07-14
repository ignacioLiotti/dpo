'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/supabase/client';
import { Clock, CheckCircle, AlertCircle, Bot, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SimpleProcessingStatusProps {
  documentId: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SimpleProcessingStatus({ 
  documentId, 
  showText = true, 
  size = 'md' 
}: SimpleProcessingStatusProps) {
  const [status, setStatus] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('files')
          .select('processing_status')
          .eq('id', documentId)
          .single();

        if (error) {
          console.error('Error fetching status:', error);
          return;
        }

        setStatus(data.processing_status || 'pending');
      } catch (err) {
        console.error('Error fetching status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`file-status-${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'files',
          filter: `id=eq.${documentId}`,
        },
        (payload) => {
          if (payload.new?.processing_status) {
            setStatus(payload.new.processing_status);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [documentId]);

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          text: 'Queued',
          variant: 'secondary' as const
        };
      case 'processing':
        return {
          icon: Bot,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          text: 'Processing',
          variant: 'default' as const,
          animate: true
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          text: 'Completed',
          variant: 'default' as const
        };
      case 'failed':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          text: 'Failed',
          variant: 'destructive' as const
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          text: 'Unknown',
          variant: 'secondary' as const
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;
  
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 className={`${iconSize} animate-spin text-gray-400`} />
        {showText && <span className="text-sm text-gray-500">Loading...</span>}
      </div>
    );
  }

  if (!showText) {
    return (
      <div className={`p-1 rounded-full ${config.bgColor}`}>
        <IconComponent 
          className={`${iconSize} ${config.color} ${config.animate ? 'animate-pulse' : ''}`} 
        />
      </div>
    );
  }

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <IconComponent 
        className={`${iconSize} ${config.animate ? 'animate-pulse' : ''}`} 
      />
      {config.text}
    </Badge>
  );
}
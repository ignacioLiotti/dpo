// hooks/use-document-status-polling.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UseDocumentStatusPollingOptions {
  documents: any[];
  currentFolder: any;
  onStatusUpdate?: (documentId: string, status: string) => void;
  pollingInterval?: number;
}

export function useDocumentStatusPolling({
  documents,
  currentFolder,
  onStatusUpdate,
  pollingInterval = 3000
}: UseDocumentStatusPollingOptions) {
  const router = useRouter();
  const pollTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const completedDocuments = useRef<Set<string>>(new Set());

  // Check a single document's status
  const checkDocumentStatus = useCallback(async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/status`);
      if (!response.ok) return;
      
      const { status, hasExtractedData } = await response.json();
      
      // If status changed to completed and this is the first time we see it
      if (status === 'completed' && !completedDocuments.current.has(documentId)) {
        completedDocuments.current.add(documentId);
        
        // Show success notification
        if (currentFolder?.extract_data && hasExtractedData) {
          toast.success('✨ Document processed and fields extracted!', {
            description: 'The extracted data is now available.',
            duration: 4000,
          });
        } else {
          toast.success('✅ Document processing completed!', {
            duration: 3000,
          });
        }
        
        // Call the optional callback
        onStatusUpdate?.(documentId, status);
        
        // Refresh the page data
        router.refresh();
        
        // Stop polling for this document
        return true; // indicates polling should stop
      }
      
      // If failed, also stop polling
      if (status === 'failed') {
        toast.error('❌ Document processing failed', {
          description: 'Please try uploading again.',
          duration: 4000,
        });
        return true; // stop polling
      }
      
      return false; // continue polling
    } catch (error) {
      console.error('Error checking document status:', error);
      return false;
    }
  }, [currentFolder, router, onStatusUpdate]);

  // Start polling for a document
  const startPolling = useCallback((documentId: string) => {
    // Don't poll if already completed
    if (completedDocuments.current.has(documentId)) return;
    
    // Clear any existing timeout
    const existingTimeout = pollTimeouts.current.get(documentId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const poll = async () => {
      const shouldStop = await checkDocumentStatus(documentId);
      
      if (!shouldStop) {
        // Continue polling
        const timeout = setTimeout(poll, pollingInterval);
        pollTimeouts.current.set(documentId, timeout);
      } else {
        // Clean up
        pollTimeouts.current.delete(documentId);
      }
    };

    // Start polling
    poll();
  }, [checkDocumentStatus, pollingInterval]);

  // Monitor documents for processing status
  useEffect(() => {
    // Find documents that are processing or pending
    const processingDocs = documents.filter(doc => 
      doc.processing_status === 'processing' || 
      doc.processing_status === 'pending'
    );

    // Start polling for each processing document
    processingDocs.forEach(doc => {
      startPolling(doc.id);
    });

    // Cleanup function
    return () => {
      // Clear all timeouts
      pollTimeouts.current.forEach(timeout => clearTimeout(timeout));
      pollTimeouts.current.clear();
    };
  }, [documents, startPolling]);

  // Manual refresh function
  const refreshAll = useCallback(() => {
    router.refresh();
  }, [router]);

  return {
    refreshAll,
    processingCount: pollTimeouts.current.size
  };
}
'use client';

import { useEffect, useRef, useState } from 'react';
import { DocumentProcessingOrchestrator } from '../services/document-processing-orchestrator';

interface ProcessingEvent {
  type: 'upload_started' | 'upload_completed' | 'processing_started' | 'processing_completed' | 'processing_failed' | 'extraction_completed';
  documentId: string;
  fileName: string;
  progress?: number;
  metadata?: any;
}

interface ProcessingState {
  [documentId: string]: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    fileName: string;
    lastUpdated: Date;
    progress?: number;
    metadata?: any;
    error?: string;
  };
}

export function useDocumentProcessing() {
  const orchestratorRef = useRef<DocumentProcessingOrchestrator | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({});
  const [isReady, setIsReady] = useState(false);

  // Initialize orchestrator
  useEffect(() => {
    if (!orchestratorRef.current) {
      orchestratorRef.current = new DocumentProcessingOrchestrator();
      setIsReady(true);
    }

    return () => {
      if (orchestratorRef.current) {
        orchestratorRef.current.cleanup();
        orchestratorRef.current = null;
      }
    };
  }, []);

  // Add event listener
  const addProcessingListener = (callback: (event: ProcessingEvent) => void): string | null => {
    if (!orchestratorRef.current) return null;
    return orchestratorRef.current.addListener(callback);
  };

  // Remove event listener
  const removeProcessingListener = (id: string) => {
    if (!orchestratorRef.current) return;
    orchestratorRef.current.removeListener(id);
  };

  // Start monitoring a document
  const startMonitoring = (documentId: string) => {
    if (!orchestratorRef.current) return;
    
    orchestratorRef.current.startMonitoring(documentId);
    
    // Add to processing state
    setProcessingState(prev => ({
      ...prev,
      [documentId]: {
        status: 'pending',
        fileName: 'Loading...',
        lastUpdated: new Date(),
      }
    }));
  };

  // Stop monitoring a document
  const stopMonitoring = (documentId: string) => {
    if (!orchestratorRef.current) return;
    
    orchestratorRef.current.stopMonitoring(documentId);
    
    // Remove from processing state
    setProcessingState(prev => {
      const newState = { ...prev };
      delete newState[documentId];
      return newState;
    });
  };

  // Trigger processing for a document
  const triggerProcessing = async (
    documentId: string, 
    processingType: 'full' | 'basic' | 'ocr-only' = 'full', 
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) => {
    if (!orchestratorRef.current) throw new Error('Orchestrator not ready');
    return orchestratorRef.current.triggerProcessing(documentId, processingType, priority);
  };

  // Get processing status for a document
  const getProcessingStatus = async (documentId: string) => {
    if (!orchestratorRef.current) throw new Error('Orchestrator not ready');
    return orchestratorRef.current.getProcessingStatus(documentId);
  };

  // Update processing state from events
  useEffect(() => {
    if (!orchestratorRef.current || !isReady) return;

    const listenerId = orchestratorRef.current.addListener((event: ProcessingEvent) => {
      setProcessingState(prev => ({
        ...prev,
        [event.documentId]: {
          status: event.type === 'processing_started' ? 'processing' :
                 event.type === 'processing_completed' ? 'completed' :
                 event.type === 'processing_failed' ? 'failed' :
                 event.type === 'upload_completed' ? 'pending' : 'pending',
          fileName: event.fileName,
          lastUpdated: new Date(),
          progress: event.progress,
          metadata: event.metadata,
          error: event.type === 'processing_failed' ? event.metadata?.error : undefined,
        }
      }));
    });

    return () => {
      if (orchestratorRef.current && listenerId) {
        orchestratorRef.current.removeListener(listenerId);
      }
    };
  }, [isReady]);

  return {
    isReady,
    processingState,
    startMonitoring,
    stopMonitoring,
    triggerProcessing,
    getProcessingStatus,
    addProcessingListener,
    removeProcessingListener,
  };
}

// Hook for monitoring multiple documents
export function useDocumentProcessingBatch(documentIds: string[]) {
  const { 
    isReady, 
    processingState, 
    startMonitoring, 
    stopMonitoring, 
    triggerProcessing,
    getProcessingStatus 
  } = useDocumentProcessing();

  // Monitor all documents
  useEffect(() => {
    if (!isReady) return;

    documentIds.forEach(id => {
      startMonitoring(id);
    });

    return () => {
      documentIds.forEach(id => {
        stopMonitoring(id);
      });
    };
  }, [documentIds, isReady]);

  // Get processing states for all documents
  const batchState = documentIds.reduce((acc, id) => {
    acc[id] = processingState[id] || {
      status: 'pending',
      fileName: 'Unknown',
      lastUpdated: new Date(),
    };
    return acc;
  }, {} as ProcessingState);

  // Trigger processing for all documents
  const triggerBatchProcessing = async (
    processingType: 'full' | 'basic' | 'ocr-only' = 'full',
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) => {
    const results = await Promise.allSettled(
      documentIds.map(id => triggerProcessing(id, processingType, priority))
    );

    return results.map((result, index) => ({
      documentId: documentIds[index],
      success: result.status === 'fulfilled',
      error: result.status === 'rejected' ? result.reason : null,
    }));
  };

  return {
    isReady,
    batchState,
    triggerBatchProcessing,
    getProcessingStatus,
  };
}

// Hook for monitoring a single document
export function useDocumentProcessingSingle(documentId: string) {
  const { 
    isReady, 
    processingState, 
    startMonitoring, 
    stopMonitoring, 
    triggerProcessing,
    getProcessingStatus 
  } = useDocumentProcessing();

  // Monitor this document
  useEffect(() => {
    if (!isReady || !documentId) return;

    startMonitoring(documentId);

    return () => {
      stopMonitoring(documentId);
    };
  }, [documentId, isReady]);

  const documentState = processingState[documentId] || {
    status: 'pending' as const,
    fileName: 'Unknown',
    lastUpdated: new Date(),
  };

  const triggerDocumentProcessing = (
    processingType: 'full' | 'basic' | 'ocr-only' = 'full',
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) => triggerProcessing(documentId, processingType, priority);

  const getDocumentStatus = () => getProcessingStatus(documentId);

  return {
    isReady,
    documentState,
    triggerDocumentProcessing,
    getDocumentStatus,
  };
}
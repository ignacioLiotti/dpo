'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getObraDocumentsWithFolders,
  getObraFolders,
  uploadDocumentsAction,
  updateDocumentAction,
  deleteDocumentAction,
  createFolderAction,
} from '@/lib/actions/document-actions';
import type { ObraDocument, Folder } from '@/lib/schemas/document-schemas';
import { useMemo, useCallback } from 'react';

// Query Keys - Centralized for consistency
export const queryKeys = {
  documents: (obraId: string) => ['documents', obraId] as const,
  folders: (obraId: string) => ['folders', obraId] as const,
  documentUrl: (documentId: string) => ['document-url', documentId] as const,
  obraData: (obraId: string) => ['obra-data', obraId] as const,
  foldersInit: (obraId: string) => ['folders-init', obraId] as const,
};

// Hook for fetching documents with optimized folder initialization
export function useObraDocuments(obraId: string) {
  const queryClient = useQueryClient();

  // First query: Initialize folders if needed (runs once per obra)
  const foldersInitQuery = useQuery({
    queryKey: queryKeys.foldersInit(obraId),
    queryFn: async () => {
      const foldersResult = await getObraFolders(obraId);
      if ('error' in foldersResult && foldersResult.error) {
        throw new Error(String(foldersResult.error));
      }
      
      return true; // Just a success flag
    },
    enabled: !!obraId,
    staleTime: Infinity, // Only run once per session
    gcTime: Infinity,
  });

  // Main query: Fetch documents and folders (depends on folders being initialized)
  const dataQuery = useQuery({
    queryKey: queryKeys.obraData(obraId),
    queryFn: async () => {
      const [documentsResult, foldersResult] = await Promise.all([
        getObraDocumentsWithFolders(obraId),
        getObraFolders(obraId),
      ]);

      if ('error' in documentsResult && documentsResult.error) {
        throw new Error(String(documentsResult.error));
      }
      if ('error' in foldersResult && foldersResult.error) {
        throw new Error(String(foldersResult.error));
      }

      return {
        documents: documentsResult.documents || [],
        folders: foldersResult.folders || [],
      };
    },
    enabled: !!obraId && foldersInitQuery.isSuccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return useMemo(() => ({
    documents: dataQuery.data?.documents || [],
    folders: dataQuery.data?.folders || [],
    isLoading: foldersInitQuery.isLoading || dataQuery.isLoading,
    isError: foldersInitQuery.isError || dataQuery.isError,
    error: foldersInitQuery.error || dataQuery.error,
    refetch: () => {
      foldersInitQuery.refetch();
      dataQuery.refetch();
    },
  }), [
    dataQuery.data?.documents,
    dataQuery.data?.folders,
    foldersInitQuery.isLoading,
    dataQuery.isLoading,
    foldersInitQuery.isError,
    dataQuery.isError,
    foldersInitQuery.error,
    dataQuery.error,
  ]);
}

// Hook for document mutations with optimistic updates
export function useDocumentMutations(obraId: string) {
  const queryClient = useQueryClient();

  // Upload documents mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: {
      files: File[];
      category?: string;
      folder_id?: string;
      description?: string;
    }) => {
      // Convert File objects to the expected format
      const processedFiles = await Promise.all(
        data.files.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            content: base64,
          };
        })
      );

      const result = await uploadDocumentsAction({
        obra_id: obraId,
        files: processedFiles,
        category: data.category,
        folder_id: data.folder_id,
        description: data.description,
      });
      if (!result?.data?.success) {
        throw new Error('Upload failed');
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate both initialization and data queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.obraData(obraId),
      });
      toast.success('Documentos subidos correctamente');
    },
    onError: (error) => {
      toast.error(`Error al subir documentos: ${error.message}`);
    },
  });

  // Update document mutation
  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      description?: string;
      category?: string;
      folder_id?: string;
    }) => {
      const result = await updateDocumentAction(data);
      if (!result?.data?.success) {
        throw new Error('Update failed');
      }
      return result.data;
    },
    onMutate: async (updatedDoc) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.obraData(obraId),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<{documents: ObraDocument[], folders: Folder[]}>(
        queryKeys.obraData(obraId)
      );

      // Optimistically update documents
      if (previousData) {
        queryClient.setQueryData(
          queryKeys.obraData(obraId),
          {
            ...previousData,
            documents: previousData.documents.map((doc) =>
              doc.id === updatedDoc.id ? { ...doc, ...updatedDoc } : doc
            ),
          }
        );
      }

      return { previousData };
    },
    onError: (error, updatedDoc, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.obraData(obraId),
          context.previousData
        );
      }
      toast.error(`Error al actualizar documento: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Documento actualizado');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: queryKeys.obraData(obraId),
      });
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const result = await deleteDocumentAction({ id: documentId });
      if (!result?.data?.success) {
        throw new Error('Delete failed');
      }
      return result.data;
    },
    onMutate: async (documentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.obraData(obraId),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<{documents: ObraDocument[], folders: Folder[]}>(
        queryKeys.obraData(obraId)
      );

      // Optimistically remove document
      if (previousData) {
        queryClient.setQueryData(
          queryKeys.obraData(obraId),
          {
            ...previousData,
            documents: previousData.documents.filter((doc) => doc.id !== documentId),
          }
        );
      }

      return { previousData };
    },
    onError: (error, documentId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.obraData(obraId),
          context.previousData
        );
      }
      toast.error(`Error al eliminar documento: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('Documento eliminado');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: queryKeys.obraData(obraId),
      });
    },
  });

  return {
    uploadDocuments: uploadMutation.mutate,
    updateDocument: updateMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Hook for folder mutations
export function useFolderMutations(obraId: string) {
  const queryClient = useQueryClient();

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string; icon?: string; parent_id?: string }) => {
      const result = await createFolderAction({
        ...data,
      });
      if (!result?.data?.success) {
        throw new Error('Create folder failed');
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate both queries when folders change
      queryClient.invalidateQueries({
        queryKey: queryKeys.obraData(obraId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.foldersInit(obraId),
      });
      toast.success('Carpeta creada correctamente');
    },
    onError: (error) => {
      toast.error(`Error al crear carpeta: ${error.message}`);
    },
  });

  return {
    createFolder: createFolderMutation.mutate,
    isCreatingFolder: createFolderMutation.isPending,
  };
}

// Hook for document download URLs with caching
export function useDocumentUrl(documentId: string | null) {
  return useQuery({
    queryKey: queryKeys.documentUrl(documentId || ''),
    queryFn: async () => {
      if (!documentId) return null;
      // TODO: Implement getDocumentDownloadUrl function
      return null;
    },
    enabled: !!documentId,
    staleTime: 2 * 60 * 1000, // 2 minutes (URLs expire)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for batch operations (useful for folder management)
export function useBatchOperations(obraId: string) {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.obraData(obraId),
    });
  };

  const prefetchDocumentUrl = (documentId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.documentUrl(documentId),
      queryFn: () => null, // TODO: Implement getDocumentDownloadUrl function
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    invalidateAll,
    prefetchDocumentUrl,
  };
} 
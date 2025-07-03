import { create } from 'zustand';
import { supabase } from '../../supabase/client';
import { deleteDocumentAction } from '../../lib/actions/vault-actions';

export interface VaultFile {
  id: string;
  created_at: string;
  updated_at: string;
  type: string; // MIME type
  obra_id: string;
  user_id: string;
  size: number;
  name: string; // Original filename
  path: string[]; // Storage path array
  description?: string;
  category?: string;
  folder?: string;
  is_public: boolean;
  tags: string[];
  version: number;
  checksum?: string;
  ocr_content?: string; // OCR extracted text
}

export interface VaultFilter {
  search?: string;
  category?: string;
  folder?: string;
}

interface VaultState {
  files: VaultFile[];
  loading: boolean;
  error: string | null;
  filter: VaultFilter;
  
  // Actions
  setFiles: (files: VaultFile[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: VaultFilter) => void;
  
  // Async actions
  fetchFiles: (obraId: string, folder?: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
}

export const useVault = create<VaultState>((set, get) => ({
  files: [],
  loading: false,
  error: null,
  filter: {},

  setFiles: (files) => set({ files }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilter: (filter) => set({ filter }),

  fetchFiles: async (obraId: string, folder?: string) => {
    set({ loading: true, error: null });

    try {
      let query = (supabase as any)
        .from('obra_documents')
        .select('*')
        .eq('obra_id', obraId)
        .order('created_at', { ascending: false });

      // Apply folder filter if specified
      if (folder) {
        query = query.eq('folder', folder);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ files: (data as VaultFile[]) || [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch files',
        loading: false 
      });
    }
  },

  deleteFile: async (fileId: string) => {
    set({ loading: true, error: null });
    
    try {
      // Find the file to get storage path
      const fileToDelete = get().files.find(f => f.id === fileId);
      if (!fileToDelete) {
        throw new Error('File not found');
      }

      const storagePath = fileToDelete.path.join('/');

      // Use server action to delete
      const result = await deleteDocumentAction({
        document_id: fileId,
        storage_path: storagePath,
      });

      if (!result?.data?.success) {
        throw new Error('Failed to delete document');
      }

      // Remove from local state
      set({ 
        files: get().files.filter(f => f.id !== fileId),
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete file',
        loading: false 
      });
    }
  },
}));
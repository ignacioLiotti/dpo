// Types for obra file management system

export interface ObraDocument {
  id: string;
  created_at: string;
  updated_at: string;
  obra_id: string;
  name: string;
  type: string;
  size: number;
  path: string[];
  url?: string;
  description?: string;
  category?: string;
  tags?: string[];
  is_public: boolean;
  version: number;
  checksum?: string;
  user_id: string;
  folder_id?: string;
  ocr_content?: string;
  extracted_data?: Record<string, any>;
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  processing_metadata?: Record<string, any>;
}

export interface Folder {
  id: string;
  created_at: string;
  updated_at: string;
  obra_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  user_id: string;
  color?: string;
  icon?: string;
  extract_data?: boolean; // Whether data extraction is enabled
}

export interface FolderFieldDefinition {
  id: string;
  created_at: string;
  updated_at: string;
  folder_id: string;
  obra_id: string;
  user_id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'email' | 'phone';
  field_label: string;
  field_description?: string;
  extraction_method: 'regex' | 'ai' | 'hybrid';
  extraction_pattern: string;
  validation_pattern?: string;
  is_required: boolean;
  default_value?: string;
  sort_order: number;
  is_active: boolean;
}

export interface DocumentExtractedData {
  id: string;
  created_at: string;
  updated_at: string;
  document_id: string;
  folder_id: string;
  user_id: string;
  extracted_data: Record<string, any>;
  extraction_confidence: number;
  field_count: number;
  extraction_metadata: Record<string, any>;
}

export interface CreateDocumentInput {
  obra_id: string;
  files: File[];
  category?: string;
  description?: string;
  tags?: string[];
  folder_id?: string;
}

export interface UpdateDocumentInput {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  folder_id?: string;
}

export interface CreateFolderInput {
  obra_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
}

export interface UpdateFolderInput {
  id: string;
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export type ViewMode = 'cards' | 'table' | 'tree';

export interface DocumentFilters {
  search?: string;
  category?: string;
  folder?: string;
  tags?: string[];
}

export interface FolderCounts {
  [folderId: string]: number;
}

// Document category types
export const DOCUMENT_CATEGORIES = [
  { id: 'planos', name: 'Planos', icon: '📐', color: 'blue' },
  { id: 'fotos', name: 'Fotos', icon: '📸', color: 'green' },
  { id: 'informes', name: 'Informes', icon: '📋', color: 'yellow' },
  { id: 'contratos', name: 'Contratos', icon: '📄', color: 'purple' },
  { id: 'permisos', name: 'Permisos', icon: '✅', color: 'cyan' },
  { id: 'facturas', name: 'Facturas', icon: '🧾', color: 'orange' },
  { id: 'avance', name: 'Avance de Obra', icon: '📊', color: 'red' },
  { id: 'materiales', name: 'Materiales', icon: '🧱', color: 'brown' },
  { id: 'certificados', name: 'Certificados', icon: '🏆', color: 'gold' },
  { id: 'correspondencia', name: 'Correspondencia', icon: '✉️', color: 'pink' },
  { id: 'otros', name: 'Otros', icon: '📁', color: 'gray' }
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number]['id'];
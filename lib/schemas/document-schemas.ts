import { z } from 'zod';

// Document categories enum
export const DOCUMENT_CATEGORIES = [
  { id: 'planos', name: 'Planos', icon: '📐', color: 'bg-blue-500' },
  { id: 'fotos', name: 'Fotos', icon: '📸', color: 'bg-green-500' },
  { id: 'informes', name: 'Informes', icon: '📋', color: 'bg-purple-500' },
  { id: 'contratos', name: 'Contratos', icon: '📝', color: 'bg-yellow-500' },
  { id: 'permisos', name: 'Permisos', icon: '🏛️', color: 'bg-red-500' },
  { id: 'facturas', name: 'Facturas', icon: '🧾', color: 'bg-indigo-500' },
  { id: 'avance_obra', name: 'Avance de Obra', icon: '🏗️', color: 'bg-orange-500' },
  { id: 'materiales', name: 'Materiales', icon: '🧱', color: 'bg-amber-500' },
  { id: 'certificados', name: 'Certificados', icon: '🏆', color: 'bg-emerald-500' },
  { id: 'correspondencia', name: 'Correspondencia', icon: '✉️', color: 'bg-cyan-500' },
  { id: 'otros', name: 'Otros', icon: '📁', color: 'bg-gray-500' },
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number]['id'];

// Folder type definition
export interface Folder {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  obra_id: string;
  user_id: string;
  color: string;
  icon: string;
  is_default: boolean;
  sort_order: number;
}

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp', 
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
  'application/dwg',
  'application/dxf'
] as const;

// Upload document schema - updated to use folder_id instead of folder name
export const uploadDocumentSchema = z.object({
  obra_id: z.string().uuid(),
  files: z.array(z.instanceof(File)).min(1, 'Al menos un archivo es requerido'),
  category: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder_id: z.string().uuid().optional(), // Changed from folder string to folder_id UUID
});

export type UploadDocumentFormValues = z.infer<typeof uploadDocumentSchema>;

// Update document schema
export const updateDocumentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'El nombre es requerido').optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder_id: z.string().uuid().optional(), // Changed from folder string to folder_id UUID
  is_public: z.boolean().optional(),
});

export type UpdateDocumentFormValues = z.infer<typeof updateDocumentSchema>;

// Delete document schema
export const deleteDocumentSchema = z.object({
  id: z.string().uuid('ID de documento inválido'),
});

export type DeleteDocumentFormValues = z.infer<typeof deleteDocumentSchema>;

// Document type definition - updated to include folder information
export interface ObraDocument {
  id: string;
  created_at: string;
  updated_at: string;
  type: string;
  obra_id: string;
  user_id: string;
  size: number;
  name: string;
  path: string[];
  description?: string;
  category: string;
  is_public: boolean;
  tags: string[];
  version: number;
  checksum?: string;
  folder?: string; // Keep for backward compatibility during migration
  // New folder properties from the view
  folder_id?: string;
  folder_name?: string;
  folder_color?: string;
  folder_icon?: string;
}

// Document upload options
export interface DocumentUploadOptions {
  bucketName: string;
  path: string[];
  allowedMimeTypes: string[];
  maxFileSize: number;
  maxFiles: number;
}

// Document category display names
export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  planos: 'Planos',
  fotos: 'Fotos',
  informes: 'Informes', 
  contratos: 'Contratos',
  permisos: 'Permisos',
  facturas: 'Facturas',
  avance_obra: 'Avance de Obra',
  materiales: 'Materiales',
  certificados: 'Certificados',
  correspondencia: 'Correspondencia',
  otros: 'Otros'
};

// File type icons mapping
export const FILE_TYPE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/webp': '🖼️',
  'image/gif': '🖼️',
  'application/msword': '📄',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📄',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-powerpoint': '📽️',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📽️',
  'text/plain': '📃',
  'text/csv': '📊',
  'application/zip': '🗜️',
  'application/x-rar-compressed': '🗜️',
  'application/dwg': '📐',
  'application/dxf': '📐',
};

// Standard folders that can be auto-created for each obra
export const STANDARD_FOLDERS = [
  { name: 'Sin Clasificar', icon: '📂', color: '#6B7280', isDefault: true },
  { name: 'Documentos Legales', icon: '⚖️', color: '#DC2626' },
  { name: 'Planos y Diseños', icon: '📐', color: '#2563EB' },
  { name: 'Fotografías', icon: '📷', color: '#16A34A' },
  { name: 'Reportes', icon: '📊', color: '#7C3AED' },
  { name: 'Correspondencia', icon: '✉️', color: '#0891B2' },
] as const;

// New schemas for folder management - updated to work with proper folder table
export const createFolderSchema = z.object({
  obra_id: z.string().uuid(),
  name: z.string().min(1, 'El nombre de la carpeta es requerido').max(100, 'Nombre muy largo'),
  color: z.string().optional().default('#6B7280'),
  icon: z.string().optional().default('📁'),
});

export const updateFolderSchema = z.object({
  id: z.string().uuid(), // Changed from obra_id + oldName to just folder id
  name: z.string().min(1, 'El nombre de la carpeta es requerido').max(100, 'Nombre muy largo'),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const deleteFolderSchema = z.object({
  id: z.string().uuid(), // Changed from obra_id + folderName to just folder id
  move_to_folder_id: z.string().uuid().optional(), // Where to move documents when deleting folder
});

export const moveFolderDocumentsSchema = z.object({
  document_ids: z.array(z.string().uuid()),
  target_folder_id: z.string().uuid(),
});

export const addDocumentsToFolderSchema = z.object({
  folder_id: z.string().uuid(),
  document_ids: z.array(z.string().uuid()),
});

export const removeDocumentsFromFolderSchema = z.object({
  folder_id: z.string().uuid(),
  document_ids: z.array(z.string().uuid()),
});

export type CreateFolderFormValues = z.infer<typeof createFolderSchema>;
export type UpdateFolderFormValues = z.infer<typeof updateFolderSchema>;
export type DeleteFolderFormValues = z.infer<typeof deleteFolderSchema>;
export type MoveFolderDocumentsFormValues = z.infer<typeof moveFolderDocumentsSchema>;
export type AddDocumentsToFolderFormValues = z.infer<typeof addDocumentsToFolderSchema>;
export type RemoveDocumentsFromFolderFormValues = z.infer<typeof removeDocumentsFromFolderSchema>; 
import { z } from 'zod';
import { ALLOWED_MIME_TYPES, DOCUMENT_CATEGORIES } from '../schema';

// =============================================================================
// BASE SCHEMAS - Reusable building blocks
// =============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Organization ID schema (optional as it comes from context)
 */
export const organizationIdSchema = z.string().uuid().optional();

/**
 * File upload schema
 */
export const fileSchema = z.instanceof(File)
  .refine(file => file.size > 0, 'File cannot be empty')
  .refine(file => file.size <= 100 * 1024 * 1024, 'File size must be less than 100MB')
  .refine(
    file => ALLOWED_MIME_TYPES.includes(file.type as any), 
    'File type not allowed'
  );

/**
 * Document category schema
 */
export const documentCategorySchema = z.enum(
  DOCUMENT_CATEGORIES.map(cat => cat.id) as [string, ...string[]]
);

/**
 * Tags schema
 */
export const tagsSchema = z.array(z.string().trim()).optional();

/**
 * Color hex schema
 */
export const colorSchema = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format')
  .optional()
  .default('#3B82F6');

/**
 * Icon emoji schema
 */
export const iconSchema = z.string()
  .min(1)
  .max(4) // Most emojis are 1-2 chars, some are up to 4
  .optional()
  .default('📁');

// =============================================================================
// DOCUMENT SCHEMAS
// =============================================================================

/**
 * Upload documents schema
 */
export const uploadDocumentsSchema = z.object({
  organization_id: organizationIdSchema,
  files: z.array(fileSchema).min(1, 'At least one file is required'),
  category: documentCategorySchema.optional(),
  description: z.string().max(500).optional(),
  tags: tagsSchema,
  folder_id: uuidSchema.optional(),
});

/**
 * Update document schema
 */
export const updateDocumentSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().max(500).optional(),
  category: documentCategorySchema.optional(),
  tags: tagsSchema,
  folder_id: uuidSchema.nullable().optional(),
  is_public: z.boolean().optional(),
});

/**
 * Delete document schema
 */
export const deleteDocumentSchema = z.object({
  id: uuidSchema,
});

/**
 * Document search schema
 */
export const searchDocumentsSchema = z.object({
  query: z.string().min(1).max(100),
  folder_id: uuidSchema.optional(),
  category: documentCategorySchema.optional(),
  file_type: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

// =============================================================================
// FOLDER SCHEMAS
// =============================================================================

/**
 * Create folder schema
 */
export const createFolderSchema = z.object({
  organization_id: organizationIdSchema,
  name: z.string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name too long')
    .regex(/^[^/\\:*?"<>|]+$/, 'Folder name contains invalid characters'),
  description: z.string().max(500).optional(),
  parent_id: uuidSchema.optional(),
  color: colorSchema,
  icon: iconSchema,
  extract_data: z.boolean().optional().default(false),
});

/**
 * Update folder schema
 */
export const updateFolderSchema = z.object({
  id: uuidSchema,
  name: z.string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name too long')
    .regex(/^[^/\\:*?"<>|]+$/, 'Folder name contains invalid characters')
    .optional(),
  description: z.string().max(500).optional(),
  color: colorSchema,
  icon: iconSchema,
  extract_data: z.boolean().optional(),
});

/**
 * Delete folder schema
 */
export const deleteFolderSchema = z.object({
  id: uuidSchema,
  move_to_folder_id: uuidSchema.optional(), // Where to move documents when deleting
});

// =============================================================================
// FOLDER FIELD DEFINITION SCHEMAS
// =============================================================================

/**
 * Field types enum
 */
export const fieldTypeEnum = z.enum([
  'text', 'number', 'date', 'currency', 'boolean', 
  'email', 'phone', 'textarea', 'select', 'multiselect'
]);

/**
 * Extraction method enum
 */
export const extractionMethodEnum = z.enum(['regex', 'ai', 'hybrid', 'manual']);

/**
 * Create field definition schema
 */
export const createFieldDefinitionSchema = z.object({
  folder_id: uuidSchema,
  field_name: z.string()
    .min(1, 'Field name is required')
    .max(50)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with letter and contain only letters, numbers, and underscores'),
  field_label: z.string().min(1, 'Field label is required').max(100),
  field_type: fieldTypeEnum,
  field_description: z.string().max(500).optional(),
  extraction_method: extractionMethodEnum,
  extraction_pattern: z.string().min(1, 'Extraction pattern is required'),
  validation_pattern: z.string().optional(),
  default_value: z.string().optional(),
  is_required: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional(),
});

/**
 * Update field definition schema
 */
export const updateFieldDefinitionSchema = createFieldDefinitionSchema.partial().extend({
  id: uuidSchema,
});

// =============================================================================
// BATCH OPERATION SCHEMAS
// =============================================================================

/**
 * Batch document update schema
 */
export const batchUpdateDocumentsSchema = z.object({
  document_ids: z.array(uuidSchema).min(1, 'At least one document ID is required'),
  updates: z.object({
    folder_id: uuidSchema.optional(),
    category: documentCategorySchema.optional(),
    tags: tagsSchema,
    is_public: z.boolean().optional(),
  }),
});

/**
 * Batch document delete schema
 */
export const batchDeleteDocumentsSchema = z.object({
  document_ids: z.array(uuidSchema).min(1, 'At least one document ID is required'),
  permanent: z.boolean().optional().default(false), // Soft delete by default
});

/**
 * Batch move documents schema
 */
export const batchMoveDocumentsSchema = z.object({
  document_ids: z.array(uuidSchema).min(1, 'At least one document ID is required'),
  target_folder_id: uuidSchema.nullable(), // null means move to root
});

// =============================================================================
// PROCESSING SCHEMAS
// =============================================================================

/**
 * Document processing schema
 */
export const processDocumentSchema = z.object({
  document_id: uuidSchema,
  provider: z.enum(['gpt', 'mistral', 'ocr-only']),
  force_reprocess: z.boolean().optional().default(false),
});

/**
 * Batch processing schema
 */
export const batchProcessDocumentsSchema = z.object({
  document_ids: z.array(uuidSchema).min(1).max(10), // Limit batch size
  provider: z.enum(['gpt', 'mistral', 'ocr-only']),
  skip_processed: z.boolean().optional().default(true),
});

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

/**
 * Parse and validate FormData with a schema
 */
export function parseFormData<T>(
  formData: FormData,
  schema: z.ZodSchema<T>
): { data: T | null; error: string | null } {
  try {
    // Convert FormData to object
    const rawData: any = {};
    
    formData.forEach((value, key) => {
      // Handle multiple values (like file arrays)
      if (key === 'files' && value instanceof File) {
        if (!rawData.files) rawData.files = [];
        rawData.files.push(value);
      } else if (key === 'tags' && typeof value === 'string') {
        // Parse comma-separated tags
        rawData.tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
      } else {
        rawData[key] = value;
      }
    });

    const validated = schema.parse(rawData);
    return { data: validated, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { data: null, error: messages.join(', ') };
    }
    return { data: null, error: 'Invalid input data' };
  }
}

/**
 * Create a safe action wrapper with validation
 */
export function createValidatedAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (data: TInput) => Promise<TOutput>
) {
  return async (input: unknown): Promise<{ success: boolean; data?: TOutput; error?: string }> => {
    try {
      const validated = schema.parse(input);
      const result = await handler(validated);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') 
        };
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };
}

// Export type inference utilities
export type UploadDocumentsInput = z.infer<typeof uploadDocumentsSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type CreateFieldDefinitionInput = z.infer<typeof createFieldDefinitionSchema>;
export type BatchUpdateDocumentsInput = z.infer<typeof batchUpdateDocumentsSchema>;
export type ProcessDocumentInput = z.infer<typeof processDocumentSchema>;
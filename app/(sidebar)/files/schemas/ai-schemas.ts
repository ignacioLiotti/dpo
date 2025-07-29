import { z } from 'zod';

// Document categories used in the system
export const DOCUMENT_CATEGORIES = [
  'planos',
  'fotos',
  'informes',
  'contratos',
  'permisos',
  'facturas',
  'avance',
  'materiales',
  'certificados',
  'correspondencia',
  'otros'
] as const;

// 1. OCR Text Extraction Schema - Used for pure text extraction from images
export const ocrExtractionSchema = z.object({
  extractedText: z.string()
    .describe('All text extracted from the document, preserving structure and formatting'),
  confidence: z.number()
    .min(0)
    .max(1)
    .default(0.9)
    .describe('Confidence score of the extraction quality'),
  hasHandwriting: z.boolean()
    .default(false)
    .describe('Whether handwritten text was detected in the document'),
  language: z.string()
    .default('es')
    .describe('Primary language detected in the document (ISO 639-1 code)'),
  pageCount: z.number()
    .int()
    .positive()
    .default(1)
    .describe('Number of pages processed'),
});

export type OCRExtraction = z.infer<typeof ocrExtractionSchema>;

// 2. Document Analysis Schema - Used for analyzing document content
export const documentAnalysisSchema = z.object({
  ocrText: z.string()
    .describe('Raw extracted text from the document'),
  description: z.string()
    .max(500)
    .describe('Search-optimized description focusing on keywords someone might search for'),
  category: z.enum(DOCUMENT_CATEGORIES)
    .describe('Document category classification'),
  tags: z.array(z.string().toLowerCase())
    .min(3)
    .max(10)
    .describe('Relevant search tags in Spanish, lowercase, specific terms'),
  summary: z.string()
    .max(200)
    .optional()
    .describe('Brief summary of the document content'),
  documentType: z.string()
    .optional()
    .describe('Specific document type (e.g., "Factura de materiales", "Plano arquitectónico")'),
  dateFound: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe('Date found in the document in YYYY-MM-DD format'),
});

export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

// 3. Combined OCR and Analysis Schema - For single-pass processing
export const ocrWithAnalysisSchema = z.object({
  // OCR fields
  ocrText: z.string()
    .describe('All text extracted from the document'),
  
  // Analysis fields
  description: z.string()
    .max(500)
    .describe('Search-optimized description of the document'),
  category: z.enum(DOCUMENT_CATEGORIES)
    .describe('Document category'),
  tags: z.array(z.string().toLowerCase())
    .min(3)
    .max(10)
    .describe('Relevant search tags in Spanish'),
  
  // Metadata
  confidence: z.number()
    .min(0)
    .max(1)
    .default(0.9)
    .describe('Overall confidence score'),
  hasStructuredData: z.boolean()
    .default(false)
    .describe('Whether the document contains tables or structured data'),
});

export type OCRWithAnalysis = z.infer<typeof ocrWithAnalysisSchema>;

// 4. Field type mapping for dynamic field extraction
export const FieldTypeSchema = {
  text: z.string(),
  number: z.number(),
  currency: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  datetime: z.string().datetime(),
  boolean: z.boolean(),
  select: z.string(),
  multiselect: z.array(z.string()),
  email: z.string().email(),
  phone: z.string(),
  url: z.string().url(),
  percentage: z.number().min(0).max(100),
};

// 5. Create dynamic field extraction schema based on field definitions
export interface FieldDefinition {
  id: string;
  field_name: string;
  field_label: string;
  field_type: keyof typeof FieldTypeSchema;
  extraction_pattern?: string;
  is_required: boolean;
  validation_rules?: Record<string, any>;
}

export function createFieldExtractionSchema(fieldDefinitions: FieldDefinition[]) {
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  
  fieldDefinitions.forEach(field => {
    // Get the base schema for the field type
    let fieldSchema = FieldTypeSchema[field.field_type] || z.string();
    
    // Apply custom validation rules if provided
    if (field.validation_rules) {
      if (field.validation_rules.min && 'min' in fieldSchema) {
        fieldSchema = (fieldSchema as any).min(field.validation_rules.min);
      }
      if (field.validation_rules.max && 'max' in fieldSchema) {
        fieldSchema = (fieldSchema as any).max(field.validation_rules.max);
      }
      if (field.validation_rules.pattern && fieldSchema instanceof z.ZodString) {
        fieldSchema = fieldSchema.regex(new RegExp(field.validation_rules.pattern));
      }
    }
    
    // Make optional if not required
    schemaShape[field.field_name] = field.is_required 
      ? fieldSchema.describe(`${field.field_label} (required)`)
      : fieldSchema.nullable().describe(`${field.field_label} (optional)`);
  });
  
  return z.object(schemaShape);
}

// 6. Batch extraction result schema
export const batchExtractionResultSchema = z.object({
  extracted_fields: z.record(z.any())
    .describe('Extracted field values'),
  confidence_scores: z.record(z.number().min(0).max(1))
    .describe('Confidence score for each field'),
  validation_status: z.record(z.enum(['valid', 'invalid', 'missing']))
    .describe('Validation status for each field'),
  warnings: z.array(z.string())
    .optional()
    .describe('Any warnings during extraction'),
});

export type BatchExtractionResult = z.infer<typeof batchExtractionResultSchema>;

// 7. Error response schema for graceful fallbacks
export const aiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().describe('Error message'),
  fallbackResult: z.any().optional().describe('Fallback result if available'),
  retryable: z.boolean().default(true).describe('Whether the operation can be retried'),
});

export type AIErrorResponse = z.infer<typeof aiErrorResponseSchema>;

// 8. Processing result schema (matches existing interface)
export const processingResultSchema = z.object({
  ocrText: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  extractedData: z.record(z.any()).optional(),
  confidence: z.number().min(0).max(1),
  provider: z.string(),
});

export type ProcessingResult = z.infer<typeof processingResultSchema>;

// Helper function to validate and clean tags
export function validateTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => tag.length > 2 && tag.length < 30)
    .filter((tag, index, self) => self.indexOf(tag) === index) // Remove duplicates
    .slice(0, 10); // Max 10 tags
}

// Helper to generate fallback result when AI fails
export function generateFallbackResult(fileName: string, error?: string): ProcessingResult {
  return {
    ocrText: '',
    description: `Document: ${fileName}`,
    tags: ['documento', 'sin-procesar', 'revision-manual'],
    confidence: 0.1,
    provider: 'fallback',
    extractedData: error ? { error } : undefined,
  };
}
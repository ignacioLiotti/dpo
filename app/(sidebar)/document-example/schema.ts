import { z } from 'zod';

// Zod schemas for validation
export const createExampleDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  content: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.coerce.date().optional(),
  metadata: z.record(z.any()).optional()
});

export const updateExampleDocumentSchema = createExampleDocumentSchema.partial().extend({
  id: z.string().uuid()
});

export const deleteExampleDocumentSchema = z.object({
  id: z.string().uuid()
});

export const getExampleDocumentSchema = z.object({
  id: z.string().uuid()
});

// Type inference
export type CreateExampleDocumentSchema = z.infer<typeof createExampleDocumentSchema>;
export type UpdateExampleDocumentSchema = z.infer<typeof updateExampleDocumentSchema>;
export type DeleteExampleDocumentSchema = z.infer<typeof deleteExampleDocumentSchema>;
export type GetExampleDocumentSchema = z.infer<typeof getExampleDocumentSchema>;
import { z } from 'zod';

export const createExampleDocumentSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.coerce.date().optional(),
  metadata: z.record(z.any()).optional()
});

export const updateExampleDocumentSchema = createExampleDocumentSchema.partial().extend({
  // ... existing code ...
});

// Basic document types for the example

export interface ExampleDocument {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string | null;
  content: string | null;
  status: 'draft' | 'published' | 'archived';
  category: string;
  tags: string[] | null;
  author_id: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  metadata: Record<string, any> | null;
}

export interface CreateExampleDocumentInput {
  title: string;
  description?: string;
  content?: string;
  status: 'draft' | 'published' | 'archived';
  category: string;
  tags?: string[];
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  metadata?: Record<string, any>;
}

export interface UpdateExampleDocumentInput extends Partial<CreateExampleDocumentInput> {
  id: string;
}

export const DOCUMENT_CATEGORIES = [
  { id: 'general', name: 'General', icon: '📄' },
  { id: 'report', name: 'Report', icon: '📊' },
  { id: 'proposal', name: 'Proposal', icon: '💡' },
  { id: 'meeting', name: 'Meeting Notes', icon: '📝' },
  { id: 'policy', name: 'Policy', icon: '📋' },
  { id: 'manual', name: 'Manual', icon: '📖' },
  { id: 'other', name: 'Other', icon: '🗂️' }
] as const;

export const DOCUMENT_STATUSES = [
  { id: 'draft', name: 'Draft', color: 'yellow' },
  { id: 'published', name: 'Published', color: 'green' },
  { id: 'archived', name: 'Archived', color: 'gray' }
] as const;

export const PRIORITY_LEVELS = [
  { id: 'low', name: 'Low', color: 'blue' },
  { id: 'medium', name: 'Medium', color: 'orange' },
  { id: 'high', name: 'High', color: 'red' }
] as const;
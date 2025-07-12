'use server';

import { createClient } from '@/supabase/server';
import { revalidatePath } from 'next/cache';
import { createExampleDocumentSchema } from '../schema';

// Create new document for sheet (doesn't redirect)
export async function createExampleDocumentForSheet(formData: FormData) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Parse form data
  const dueDateValue = formData.get('due_date') as string;
  const rawData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string || undefined,
    content: formData.get('content') as string || undefined,
    status: formData.get('status') as 'draft' | 'published' | 'archived',
    category: formData.get('category') as string,
    priority: formData.get('priority') as 'low' | 'medium' | 'high',
    due_date: dueDateValue && dueDateValue.trim() ? dueDateValue : undefined,
    tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : undefined
  };

  // Validate input
  const validatedData = createExampleDocumentSchema.parse(rawData);

  // Insert document
  const { data, error } = await supabase
    .from('example_documents')
    .insert({
      ...validatedData,
      author_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating document:', error);
    throw new Error(`Failed to create document: ${error.message}`);
  }

  // Only revalidate, don't redirect (for sheet usage)
  revalidatePath('/document-example');
  
  return data;
}
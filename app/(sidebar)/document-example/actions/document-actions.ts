'use server';

import { createClient } from '@/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { 
  createExampleDocumentSchema, 
  updateExampleDocumentSchema, 
  deleteExampleDocumentSchema, 
  getExampleDocumentSchema 
} from '../schema';
import type { ExampleDocument } from '../types';

// Get all documents
export async function getAllExampleDocuments(): Promise<ExampleDocument[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('example_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  return data || [];
}

// Get document by ID
export async function getExampleDocumentById(id: string): Promise<ExampleDocument | null> {
  const supabase = await createClient();
  
  // Validate input
  const validatedInput = getExampleDocumentSchema.parse({ id });
  
  const { data, error } = await supabase
    .from('example_documents')
    .select('*')
    .eq('id', validatedInput.id)
    .single();

  if (error) {
    console.error('Error fetching document:', error);
    return null;
  }

  return data;
}

// Create new document
export async function createExampleDocument(formData: FormData) {
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

  revalidatePath('/document-example');
  redirect(`/document-example/${data.id}`);
}

// Update document
export async function updateExampleDocument(formData: FormData) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Parse form data
  const dueDateValue = formData.get('due_date') as string;
  const rawData = {
    id: formData.get('id') as string,
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
  const validatedData = updateExampleDocumentSchema.parse(rawData);

  // Update document
  const { error } = await supabase
    .from('example_documents')
    .update(validatedData)
    .eq('id', validatedData.id)
    .eq('author_id', user.id); // Ensure user owns the document

  if (error) {
    console.error('Error updating document:', error);
    throw new Error('Failed to update document');
  }

  revalidatePath('/document-example');
  revalidatePath(`/document-example/${validatedData.id}`);
  redirect(`/document-example/${validatedData.id}`);
}

// Delete document
export async function deleteExampleDocument(formData: FormData) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Parse form data
  const rawData = {
    id: formData.get('id') as string
  };

  // Validate input
  const validatedData = deleteExampleDocumentSchema.parse(rawData);

  // Delete document
  const { error } = await supabase
    .from('example_documents')
    .delete()
    .eq('id', validatedData.id)
    .eq('author_id', user.id); // Ensure user owns the document

  if (error) {
    console.error('Error deleting document:', error);
    throw new Error('Failed to delete document');
  }

  revalidatePath('/document-example');
  redirect('/document-example');
}

// Search documents
export async function searchExampleDocuments(query: string): Promise<ExampleDocument[]> {
  const supabase = await createClient();
  
  if (!query.trim()) {
    return getAllExampleDocuments();
  }

  const { data, error } = await supabase
    .from('example_documents')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching documents:', error);
    return [];
  }

  return data || [];
}
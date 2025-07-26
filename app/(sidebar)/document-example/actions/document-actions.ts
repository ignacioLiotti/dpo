'use server';

import { authActionClient, ActionError, revalidateHelpers } from '@/app/auth/safe-action';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { 
  createExampleDocumentSchema, 
  updateExampleDocumentSchema, 
  deleteExampleDocumentSchema, 
  getExampleDocumentSchema 
} from '../schema';
import type { ExampleDocument } from '../types';

// Get all documents
export const getAllExampleDocuments = authActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('example_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return [];
      }
      throw new ActionError('Failed to fetch documents', 'FETCH_ERROR');
    }

    return data || [];
  });

// Get document by ID
export const getExampleDocumentById = authActionClient
  .schema(getExampleDocumentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { data, error } = await ctx.supabase
      .from('example_documents')
      .select('*')
      .eq('id', parsedInput.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new ActionError('Failed to fetch document', 'FETCH_ERROR');
    }

    return data;
  });

// Create new document
export const createExampleDocument = authActionClient
  .schema(createExampleDocumentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { data, error } = await ctx.supabase
      .from('example_documents')
      .insert({
        ...parsedInput,
        author_id: ctx.user.id
      })
      .select()
      .single();

    if (error) {
      throw new ActionError('Failed to create document', 'CREATE_ERROR');
    }

    revalidateHelpers.all();
    redirect(`/document-example/${data.id}`);
  });

// Update document
export const updateExampleDocument = authActionClient
  .schema(updateExampleDocumentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase
      .from('example_documents')
      .update(parsedInput)
      .eq('id', parsedInput.id)
      .eq('author_id', ctx.user.id);

    if (error) {
      throw new ActionError('Failed to update document', 'UPDATE_ERROR');
    }

    revalidateHelpers.all();
    redirect(`/document-example/${parsedInput.id}`);
  });

// Delete document
export const deleteExampleDocument = authActionClient
  .schema(deleteExampleDocumentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { error } = await ctx.supabase
      .from('example_documents')
      .delete()
      .eq('id', parsedInput.id)
      .eq('author_id', ctx.user.id);

    if (error) {
      throw new ActionError('Failed to delete document', 'DELETE_ERROR');
    }

    revalidateHelpers.all();
    redirect('/document-example');
  });

// Search documents
export const searchExampleDocuments = authActionClient
  .schema(z.object({ query: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    if (!parsedInput.query.trim()) {
      const result = await getAllExampleDocuments({});
      return result?.data || [];
    }

    const { data, error } = await ctx.supabase
      .from('example_documents')
      .select('*')
      .or(`title.ilike.%${parsedInput.query}%,description.ilike.%${parsedInput.query}%,content.ilike.%${parsedInput.query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return [];
      }
      throw new ActionError('Failed to search documents', 'SEARCH_ERROR');
    }

    return data || [];
  });
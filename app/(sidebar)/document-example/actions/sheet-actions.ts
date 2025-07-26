'use server';

import { authActionClient, ActionError, revalidateHelpers } from '@/app/auth/safe-action';
import { createExampleDocumentSchema } from '../schema';

// Create new document for sheet (doesn't redirect)
export const createExampleDocumentForSheet = authActionClient
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
    return data;
  });
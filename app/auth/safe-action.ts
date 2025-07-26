import { createSafeActionClient } from "next-safe-action";
import { createServerSupabaseClient, getUserOrganization } from "@/app/auth/server-utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export class ActionError extends Error {
  constructor(
    message: string, 
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ActionError";
  }
}

// Enhanced error handling for consistent responses
const handleActionError = (e: Error) => {
  if (e instanceof ActionError) {
    return { 
      code: e.code || 'ACTION_ERROR', 
      message: e.message,
      statusCode: e.statusCode || 400
    };
  }
  
  console.error('Unexpected action error:', e);
  return { 
    code: 'UNKNOWN_ERROR', 
    message: 'An unexpected error occurred',
    statusCode: 500
  };
};

// Base action client (no auth required)
export const action = createSafeActionClient({
  handleServerError: handleActionError,
});

// Authenticated action client
export const authActionClient = createSafeActionClient({
  handleServerError: handleActionError,
}).use(async ({ next }) => {
  const supabase = await createServerSupabaseClient();
  const { user, organizationId } = await getUserOrganization(supabase);

  if (!user) {
    redirect("/sign-in");
  }

  return next({
    ctx: {
      user,
      supabase,
      organizationId: organizationId || null,
    },
  });
});

// Organization-scoped action client (requires organization membership)
export const orgActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (!ctx.organizationId) {
    throw new ActionError(
      "Organization access required", 
      "NO_ORGANIZATION",
      403
    );
  }
  
  return next({ 
    ctx: { 
      ...ctx, 
      organizationId: ctx.organizationId 
    } 
  });
});

// Standard revalidation helpers
export const revalidateHelpers = {
  files: () => {
    revalidatePath('/files');
    revalidatePath('/(sidebar)/files', 'layout');
  },
  obras: (obraId?: string) => {
    revalidatePath('/obras');
    if (obraId) {
      revalidatePath(`/obras/${obraId}`);
    }
    revalidatePath('/(sidebar)/obras', 'layout');
  },
  profile: () => {
    revalidatePath('/profile');
    revalidatePath('/', 'layout');
  },
  organization: () => {
    revalidatePath('/', 'layout');
  },
  all: () => {
    revalidatePath('/', 'layout');
  }
}; 
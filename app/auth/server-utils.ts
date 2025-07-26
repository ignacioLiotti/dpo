import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

// Server client creation (for server components and actions)
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

// Server-side auth utilities
export interface AuthUserOrganization {
  user: User;
  organizationId: string;
}

export async function getUserOrganization(supabase: any): Promise<AuthUserOrganization> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const { data: orgId } = await supabase.rpc('get_user_organization_id');
  if (!orgId) {
    throw new Error('User is not a member of any organization');
  }

  return { user, organizationId: orgId };
}

// Session utilities
export const refreshSession = async (supabase: any) => {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  if (error) {
    throw new Error(`Session refresh failed: ${error.message}`);
  }
  return session;
};

// Error handling utilities
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class OrganizationError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'OrganizationError';
  }
}

// Type guards
export const isAuthenticatedUser = (user: any): user is User => {
  return user && user.id && user.email;
};
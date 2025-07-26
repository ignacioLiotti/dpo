import { createBrowserClient } from '@supabase/ssr'
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

// Browser client creation (for client components)
export const createBrowserSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Client-side auth utilities (re-exported from server-utils for type compatibility)
export interface AuthUserOrganization {
  user: User;
  organizationId: string;
}

// Role hierarchy utilities
export const ROLE_HIERARCHY = {
  admin: 3,
  super_user: 2,
  user: 1,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

export const hasRole = (userRole: UserRole | undefined, requiredRole: UserRole): boolean => {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export const isAdmin = (userRole: UserRole | undefined): boolean => {
  return hasRole(userRole, 'admin');
};

export const isSuperUser = (userRole: UserRole | undefined): boolean => {
  return hasRole(userRole, 'super_user');
};

export const isUser = (userRole: UserRole | undefined): boolean => {
  return hasRole(userRole, 'user');
};

// Organization permission utilities
export const ORGANIZATION_PERMISSIONS = {
  owner: ['manage_members', 'manage_settings', 'delete_organization', 'view_all'],
  admin: ['manage_members', 'manage_settings', 'view_all'],
  member: ['view_all'],
  viewer: ['view_all'],
} as const;

export type OrganizationRole = keyof typeof ORGANIZATION_PERMISSIONS;

export const hasOrganizationPermission = (
  role: OrganizationRole | undefined,
  permission: string
): boolean => {
  if (!role) return false;
  return ORGANIZATION_PERMISSIONS[role].includes(permission as any);
};

export const isOrganizationOwner = (role: OrganizationRole | undefined): boolean => {
  return role === 'owner';
};

export const isOrganizationAdmin = (role: OrganizationRole | undefined): boolean => {
  return role === 'owner' || role === 'admin';
};

export const canManageMembers = (role: OrganizationRole | undefined): boolean => {
  return hasOrganizationPermission(role, 'manage_members');
};

export const canManageSettings = (role: OrganizationRole | undefined): boolean => {
  return hasOrganizationPermission(role, 'manage_settings');
};

// Multi-tab sync utilities
export const AUTH_STORAGE_KEY = 'auth-state';
export const ORGANIZATION_STORAGE_KEY = 'organization-state';

export const broadcastAuthStateChange = (state: any) => {
  if (typeof window !== 'undefined') {
    try {
      // Check if BroadcastChannel is available and can be instantiated
      if (typeof BroadcastChannel !== 'undefined' && BroadcastChannel) {
        const channel = new BroadcastChannel('auth-sync');
        channel.postMessage({
          type: 'AUTH_STATE_CHANGE',
          payload: state,
          timestamp: Date.now(),
        });
        channel.close();
      }
    } catch (error) {
      // Silently fail if BroadcastChannel is not available or fails
      console.debug('BroadcastChannel not available:', error);
    }
  }
};

export const broadcastOrganizationChange = (organizationId: string) => {
  if (typeof window !== 'undefined') {
    try {
      // Check if BroadcastChannel is available and can be instantiated
      if (typeof BroadcastChannel !== 'undefined' && BroadcastChannel) {
        const channel = new BroadcastChannel('auth-sync');
        channel.postMessage({
          type: 'ORGANIZATION_CHANGE',
          payload: { organizationId },
          timestamp: Date.now(),
        });
        channel.close();
      }
    } catch (error) {
      // Silently fail if BroadcastChannel is not available or fails
      console.debug('BroadcastChannel not available:', error);
    }
  }
};

// Error handling utilities (for client-side use)
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

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}
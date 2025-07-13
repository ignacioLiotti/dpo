'use server';

import { createClient } from '@/supabase/server';

/**
 * Get authenticated user and their organization ID
 * Centralized utility to avoid code duplication
 */
export async function getUserOrganization() {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  // Get user's organization using RPC function
  const { data: orgId, error: orgError } = await supabase.rpc('get_user_organization_id');
  if (orgError || !orgId) {
    throw new Error('User is not a member of any organization');
  }

  return { 
    user, 
    organizationId: orgId as string,
    supabase // Return supabase client for convenience
  };
}

/**
 * Check if user has access to a specific organization
 */
export async function userHasOrganizationAccess(organizationId: string): Promise<boolean> {
  try {
    const { organizationId: userOrgId } = await getUserOrganization();
    return userOrgId === organizationId;
  } catch {
    return false;
  }
}

/**
 * Get user's role in their organization
 */
export async function getUserOrganizationRole() {
  const supabase = await createClient();
  const { user, organizationId } = await getUserOrganization();

  const { data: membership, error } = await supabase
    .from('organization_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (error || !membership) {
    throw new Error('Failed to get user role');
  }

  return membership.role;
}

/**
 * Ensure user has required role in organization
 */
export async function requireOrganizationRole(requiredRole: 'owner' | 'admin' | 'member') {
  const userRole = await getUserOrganizationRole();
  
  const roleHierarchy = {
    owner: 3,
    admin: 2,
    member: 1
  };

  if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
    throw new Error(`Insufficient permissions. Required role: ${requiredRole}, current role: ${userRole}`);
  }

  return true;
}
import { createClient } from "@/supabase/server";
import { cookies } from "next/headers";

/**
 * Get the current user's selected organization ID from server-side
 * This reads from localStorage equivalent (cookies) on the server
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Try to get organization ID from cookies (server-side localStorage equivalent)
    const cookieStore = await cookies();
    const storedOrgId = cookieStore.get('currentOrganizationId')?.value;
    
    if (storedOrgId) {
      // Verify the user is actually a member of this organization
      const { data: membership, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('organization_id', storedOrgId)
        .eq('is_active', true)
        .single();
        
      if (!membershipError && membership) {
        return storedOrgId;
      }
    }

    // If no stored org or invalid, get the user's first organization
    const { data: memberships, error: membershipsError } = await supabase
      .from('organization_memberships')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('joined_at', { ascending: false });
      
    if (membershipsError || !memberships || memberships.length === 0) {
      return null; // User has no organizations
    }

    // Prefer owner role, then admin, then first available
    const ownerMembership = memberships.find(m => m.role === 'owner');
    const adminMembership = memberships.find(m => m.role === 'admin');
    const defaultMembership = ownerMembership || adminMembership || memberships[0];

    return defaultMembership.organization_id;
  } catch (error) {
    console.error('Error getting current organization ID:', error);
    return null;
  }
}

/**
 * Verify that a user has access to a specific organization
 */
export async function verifyOrganizationAccess(organizationId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return false;
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();
      
    return !membershipError && !!membership;
  } catch (error) {
    console.error('Error verifying organization access:', error);
    return false;
  }
}

/**
 * Get user's role in a specific organization
 */
export async function getUserOrganizationRole(organizationId: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();
      
    if (membershipError || !membership) {
      return null;
    }

    return membership.role;
  } catch (error) {
    console.error('Error getting user organization role:', error);
    return null;
  }
}
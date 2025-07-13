'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/utils/client';
import { createOrganizationAction } from '@/app/actions/organizations';
import type {
  Organization,
  OrganizationInsert,
  OrganizationUpdate,
  OrganizationContextType,
  MembershipWithOrganization,
  OrganizationRole
} from '@/types/organizations';

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<MembershipWithOrganization[]>([]);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Load user's organizations and memberships
  const loadOrganizations = useCallback(async () => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('⏱️ Organization loading timeout - setting loading to false');
      setIsLoading(false);
      setError('Loading organizations timed out. Please refresh the page.');
    }, 30000); // 30 second timeout

    try {
      console.log('🔄 Starting loadOrganizations...');
      setIsLoading(true);
      setError(null);

      console.log('🔍 Getting user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log('❌ No user or user error:', userError?.message);
        setUser(null);
        throw new Error('User not authenticated');
      }

      console.log('✅ User found:', user.id);
      setUser(user);

      // Get user's memberships with organization data
      console.log('🔍 Querying organization memberships...');
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_memberships')
        .select(`
          *,
          organization:organizations (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (membershipError) {
        console.log('❌ Membership query error:', membershipError);
        throw membershipError;
      }

      console.log('✅ Memberships found:', membershipData?.length || 0);

      const membershipsWithOrgs: MembershipWithOrganization[] = (membershipData || []).map(membership => ({
        ...membership,
        organization: membership.organization as Organization
      }));

      const orgs = membershipsWithOrgs.map(m => m.organization);

      console.log('📝 Setting organizations state...');
      setMemberships(membershipsWithOrgs);
      setOrganizations(orgs);

      console.log('🎯 Organizations set, count:', orgs.length);

      // Set current organization (prefer stored preference, fallback to first org)
      let storedOrgId: string | null = null;
      try {
        storedOrgId = localStorage.getItem('currentOrganizationId');
      } catch (e) {
        console.error('Failed to access localStorage:', e);
      }
      let currentOrg = null;

      if (storedOrgId) {
        currentOrg = orgs.find(org => org.id === storedOrgId) || null;
      }

      if (!currentOrg && orgs.length > 0) {
        // Default to owner organization, then admin, then first available
        const ownerMembership = membershipsWithOrgs.find(m => m.role === 'owner');
        const adminMembership = membershipsWithOrgs.find(m => m.role === 'admin');
        const defaultMembership = ownerMembership || adminMembership || membershipsWithOrgs[0];

        currentOrg = defaultMembership?.organization || null;
      }

      setCurrentOrganization(currentOrg);

      if (currentOrg) {
        try {
          localStorage.setItem('currentOrganizationId', currentOrg.id);
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
      } else {
        try {
          localStorage.removeItem('currentOrganizationId');
        } catch (e) {
          console.error('Failed to remove from localStorage:', e);
        }
      }

      console.log('✅ loadOrganizations completed successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load organizations';
      console.log('❌ Error in loadOrganizations:', err);

      // If user is not authenticated, that's normal - just clear state
      if (errorMessage.includes('not authenticated')) {
        console.log('🔄 User not authenticated, clearing state');
        setUser(null);
        setCurrentOrganization(null);
        setOrganizations([]);
        setMemberships([]);
        setError(null); // Don't treat "not authenticated" as an error
      } else {
        console.error('💥 Unexpected error loading organizations:', err);
        setError(errorMessage);
      }
    } finally {
      console.log('🏁 Setting isLoading to false');
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [supabase]);

  // Switch to a different organization
  const switchOrganization = useCallback(async (organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    if (!org) {
      throw new Error('Organization not found');
    }

    setCurrentOrganization(org);
    try {
      localStorage.setItem('currentOrganizationId', organizationId);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    toast.success(`Switched to ${org.name}`);

    // Optionally refresh the page to ensure all data is updated
    // router.refresh();
  }, [organizations]);

  // Create a new organization
  const createOrganization = useCallback(async (data: OrganizationInsert): Promise<Organization> => {
    try {
      console.log('Creating organization via server action:', data);

      // Use server action for better authentication handling
      const result = await createOrganizationAction(data);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Refresh organizations to include the new one
      await loadOrganizations();

      toast.success(`Organization "${result.data.name}" created successfully`);

      return result.data;
    } catch (err) {
      console.error('Create organization error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create organization';
      toast.error(errorMessage);
      throw err;
    }
  }, [loadOrganizations]);

  // Update current organization
  const updateOrganization = useCallback(async (id: string, data: OrganizationUpdate): Promise<Organization> => {
    try {
      const { data: updatedOrg, error } = await supabase
        .from('organizations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setOrganizations(prev => prev.map(org =>
        org.id === id ? updatedOrg : org
      ));

      if (currentOrganization?.id === id) {
        setCurrentOrganization(updatedOrg);
      }

      toast.success('Organization updated successfully');

      return updatedOrg;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update organization';
      toast.error(errorMessage);
      throw err;
    }
  }, [supabase, currentOrganization]);

  // Invite a user to the current organization
  const inviteUser = useCallback(async (email: string, role: OrganizationRole): Promise<void> => {
    if (!currentOrganization) {
      throw new Error('No current organization selected');
    }

    try {
      const { error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: currentOrganization.id,
          email,
          role,
          invited_by: (await supabase.auth.getUser()).data.user!.id
        });

      if (error) {
        throw error;
      }

      toast.success(`Invitation sent to ${email}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
      toast.error(errorMessage);
      throw err;
    }
  }, [supabase, currentOrganization]);

  // Accept an organization invitation
  const acceptInvitation = useCallback(async (token: string): Promise<void> => {
    try {
      const { data, error } = await supabase.rpc('accept_organization_invitation', {
        invitation_token: token
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      // Refresh organizations
      await loadOrganizations();

      toast.success('Invitation accepted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
      toast.error(errorMessage);
      throw err;
    }
  }, [supabase, loadOrganizations]);

  // Leave an organization
  const leaveOrganization = useCallback(async (organizationId: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('organization_memberships')
        .update({ is_active: false })
        .eq('organization_id', organizationId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // If leaving current organization, switch to another one
      if (currentOrganization?.id === organizationId) {
        const remainingOrgs = organizations.filter(o => o.id !== organizationId);
        if (remainingOrgs.length > 0) {
          await switchOrganization(remainingOrgs[0].id);
        } else {
          setCurrentOrganization(null);
          localStorage.removeItem('currentOrganizationId');
        }
      }

      // Refresh organizations
      await loadOrganizations();

      toast.success('Left organization successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave organization';
      toast.error(errorMessage);
      throw err;
    }
  }, [supabase, currentOrganization, organizations, switchOrganization, loadOrganizations]);

  // Remove a member from the current organization
  const removeMember = useCallback(async (membershipId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('organization_memberships')
        .update({ is_active: false })
        .eq('id', membershipId);

      if (error) {
        throw error;
      }

      toast.success('Member removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      toast.error(errorMessage);
      throw err;
    }
  }, [supabase]);

  // Update a member's role
  const updateMemberRole = useCallback(async (membershipId: string, role: OrganizationRole): Promise<void> => {
    try {
      const { error } = await supabase
        .from('organization_memberships')
        .update({ role })
        .eq('id', membershipId);

      if (error) {
        throw error;
      }

      toast.success('Member role updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update member role';
      toast.error(errorMessage);
      throw err;
    }
  }, [supabase]);

  // Refresh all organization data
  const refresh = useCallback(async (): Promise<void> => {
    await loadOrganizations();
  }, [loadOrganizations]);

  // Load organizations on mount and when user changes
  useEffect(() => {
    let mounted = true;
    let loadingPromise: Promise<void> | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event, session?.user?.id);

      // Prevent concurrent loads
      if (loadingPromise) {
        console.log('⏳ Load already in progress, skipping...');
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        if (mounted) {
          loadingPromise = loadOrganizations();
          await loadingPromise;
          loadingPromise = null;
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentOrganization(null);
        setOrganizations([]);
        setMemberships([]);
        try {
          localStorage.removeItem('currentOrganizationId');
        } catch (e) {
          console.error('Failed to remove from localStorage:', e);
        }
        setIsInitialized(false);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setUser(session.user);
        // Don't reload organizations on token refresh unless user changed
      } else if (event === 'INITIAL_SESSION' && session) {
        // Only load if not already initialized
        if (!isInitialized && mounted) {
          setUser(session.user);
          loadingPromise = loadOrganizations();
          await loadingPromise;
          loadingPromise = null;
          setIsInitialized(true);
        }
      } else if (event === 'INITIAL_SESSION' && !session) {
        // Handle initial load with no session
        setIsLoading(false);
        setIsInitialized(true);
      }
    });

    // Load initial data only if not already initialized
    if (!isInitialized && mounted) {
      loadingPromise = loadOrganizations();
      loadingPromise.then(() => {
        if (mounted) {
          setIsInitialized(true);
        }
        loadingPromise = null;
      }).catch(() => {
        // Error is already handled in loadOrganizations
        loadingPromise = null;
      });
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, isInitialized, loadOrganizations]); // Keep deps but use isInitialized to prevent loops

  const value: OrganizationContextType = {
    currentOrganization,
    organizations,
    memberships,
    user,
    isLoading,
    error,
    switchOrganization,
    createOrganization,
    updateOrganization,
    inviteUser,
    acceptInvitation,
    leaveOrganization,
    removeMember,
    updateMemberRole,
    refresh
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

// Hook to check permissions
export function useOrganizationPermissions() {
  const { currentOrganization, memberships } = useOrganization();

  const getCurrentMembership = useCallback(() => {
    if (!currentOrganization) return null;
    return memberships.find(m => m.organization_id === currentOrganization.id) || null;
  }, [currentOrganization, memberships]);

  const hasPermission = useCallback((permission: string): boolean => {
    const membership = getCurrentMembership();
    if (!membership) return false;

    const { role } = membership;

    // Define role permissions
    const rolePermissions: Record<string, string[]> = {
      owner: ['*'], // Owner has all permissions
      admin: [
        'view_organization', 'edit_organization', 'manage_members', 'invite_members',
        'remove_members', 'manage_roles', 'view_members', 'create_obras', 'edit_obras',
        'delete_obras', 'view_obras', 'create_documents', 'edit_documents', 'delete_documents', 'view_documents'
      ],
      member: [
        'view_organization', 'view_members', 'create_obras', 'edit_obras',
        'view_obras', 'create_documents', 'edit_documents', 'view_documents'
      ],
      viewer: ['view_organization', 'view_members', 'view_obras', 'view_documents']
    };

    const permissions = rolePermissions[role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  }, [getCurrentMembership]);

  const isOwner = useCallback((): boolean => {
    const membership = getCurrentMembership();
    return membership?.role === 'owner' || false;
  }, [getCurrentMembership]);

  const isAdmin = useCallback((): boolean => {
    const membership = getCurrentMembership();
    return membership?.role === 'admin' || membership?.role === 'owner' || false;
  }, [getCurrentMembership]);

  return {
    getCurrentMembership,
    hasPermission,
    isOwner,
    isAdmin,
    role: getCurrentMembership()?.role || null
  };
}
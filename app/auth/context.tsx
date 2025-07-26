'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { 
  createBrowserSupabaseClient, 
  broadcastAuthStateChange,
  broadcastOrganizationChange,
  UserRole,
  OrganizationRole,
  hasRole,
  isAdmin,
  isSuperUser,
  hasOrganizationPermission,
  isOrganizationOwner,
  isOrganizationAdmin,
  canManageMembers,
  canManageSettings,
  AuthError,
  OrganizationError
} from './utils';
import { createOrganizationAction } from '@/app/actions/organizations';
import type {
  Organization,
  OrganizationInsert,
  OrganizationUpdate,
  MembershipWithOrganization,
} from './types';

// Constants
const LOAD_TIMEOUT = 30000; // 30 seconds
const STORAGE_KEY = 'currentOrganizationId';

// Development mode check
const isDev = process.env.NODE_ENV === 'development';
const log = isDev ? console.log : () => { };

// Safe localStorage wrapper
const storage = {
  getItem: (key: string): string | null => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // Silently fail
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      // Silently fail
    }
  }
};

// Unified Auth Context Type
export interface AuthContextType {
  // User & Authentication
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Organization Management
  currentOrganization: Organization | null;
  organizations: Organization[];
  memberships: MembershipWithOrganization[];
  
  // User Role (system-wide)
  userRole: UserRole | null;
  
  // Organization Role (current organization)
  organizationRole: OrganizationRole | null;
  
  // Permissions
  permissions: {
    // System-wide permissions
    hasSystemRole: (role: UserRole) => boolean;
    isSystemAdmin: () => boolean;
    isSuperUser: () => boolean;
    
    // Organization permissions
    hasOrganizationPermission: (permission: string) => boolean;
    isOrganizationOwner: () => boolean;
    isOrganizationAdmin: () => boolean;
    canManageMembers: () => boolean;
    canManageSettings: () => boolean;
  };
  
  // Actions
  switchOrganization: (id: string) => Promise<void>;
  createOrganization: (data: OrganizationInsert) => Promise<Organization>;
  updateOrganization: (id: string, data: OrganizationUpdate) => Promise<Organization>;
  deleteOrganization: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Core state
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<MembershipWithOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  // Refs to manage async operations
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitializedRef = useRef(false);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Initialize broadcast channel for multi-tab sync
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('auth-sync');
        broadcastChannelRef.current = channel;

        channel.onmessage = (event) => {
          const { type, payload } = event.data;
          
          switch (type) {
            case 'AUTH_STATE_CHANGE':
              if (payload.user) {
                setUser(payload.user);
                setUserRole(payload.userRole);
              } else {
                setUser(null);
                setUserRole(null);
                setCurrentOrganization(null);
                setOrganizations([]);
                setMemberships([]);
              }
              break;
              
            case 'ORGANIZATION_CHANGE':
              const org = organizations.find(o => o.id === payload.organizationId);
              if (org) {
                setCurrentOrganization(org);
                storage.setItem(STORAGE_KEY, payload.organizationId);
              }
              break;
          }
        };

        return () => {
          channel.close();
        };
      } catch (e) {
        log('BroadcastChannel not available:', e);
      }
    }
  }, [organizations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, []);

  // Get current organization role
  const organizationRole = currentOrganization 
    ? memberships.find(m => m.organization_id === currentOrganization.id)?.role as OrganizationRole
    : null;

  // Permission helpers
  const permissions = {
    hasSystemRole: (role: UserRole) => hasRole(userRole || undefined, role),
    isSystemAdmin: () => isAdmin(userRole || undefined),
    isSuperUser: () => isSuperUser(userRole || undefined),
    hasOrganizationPermission: (permission: string) => hasOrganizationPermission(organizationRole || undefined, permission),
    isOrganizationOwner: () => isOrganizationOwner(organizationRole || undefined),
    isOrganizationAdmin: () => isOrganizationAdmin(organizationRole || undefined),
    canManageMembers: () => canManageMembers(organizationRole || undefined),
    canManageSettings: () => canManageSettings(organizationRole || undefined),
  };

  // Load user role from profiles table
  const loadUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        log('Error loading user role:', error);
        return null;
      }

      return data?.role as UserRole || 'user';
    } catch (error) {
      log('Error loading user role:', error);
      return 'user';
    }
  }, [supabase]);

  // Load organizations and memberships
  const loadOrganizations = useCallback(async (userId: string) => {
    try {
      console.log('🔄 ORG DEBUG: Loading organizations for user:', userId);
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('organization_memberships')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('user_id', userId);

      if (membershipsError) {
        console.log('🔴 ORG DEBUG: Error loading memberships:', membershipsError);
        throw new OrganizationError('Failed to load organizations');
      }

      const membershipsList = membershipsData || [];
      const organizationsList = membershipsList.map(m => m.organization).filter(Boolean);

      console.log('🟢 ORG DEBUG: Memberships loaded:', membershipsList.length);
      console.log('🟢 ORG DEBUG: Organizations loaded:', organizationsList.length);

      setMemberships(membershipsList as MembershipWithOrganization[]);
      setOrganizations(organizationsList as Organization[]);

      // Set current organization
      if (organizationsList.length > 0) {
        const savedOrgId = storage.getItem(STORAGE_KEY);
        const savedOrg = savedOrgId ? organizationsList.find(o => o.id === savedOrgId) : null;
        const defaultOrg = savedOrg || organizationsList[0];
        
        console.log('🟢 ORG DEBUG: Setting current organization:', {
          id: defaultOrg.id,
          name: defaultOrg.name,
          wasFromStorage: !!savedOrg
        });
        setCurrentOrganization(defaultOrg);
        storage.setItem(STORAGE_KEY, defaultOrg.id);
      } else {
        console.log('🟡 ORG DEBUG: No organizations found for user');
      }
    } catch (error) {
      log('Error loading organizations:', error);
      throw error;
    }
  }, [supabase]);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    if (isInitializedRef.current) return;
    
    try {
      // Cancel any existing operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (signal.aborted) return;

      if (userError) {
        throw new AuthError('Failed to get user');
      }

      if (!currentUser) {
        console.log('🔴 AUTH DEBUG: No current user found');
        setUser(null);
        setUserRole(null);
        setCurrentOrganization(null);
        setOrganizations([]);
        setMemberships([]);
        setIsLoading(false);
        return;
      }

      console.log('🟢 AUTH DEBUG: User found:', {
        id: currentUser.id,
        email: currentUser.email,
        created_at: currentUser.created_at
      });
      setUser(currentUser);

      // Load user role and organizations in parallel
      console.log('🔄 AUTH DEBUG: Loading user role and organizations...');
      const [role] = await Promise.all([
        loadUserRole(currentUser.id),
        loadOrganizations(currentUser.id)
      ]);

      if (signal.aborted) return;

      console.log('🟢 AUTH DEBUG: User role loaded:', role);
      setUserRole(role);
      
      // Broadcast auth state change
      broadcastAuthStateChange({
        user: currentUser,
        userRole: role,
      });

      isInitializedRef.current = true;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Don't set loading to false if aborted, as another request is likely in progress
        return;
      }
      
      log('Error initializing auth:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      setIsLoading(false);
    } finally {
      // Only set loading to false if not aborted
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [supabase, loadUserRole, loadOrganizations]);

  // Initialize on mount
  useEffect(() => {
    if (loadingPromiseRef.current) return;
    
    loadingPromiseRef.current = initializeAuth();
  }, [initializeAuth]);

  // Auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log('Auth state changed:', event, session?.user?.id);
        
        // Skip INITIAL_SESSION and TOKEN_REFRESHED events as they're handled by initializeAuth
        if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          return;
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Only reinitialize if we don't have a user yet
          if (!user || user.id !== session.user.id) {
            isInitializedRef.current = false;
            loadingPromiseRef.current = null;
            await initializeAuth();
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
          setCurrentOrganization(null);
          setOrganizations([]);
          setMemberships([]);
          storage.removeItem(STORAGE_KEY);
          isInitializedRef.current = false;
          loadingPromiseRef.current = null;
          
          // Broadcast sign out
          broadcastAuthStateChange({
            user: null,
            userRole: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, initializeAuth, user]);

  // Actions
  const switchOrganization = useCallback(async (id: string) => {
    try {
      const organization = organizations.find(o => o.id === id);
      if (!organization) {
        throw new OrganizationError('Organization not found');
      }

      setCurrentOrganization(organization);
      storage.setItem(STORAGE_KEY, id);
      
      // Broadcast organization change
      broadcastOrganizationChange(id);
      
      toast.success(`Switched to ${organization.name}`);
      
    } catch (error) {
      log('Error switching organization:', error);
      toast.error('Failed to switch organization');
      throw error;
    }
  }, [organizations]);

  const createOrganization = useCallback(async (data: OrganizationInsert) => {
    try {
      console.log('🔄 CREATE ORG DEBUG: Creating organization with data:', data);
      const result = await createOrganizationAction(data);
      
      console.log('🟢 CREATE ORG DEBUG: Server response:', result);
      
      if (!result.success) {
        console.log('🔴 CREATE ORG DEBUG: Creation failed:', result.error);
        throw new OrganizationError(result.error);
      }
      
      console.log('✅ CREATE ORG DEBUG: Organization created successfully, reloading organizations...');
      
      // Reload organizations to include the new one
      if (user) {
        await loadOrganizations(user.id);
        console.log('✅ CREATE ORG DEBUG: Organizations reloaded');
      }
      
      return result.data;
    } catch (error) {
      console.log('🔴 CREATE ORG DEBUG: Error creating organization:', error);
      throw error;
    }
  }, [user, loadOrganizations]);

  const updateOrganization = useCallback(async (id: string, data: OrganizationUpdate) => {
    try {
      const { data: updatedOrg, error } = await supabase
        .from('organizations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new OrganizationError('Failed to update organization');
      }

      // Update local state
      setOrganizations(prev => 
        prev.map(org => org.id === id ? updatedOrg : org)
      );
      
      if (currentOrganization?.id === id) {
        setCurrentOrganization(updatedOrg);
      }

      toast.success('Organization updated successfully');
      return updatedOrg;
    } catch (error) {
      log('Error updating organization:', error);
      toast.error('Failed to update organization');
      throw error;
    }
  }, [supabase, currentOrganization]);

  const deleteOrganization = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) {
        throw new OrganizationError('Failed to delete organization');
      }

      // Update local state
      setOrganizations(prev => prev.filter(org => org.id !== id));
      setMemberships(prev => prev.filter(m => m.organization_id !== id));
      
      // If current organization was deleted, switch to another
      if (currentOrganization?.id === id) {
        const remainingOrgs = organizations.filter(org => org.id !== id);
        if (remainingOrgs.length > 0 && remainingOrgs[0].id) {
          await switchOrganization(remainingOrgs[0].id);
        } else {
          setCurrentOrganization(null);
          storage.removeItem(STORAGE_KEY);
        }
      }

      toast.success('Organization deleted successfully');
    } catch (error) {
      log('Error deleting organization:', error);
      toast.error('Failed to delete organization');
      throw error;
    }
  }, [supabase, currentOrganization, organizations, switchOrganization]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new AuthError('Failed to sign out');
      }
      
      // Clear local state
      setUser(null);
      setUserRole(null);
      setCurrentOrganization(null);
      setOrganizations([]);
      setMemberships([]);
      storage.removeItem(STORAGE_KEY);
      
      // Broadcast sign out
      broadcastAuthStateChange({
        user: null,
        userRole: null,
      });
      
      router.push('/');
      
    } catch (error) {
      log('Error signing out:', error);
      toast.error('Failed to sign out');
      throw error;
    }
  }, [supabase, router]);

  const refreshAuth = useCallback(async () => {
    isInitializedRef.current = false;
    loadingPromiseRef.current = null;
    await initializeAuth();
  }, [initializeAuth]);

  const value: AuthContextType = {
    // User & Authentication
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    
    // Organization Management
    currentOrganization,
    organizations,
    memberships,
    
    // Roles
    userRole,
    organizationRole,
    
    // Permissions
    permissions,
    
    // Actions
    switchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    signOut,
    refreshAuth,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export for backward compatibility
export const useOrganization = useAuth;
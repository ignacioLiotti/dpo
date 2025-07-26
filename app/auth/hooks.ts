import { useAuth } from './context';
import { useCallback, useMemo } from 'react';
import type { UserRole, OrganizationRole } from './utils';

// Main auth hook (exported from context)
export { useAuth } from './context';

// Specialized hooks for specific use cases

/**
 * Hook for getting current user information
 */
export const useUser = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  return useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
  }), [user, isAuthenticated, isLoading]);
};

/**
 * Hook for user role management (system-wide)
 */
export const useUserRole = () => {
  const { userRole, permissions, isLoading } = useAuth();
  
  return useMemo(() => ({
    role: userRole,
    hasRole: (role: UserRole) => permissions.hasSystemRole(role),
    isAdmin: () => permissions.isSystemAdmin(),
    isSuperUser: () => permissions.isSuperUser(),
    isUser: () => permissions.hasSystemRole('user'),
    isLoading,
  }), [userRole, permissions, isLoading]);
};

/**
 * Hook for current organization information
 */
export const useCurrentOrganization = () => {
  const { currentOrganization, organizationRole } = useAuth();
  
  return useMemo(() => ({
    organization: currentOrganization,
    organizationId: currentOrganization?.id || null,
    role: organizationRole,
  }), [currentOrganization, organizationRole]);
};

/**
 * Hook for organization management
 */
export const useOrganizations = () => {
  const { 
    organizations, 
    memberships, 
    currentOrganization, 
    switchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization 
  } = useAuth();
  
  return useMemo(() => ({
    organizations,
    memberships,
    currentOrganization,
    switchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
  }), [
    organizations,
    memberships,
    currentOrganization,
    switchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
  ]);
};

/**
 * Hook for organization permissions
 */
export const useOrganizationPermissions = () => {
  const { organizationRole, permissions } = useAuth();
  
  return useMemo(() => ({
    role: organizationRole,
    hasPermission: permissions.hasOrganizationPermission,
    isOwner: permissions.isOrganizationOwner,
    isAdmin: permissions.isOrganizationAdmin,
    canManageMembers: permissions.canManageMembers,
    canManageSettings: permissions.canManageSettings,
  }), [organizationRole, permissions]);
};

/**
 * Hook for organization switcher components
 */
export const useOrganizationSwitcher = () => {
  const { 
    organizations, 
    currentOrganization, 
    memberships,
    switchOrganization, 
    isLoading 
  } = useAuth();
  
  // Get role for display in switcher
  const getCurrentRole = useCallback((orgId: string) => {
    return memberships.find(m => m.organization_id === orgId)?.role as OrganizationRole;
  }, [memberships]);
  
  return useMemo(() => ({
    organizations,
    currentOrganization,
    switchOrganization,
    isLoading,
    getCurrentRole,
  }), [
    organizations,
    currentOrganization,
    switchOrganization,
    isLoading,
    getCurrentRole,
  ]);
};

/**
 * Hook for auth loading states
 */
export const useAuthLoading = () => {
  const { isLoading, error } = useAuth();
  
  return useMemo(() => ({
    isLoading,
    error,
  }), [isLoading, error]);
};

/**
 * Hook for auth actions
 */
export const useAuthActions = () => {
  const { signOut, refreshAuth } = useAuth();
  
  return useMemo(() => ({
    signOut,
    refreshAuth,
  }), [signOut, refreshAuth]);
};

/**
 * Hook for conditional rendering based on permissions
 */
export const usePermissionGuard = () => {
  const { permissions, userRole, organizationRole } = useAuth();
  
  const canAccess = useCallback((config: {
    systemRole?: UserRole;
    organizationRole?: OrganizationRole;
    organizationPermission?: string;
    requireAll?: boolean; // true = AND, false = OR (default)
  }) => {
    const checks = [];
    
    if (config.systemRole) {
      checks.push(permissions.hasSystemRole(config.systemRole));
    }
    
    if (config.organizationRole) {
      checks.push(organizationRole === config.organizationRole);
    }
    
    if (config.organizationPermission) {
      checks.push(permissions.hasOrganizationPermission(config.organizationPermission));
    }
    
    if (checks.length === 0) return true;
    
    return config.requireAll ? checks.every(Boolean) : checks.some(Boolean);
  }, [permissions, userRole, organizationRole]);
  
  return useMemo(() => ({
    canAccess,
    userRole,
    organizationRole,
  }), [canAccess, userRole, organizationRole]);
};

/**
 * Hook for route protection
 */
export const useRouteGuard = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { canAccess } = usePermissionGuard();
  
  const requireAuth = useCallback(() => {
    return isAuthenticated;
  }, [isAuthenticated]);
  
  const requireRole = useCallback((role: UserRole) => {
    return isAuthenticated && canAccess({ systemRole: role });
  }, [isAuthenticated, canAccess]);
  
  const requireOrganization = useCallback(() => {
    const { organization } = useCurrentOrganization();
    return isAuthenticated && !!organization;
  }, [isAuthenticated]);
  
  return useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    requireAuth,
    requireRole,
    requireOrganization,
    canAccess,
  }), [
    user,
    isAuthenticated,
    isLoading,
    requireAuth,
    requireRole,
    requireOrganization,
    canAccess,
  ]);
};

// Legacy compatibility hooks
export const useCurrentOrganizationId = () => {
  const { currentOrganization } = useAuth();
  return currentOrganization?.id || null;
};
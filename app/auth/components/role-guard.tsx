'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRouteGuard } from '../hooks';
import { AlertCircle } from 'lucide-react';
import type { UserRole, OrganizationRole } from '../utils';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredOrganizationRole?: OrganizationRole;
  requiredPermission?: string;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * A component that restricts access to routes based on the user's role and permissions.
 * 
 * @param children - The protected content
 * @param requiredRole - The minimum system role required ('user', 'super_user', or 'admin')
 * @param requiredOrganizationRole - The minimum organization role required
 * @param requiredPermission - The specific organization permission required
 * @param requireAuth - Whether authentication is required (default: true)
 * @param fallback - Optional content to show if the user doesn't have access
 * @param redirectTo - Optional URL to redirect to if the user doesn't have access
 */
export function RoleGuard({
  children,
  requiredRole,
  requiredOrganizationRole,
  requiredPermission,
  requireAuth = true,
  fallback,
  redirectTo
}: RoleGuardProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    canAccess,
    requireRole,
    requireOrganization
  } = useRouteGuard();
  const router = useRouter();

  // Check if user has required access
  const hasAccess = () => {
    if (requireAuth && !isAuthenticated) {
      return false;
    }

    if (requiredRole && !requireRole(requiredRole)) {
      return false;
    }

    if (requiredOrganizationRole || requiredPermission) {
      if (!requireOrganization()) {
        return false;
      }

      const accessConfig: any = {};
      
      if (requiredOrganizationRole) {
        accessConfig.organizationRole = requiredOrganizationRole;
      }
      
      if (requiredPermission) {
        accessConfig.organizationPermission = requiredPermission;
      }

      return canAccess(accessConfig);
    }

    return true;
  };

  // If redirectTo is provided, navigate away when the user doesn't have access
  useEffect(() => {
    if (!isLoading && !hasAccess() && redirectTo) {
      router.push(redirectTo);
    }
  }, [isLoading, redirectTo, router]);

  // Show loading state while checking role
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If the user has the required access, show the children
  if (hasAccess()) {
    return <>{children}</>;
  }

  // If no redirect and no fallback, show default access denied message
  if (!redirectTo && !fallback) {
    const getRequiredText = () => {
      const requirements = [];
      if (requiredRole) requirements.push(`${requiredRole} system role`);
      if (requiredOrganizationRole) requirements.push(`${requiredOrganizationRole} organization role`);
      if (requiredPermission) requirements.push(`${requiredPermission} permission`);
      if (requireAuth && !isAuthenticated) requirements.push('authentication');
      
      return requirements.join(' and ');
    };

    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-semibold text-destructive">Access Denied</h2>
        </div>
        <p className="mt-2 text-muted-foreground">
          You don't have permission to access this content.
          This requires {getRequiredText()}.
        </p>
      </div>
    );
  }

  // If fallback is provided, show that instead
  return fallback ? <>{fallback}</> : null;
}
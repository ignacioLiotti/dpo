'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole, type UserRole } from '@/hooks/useUserRole';
import { AlertCircle } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * A component that restricts access to routes based on the user's role.
 * 
 * @param children - The protected content
 * @param requiredRole - The minimum role required to access the content ('user', 'super_user', or 'admin')
 * @param fallback - Optional content to show if the user doesn't have the required role
 * @param redirectTo - Optional URL to redirect to if the user doesn't have the required role
 */
export function RoleGuard({
  children,
  requiredRole,
  fallback,
  redirectTo
}: RoleGuardProps) {
  const { role, hasRole, isLoading } = useUserRole();
  const router = useRouter();

  // If redirectTo is provided, navigate away when the user doesn't have access
  useEffect(() => {
    if (!isLoading && !hasRole(requiredRole) && redirectTo) {
      router.push(redirectTo);
    }
  }, [isLoading, hasRole, requiredRole, redirectTo, router]);

  // Show loading state while checking role
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If the user has the required role, show the children
  if (hasRole(requiredRole)) {
    return <>{children}</>;
  }

  // If no redirect and no fallback, show default access denied message
  if (!redirectTo && !fallback) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-semibold text-destructive">Access Denied</h2>
        </div>
        <p className="mt-2 text-muted-foreground">
          You don't have permission to access this content.
          This requires {requiredRole} privileges or higher.
        </p>
      </div>
    );
  }

  // If fallback is provided, show that instead
  return fallback ? <>{fallback}</> : null;
} 
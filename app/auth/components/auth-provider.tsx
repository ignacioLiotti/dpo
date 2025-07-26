'use client';

import { AuthProvider } from '../context';

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component for the AuthProvider to be used in the app
 */
export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
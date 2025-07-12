'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { OrganizationProvider } from '@/contexts/organization-context';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Documents don't change often, cache for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep in cache for 30 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      // Retry failed requests
      retry: 2,
      // Don't refetch on window focus for documents
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect for documents  
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <OrganizationProvider>
          {children}
        </OrganizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
} 
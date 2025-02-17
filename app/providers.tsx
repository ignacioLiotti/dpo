// QueryProvider.tsx
"use client";

import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const Providers = React.memo(function Providers({ children }: { children: React.ReactNode }) {
  // Create a single QueryClient instance for your app.
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    // Create a persister that uses localStorage.
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
    });

    // Persist the query cache.
    persistQueryClient({
      queryClient,
      persister,
      // Optionally specify how long the cache remains valid (here, 1 hour)
      maxAge: 1000 * 60 * 60,
    });
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
});

export default Providers;

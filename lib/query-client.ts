import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const GC_TIME = 1000 * 60 * 60 * 24; // 24 hours

// Create the client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: STALE_TIME,
			gcTime: GC_TIME,
			refetchOnMount: false,
			refetchOnReconnect: true,
			refetchOnWindowFocus: false,
		},
	},
});

// Create the persister
const persister = createSyncStoragePersister({
	storage: typeof window !== "undefined" ? window.localStorage : undefined,
});

export { queryClient, persister };

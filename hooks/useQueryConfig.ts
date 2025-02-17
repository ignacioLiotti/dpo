import { QueryClient } from "@tanstack/react-query";
import { persistQueryData } from "@/utils/api-client";

export function useQueryConfig() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60 * 5, // 5 minutes
				gcTime: 1000 * 60 * 30, // 30 minutes
				refetchOnWindowFocus: false,
				refetchOnMount: false, // Don't refetch on mount if we have cached data
				retry: 1, // Only retry failed requests once
			},
		},
	});
}

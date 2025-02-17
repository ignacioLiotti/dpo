import { useQuery } from "@tanstack/react-query";
import { createClient } from "../supabase/client";

export function useSession() {
	const supabase = createClient();

	return useQuery({
		queryKey: ["session"],
		queryFn: async () => {
			const {
				data: { session },
				error,
			} = await supabase.auth.getSession();
			if (error) throw error;
			return session;
		},
		staleTime: 1000 * 60 * 5, // Cache for 5 minutes
		gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
	});
}

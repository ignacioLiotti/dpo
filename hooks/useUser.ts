import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

export function useUser() {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Create the Supabase client
	const supabase = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL || "",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
	);

	useEffect(() => {
		async function getUser() {
			setIsLoading(true);
			setError(null);

			try {
				const {
					data: { user },
					error: userError,
				} = await supabase.auth.getUser();

				if (userError) {
					setError(userError.message);
					setUser(null);
				} else {
					setUser(user);
				}
			} catch (err) {
				console.error("Error fetching user:", err);
				setError("An unexpected error occurred");
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		}

		getUser();

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, [supabase]);

	return {
		user,
		isLoading,
		error,
		isAuthenticated: !!user,
	};
} 
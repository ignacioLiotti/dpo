
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export type UserRole = "user" | "super_user" | "admin";

export function useUserRole() {
	const [role, setRole] = useState<UserRole | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	// Create the Supabase client
	const supabase = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL || "",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
	);

	useEffect(() => {
		async function fetchUserRole() {
			setIsLoading(true);
			setError(null);

			try {
				// Get the current user
				const {
					data: { user },
					error: userError,
				} = await supabase.auth.getUser();

				if (userError || !user) {
					setRole(null);
					setIsLoading(false);
					return;
				}

				// Fetch the user's profile which contains the role
				const { data, error } = await supabase
					.from("profiles")
					.select("role")
					.eq("id", user.id)
					.single();


				if (error) {
					console.error("Error fetching user role:", error);
					setError("Failed to fetch user role");
					setRole(null);
				} else {
					setRole((data?.role as UserRole) || "user");
				}
				setIsLoading(false);
			} catch (err) {
				console.error("Unexpected error fetching user role:", err);
				setError("An unexpected error occurred");
				setRole(null);
			}
		}

		fetchUserRole();
	}, [supabase, router]);

	// Check if the user has a specific role or higher
	const hasRole = (requiredRole: UserRole): boolean => {
		if (!role) return false;

		const roleHierarchy: Record<UserRole, number> = {
			admin: 3,
			super_user: 2,
			user: 1,
		};

		return roleHierarchy[role] >= roleHierarchy[requiredRole];
	};

	// Convenience helpers
	const isAdmin = (): boolean => role === "admin";
	const isSuperUser = (): boolean => hasRole("super_user");
	const isUser = (): boolean => hasRole("user");

	return {
		role,
		isLoading,
		error,
		hasRole,
		isAdmin,
		isSuperUser,
		isUser,
	};
}

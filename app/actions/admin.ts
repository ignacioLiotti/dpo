"use server";

import { z } from "zod";
import { createSafeActionClient } from "next-safe-action";
import { createClient } from "@/supabase/server";
import type { User } from "@supabase/supabase-js"; // Import User type
import type { UserWithRole } from "@/app/(admin)/users/user-components/user-role-manager"; // Adjust path if needed

// Define ActionResponse locally - consider moving to a shared file
export interface ActionResponse<T = undefined> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
	};
}

// Helper to check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
	// Assuming createClient might be async and returns the client instance
	const supabase = await createClient();
	const { data: profile, error } = await supabase
		.from("profiles")
		.select("role")
		.eq("id", userId)
		.single();

	if (error || !profile) {
		console.error("Error fetching user profile for admin check:", error);
		return false;
	}
	return profile.role === "admin";
}

// Create a base safe action client
const actionClient = createSafeActionClient();

// Define the action with middleware for admin check
export const getUsersWithRolesAndEmails = actionClient
	.use(async ({ next }) => {
		// Use middleware chaining
		// Assuming createClient might be async and returns the client instance
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("Authentication required");
		}

		const userIsAdmin = await isAdmin(user.id);
		if (!userIsAdmin) {
			throw new Error("Admin privileges required");
		}

		// Context not strictly needed here unless subsequent steps use it
		return next({ ctx: { userId: user.id } });
	})
	.action(async (): Promise<ActionResponse<UserWithRole[]>> => {
		try {
			// Assuming createAdminClient/createClient return the client directly or are awaited
			const supabase = await createClient();

			// 1. Fetch profiles
			const { data: profilesData, error: profilesError } = await supabase
				.from("profiles")
				.select("id, username, full_name, role, created_at")
				.order("created_at", { ascending: false });

			if (profilesError) {
				console.error("Error fetching profiles:", profilesError);
				throw new Error("Could not fetch profiles.");
			}
			// Ensure profilesData is not null before proceeding
			if (!profilesData) {
				throw new Error("No profiles data returned.");
			}

			// 2. Fetch users from supabase profile table and check if they are admin
			const { data: authUsersResponse, error: authUsersError } = await supabase
				.from("profiles")
				.select("id, username, full_name, role, created_at")
				.order("created_at", { ascending: false });


			if (authUsersError) {
				console.error("Error fetching auth users:", authUsersError);
				throw new Error("Could not fetch user authentication data.");
			}
			const authUsersMap = new Map(
				authUsersResponse.map((user: { id: any; role: any }) => [
					user.id,
					user.role,
				])
			);

			// 3. Combine data
			// Define a more specific type for profile if available from your DB schema types
			// For now, explicitly type profile to ensure properties exist
			interface Profile {
				id: string;
				username: string | null;
				full_name: string | null;
				role: string;
				created_at: string;
			}
			const combinedUsers: UserWithRole[] = profilesData.map(
				(profile: Profile) => ({
					...profile,
					email: authUsersMap.get(profile.id) ?? profile.username ?? "", // Use the typed profile
				})
			);

			return { success: true, data: combinedUsers };
		} catch (error) {
			console.error("Get users action error:", error);
			return {
				success: false,
				error: {
					code: "FETCH_USERS_FAILED",
					message:
						error instanceof Error ? error.message : "Failed to fetch users",
				},
			};
		}
	});

// Define a type for UserWithRole if it's not exported from the component
// export interface UserWithRole {
//   id: string;
//   email: string;
//   username: string | null;
//   full_name: string | null;
//   role: string;
//   created_at: string;
// }

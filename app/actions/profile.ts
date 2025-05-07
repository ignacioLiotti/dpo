"use server";

import { z } from "zod";
import { createSafeActionClient } from "next-safe-action";
import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

// Define a type for our response
export interface ActionResponse<T = undefined> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
	};
}

// Create our schema for profile updates
const profileUpdateSchema = z.object({
	username: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.nullable(),
	full_name: z.string().nullable(),
});

// Create a safe action client (internal implementation detail)
const actionClient = createSafeActionClient();

// Create the update profile action
export const updateProfile = actionClient
	.use(async ({ next }) => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("You must be logged in to update your profile");
		}

		return next({ ctx: { userId: user.id } });
	})
	.schema(profileUpdateSchema)
	.action(async ({ parsedInput, ctx }) => {
		try {
			const supabase = await createClient();
			const userId = ctx.userId as string;

			// Update the profile in the database
			const { data, error } = await supabase
				.from("profiles")
				.update({
					username: parsedInput.username,
					full_name: parsedInput.full_name,
					updated_at: new Date().toISOString(),
				})
				.eq("id", userId)
				.select()
				.single();

			console.log("dataasdasdasd", data);

			if (error) {
				console.error("Error updating profile:", error);
				return {
					success: false,
					error: {
						code: "UPDATE_FAILED",
						message: error.message || "Failed to update profile",
					},
				};
			}

			console.log("Profile updated successfully", data);
			// Revalidate the profile page to reflect changes
			revalidatePath("/profile");

			return {
				success: true,
				data: { updatedProfile: data },
			};
		} catch (error) {
			console.error("Update profile action error:", error);
			return {
				success: false,
				error: {
					code: "UNKNOWN_ERROR",
					message:
						error instanceof Error
							? error.message
							: "An unknown error occurred",
				},
			};
		}
	});

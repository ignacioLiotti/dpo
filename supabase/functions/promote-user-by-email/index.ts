import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.js";

interface RequestBody {
	email: string;
	newRole: "admin" | "user";
}

Deno.serve(async (req) => {
	// Handle CORS
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		// Get the authorization header
		const authHeader = req.headers.get("Authorization");
		if (!authHeader) {
			throw new Error("No authorization header");
		}

		// Create Supabase client
		const supabaseClient = createClient(
			Deno.env.get("SUPABASE_URL") ?? "",
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
			{
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
			}
		);

		// Verify the token and get admin user
		const {
			data: { user: adminUser },
			error: authError,
		} = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
		if (authError || !adminUser) throw new Error("Unauthorized");

		// Check if admin user has admin role
		const { data: adminProfile, error: adminProfileError } =
			await supabaseClient
				.from("profiles")
				.select("role")
				.eq("id", adminUser.id)
				.single();

		if (adminProfileError || !adminProfile || adminProfile.role !== "admin") {
			throw new Error("Unauthorized - Requires admin role");
		}

		// Get request body
		const { email, newRole } = (await req.json()) as RequestBody;

		// Get user by email
		const {
			data: { users },
			error: getUserError,
		} = await supabaseClient.auth.admin.listUsers();
		if (getUserError) throw getUserError;

		const targetUser = users.find((u) => u.email === email);
		if (!targetUser) {
			throw new Error("User not found");
		}

		// Check if profile exists, if not create it
		const { data: existingProfile, error: profileError } = await supabaseClient
			.from("profiles")
			.select("id")
			.eq("id", targetUser.id)
			.single();

		if (!existingProfile) {
			// Create profile if it doesn't exist
			const { error: createProfileError } = await supabaseClient
				.from("profiles")
				.insert({
					id: targetUser.id,
					role: newRole,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				});

			if (createProfileError) throw createProfileError;
		} else {
			// Update existing profile
			const { error: updateError } = await supabaseClient
				.from("profiles")
				.update({
					role: newRole,
					updated_at: new Date().toISOString(),
				})
				.eq("id", targetUser.id);

			if (updateError) throw updateError;
		}

		// Log the action
		await supabaseClient.from("audit_logs").insert({
			admin_id: adminUser.id,
			admin_email: adminUser.email,
			action: "promote_user",
			target_user_id: targetUser.id,
			target_user_email: targetUser.email,
			details: { new_role: newRole },
		});

		return new Response(
			JSON.stringify({
				success: true,
				message: `User ${email} has been promoted to ${newRole}`,
			}),
			{
				headers: { ...corsHeaders, "Content-Type": "application/json" },
				status: 200,
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message,
			}),
			{
				headers: { ...corsHeaders, "Content-Type": "application/json" },
				status: error.message.includes("Unauthorized") ? 403 : 400,
			}
		);
	}
});

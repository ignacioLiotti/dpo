import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.js";

interface RequestBody {
	userId: string;
	newRole: "admin" | "super_user" | "user";
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

		// Get request body
		const { userId, newRole } = (await req.json()) as RequestBody;

		// Get the user making the request
		const {
			data: { user: requestingUser },
			error: authError,
		} = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
		if (authError || !requestingUser) throw new Error("Unauthorized");

		// First check if user is a developer
		const { data: isDeveloper } = await supabaseClient
			.from("developer_emails")
			.select("email")
			.eq("email", requestingUser.email)
			.single();

		// If not a developer, check if they have admin role
		if (!isDeveloper) {
			const { data: profile } = await supabaseClient
				.from("profiles")
				.select("role")
				.eq("id", requestingUser.id)
				.single();

			if (!profile || profile.role !== "admin") {
				throw new Error(
					"Unauthorized: Must be an admin or developer to change roles"
				);
			}
		}

		// Check if admin is trying to remove their own admin status
		if (userId === requestingUser.id && newRole !== "admin" && !isDeveloper) {
			throw new Error("Cannot remove your own admin privileges");
		}

		// Update the user's role
		const { error: updateError } = await supabaseClient
			.from("profiles")
			.update({
				role: newRole,
				updated_at: new Date().toISOString(),
			})
			.eq("id", userId);

		if (updateError) throw updateError;

		// Get target user's email to include in logs
		const { data: targetUser } =
			await supabaseClient.auth.admin.getUserById(userId);
		const targetEmail = targetUser?.user?.email || "unknown";

		// Log the action
		await supabaseClient.from("audit_logs").insert({
			admin_id: requestingUser.id,
			admin_email: requestingUser.email,
			action: "update_role",
			target_user_id: userId,
			target_user_email: targetEmail,
			details: { new_role: newRole },
			ip_address:
				req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for"),
			user_agent: req.headers.get("user-agent"),
		});

		return new Response(
			JSON.stringify({
				success: true,
				message: `Role successfully updated to ${newRole}`,
			}),
			{
				headers: { ...corsHeaders, "Content-Type": "application/json" },
				status: 200,
			}
		);
	} catch (error) {
		console.error("Error:", error);
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

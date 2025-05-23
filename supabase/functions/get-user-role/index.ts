import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.js";
// This edge function gets the current user's role
Deno.serve(async (req) => {
	// Handle CORS preflight requests
	if (req.method === "OPTIONS") {
		return new Response("ok", {
			headers: corsHeaders,
		});
	}
	try {
		// Initialize Supabase client with env vars
		const supabaseUrl = Deno.env.get("SUPABASE_URL");
		const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
		const supabase = createClient(supabaseUrl, supabaseKey);
		// Get JWT from Authorization header
		const authHeader = req.headers.get("Authorization");
		if (!authHeader) {
			return new Response(
				JSON.stringify({
					error: "Missing authorization header",
				}),
				{
					status: 401,
					headers: {
						"Content-Type": "application/json",
						...corsHeaders,
					},
				}
			);
		}
		// Parse JWT and get user
		const jwt = authHeader.replace("Bearer ", "");
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser(jwt);
		if (userError || !user) {
			return new Response(
				JSON.stringify({
					error: userError?.message || "User not found",
				}),
				{
					status: 401,
					headers: {
						"Content-Type": "application/json",
						...corsHeaders,
					},
				}
			);
		}
		// Get user's profile including role
		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("role")
			.eq("id", user.id)
			.single();
		if (profileError) {
			return new Response(
				JSON.stringify({
					error: "Error fetching user role",
				}),
				{
					status: 500,
					headers: {
						"Content-Type": "application/json",
						...corsHeaders,
					},
				}
			);
		}
		const response = {
			role: profile?.role || "user",
		};
		return new Response(JSON.stringify(response), {
			headers: {
				"Content-Type": "application/json",
				...corsHeaders,
			},
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: "Internal server error",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
					...corsHeaders,
				},
			}
		);
	}
});

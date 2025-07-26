import { createServerSupabaseClient, getUserOrganization } from "@/app/auth/server-utils";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	// The `/auth/callback` route is required for the server-side auth flow implemented
	// by the SSR package. It exchanges an auth code for the user's session.
	// https://supabase.com/docs/guides/auth/server-side/nextjs
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const origin = requestUrl.origin;
	const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

	if (code) {
		const supabase = await createServerSupabaseClient();
		await supabase.auth.exchangeCodeForSession(code);
		
		// Check if user needs organization setup
		const { user, organizationId } = await getUserOrganization(supabase);
		
		// If user is authenticated but has no organization, redirect to setup
		if (user && !organizationId && !redirectTo) {
			return NextResponse.redirect(`${origin}/organization-setup`);
		}
	}

	if (redirectTo) {
		return NextResponse.redirect(`${origin}${redirectTo}`);
	}

	// URL to redirect to after sign up process completes
	return NextResponse.redirect(`${origin}/`);
}

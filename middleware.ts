import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function middleware(req: NextRequest) {
	// Create a Supabase client configured to use cookies
	const res = NextResponse.next();

	// Create a new supabase server client with the cookies
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get: (name) => {
					return req.cookies.get(name)?.value;
				},
				set: (name, value, options) => {
					res.cookies.set({
						name,
						value,
						...options,
					});
				},
				remove: (name, options) => {
					res.cookies.set({
						name,
						value: "",
						...options,
					});
				},
			},
		}
	);

	// Refresh session if expired - required for Server Components
	// https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
	const {
		data: { session },
	} = await supabase.auth.getSession();

	// Define protected paths and their required roles
	const protectedPaths = [{ path: "/super-user", requiredRole: "super_user" }];

	// Get the pathname from the URL
	const { pathname } = req.nextUrl;

	// Check if the current path is protected
	const matchedPath = protectedPaths.find((route) =>
		pathname.startsWith(route.path)
	);

	// If path is not protected or no session (will handle auth in the page), proceed
	if (!matchedPath || !session) {
		return res;
	}

	try {
		// If we have a session, check if the user has the required role
		const { data: profile } = await supabase
			.from("profiles")
			.select("role")
			.eq("id", session.user.id)
			.single();

		const userRole = profile?.role || "user";
		const requiredRole = matchedPath.requiredRole;

		// Define role hierarchy (higher number = higher privilege)
		const roleHierarchy: Record<string, number> = {
			user: 1,
			super_user: 2,
			admin: 3,
		};

		// Check if user's role has sufficient privileges
		if (roleHierarchy[userRole] >= roleHierarchy[requiredRole]) {
			// User has required role, proceed
			return res;
		} else {
			// User doesn't have the required role, redirect to unauthorized page
			return NextResponse.redirect(new URL("/unauthorized", req.url));
		}
	} catch (error) {
		console.error("Error in role-based middleware:", error);
		// On error, redirect to error page
		return NextResponse.redirect(new URL("/error", req.url));
	}
}

// Specify which paths this middleware should run on
export const config = {
	matcher: [
		"/super-user/:path*",
		// Add more paths as needed
	],
};

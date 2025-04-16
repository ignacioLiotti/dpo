import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Define public paths that don't require authentication
const publicPaths = ["/sign-in", "/sign-up"]; // Add any other public paths here

export async function middleware(request: NextRequest) {
	// This `try/catch` block is only here for the interactive tutorial.
	// Feel free to remove once you have Supabase connected.
	try {
		// Create an unmodified response
		let response = NextResponse.next({
			request: {
				headers: request.headers,
			},
		});

		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() {
						return request.cookies.getAll();
					},
					setAll(cookiesToSet) {
						cookiesToSet.forEach(({ name, value, options }) =>
							request.cookies.set(name, value)
						);
						response = NextResponse.next({
							request: {
								headers: request.headers,
							},
						});
						cookiesToSet.forEach(({ name, value, options }) =>
							response.cookies.set(name, value, options)
						);
					},
				},
			}
		);

		// IMPORTANT: Avoid writing any logic between createServerClient and
		// supabase.auth.getUser(). A simple mistake could make it very hard to debug
		// issues with users being randomly logged out.

		const {
			data: { user },
		} = await supabase.auth.getUser();

		// Check if the user is not authenticated and the current path is not public
		if (!user && !publicPaths.includes(request.nextUrl.pathname)) {
			// No user signed in and not accessing a public path, redirect to sign-in.
			const url = request.nextUrl.clone();
			url.pathname = "/sign-in";
			return NextResponse.redirect(url);
		}

		// IMPORTANT: You *must* return the Supabase response object as it is.
		// Adjustments for specific scenarios must involve modifying this response
		// object, ensuring cookies are preserved.
		return response;
	} catch (e) {
		// If you are here, a Supabase client could not be created!
		// This is likely because you have not set up environment variables.
		// Check out http://pris.ly/d/server-component-environment-variables for more info.
		return NextResponse.next({
			request: {
				headers: request.headers,
			},
		});
	}
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - api (API routes, you might want to protect these differently)
		 * - auth/callback (Supabase auth callback)
		 * Feel free to modify this pattern to include more paths.
		 */
		"/((?!_next/static|_next/image|favicon.ico|api|auth/callback|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};

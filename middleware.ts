import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export const config = {
	matcher: [
		/*
		 * Match all protected routes that require authentication
		 * Exclude public routes and static assets
		 */
		"/protected/:path*",
		"/api/:path*",
		"/((?!_next/static|_next/image|favicon.ico|public|sign-in|sign-up|auth).*)",
	],
};

export async function middleware(request: NextRequest) {
	return await updateSession(request);
}

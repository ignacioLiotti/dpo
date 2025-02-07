import { NextResponse } from "next/server";

export class APIError extends Error {
	status: number;
	code?: string;

	constructor(message: string, status: number = 400, code?: string) {
		super(message);
		this.name = "APIError";
		this.status = status;
		this.code = code;
	}
}

export function handleAPIError(error: unknown) {
	console.error("API Error:", error);

	if (error instanceof APIError) {
		return NextResponse.json(
			{ error: error.message, code: error.code },
			{ status: error.status }
		);
	}

	// Handle Prisma errors
	if (error && typeof error === "object" && "code" in error) {
		return NextResponse.json(
			{ error: "Database operation failed", code: error.code },
			{ status: 500 }
		);
	}

	if (error instanceof Error) {
		return NextResponse.json(
			{ error: error.message || "An error occurred" },
			{ status: 500 }
		);
	}

	return NextResponse.json(
		{ error: "An unexpected error occurred" },
		{ status: 500 }
	);
}

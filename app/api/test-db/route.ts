import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
	try {
		// Try to count obras as a simple test
		const count = await prisma.obras.count();
		return NextResponse.json({
			success: true,
			message: "Database connection successful",
			count,
		});
	} catch (error) {
		if (error instanceof Error) {
			console.log("Error: ", error.stack);
		}
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error ? error.message : "Database connection failed",
			},
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}

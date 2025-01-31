import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
	try {
		// Query to get all tables in the public schema
		const result = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;

		return NextResponse.json({
			success: true,
			tables: result,
		});
	} catch (error) {
		console.error("Database error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch tables" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}

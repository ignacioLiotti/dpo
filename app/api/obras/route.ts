import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedData } from "@/lib/cache";

export async function GET() {
	// Query 'obras' table from your local DB
	const obras = await getCachedData("obras", async () => {
		return prisma.obras.findMany({
			take: 10,
		});
	});
	return NextResponse.json(obras);
}

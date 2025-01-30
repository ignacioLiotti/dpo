import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedData } from "@/lib/cache";

export async function GET() {
	// Query 'inspectores' table from your local DB
	const inspectores = await getCachedData("inspectores", async () => {
		return prisma.inspectores.findMany();
	});
	return NextResponse.json(inspectores);
}

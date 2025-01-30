import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedData } from "@/lib/cache";

export async function GET() {
	// Query 'certificaciones' table from your local DB
	const certificaciones = await getCachedData("certificaciones", async () => {
		return prisma.certificaciones.findMany();
	});
	return NextResponse.json(certificaciones);
}

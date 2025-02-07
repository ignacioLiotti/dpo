import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedData } from "@/lib/cache";

export async function GET() {
	// Query 'proyectistass' table from your local DB
	const proyectistas = await getCachedData("proyectistas", async () => {
		return prisma.proyectistas.findMany();
	});
	return NextResponse.json(proyectistas);
}

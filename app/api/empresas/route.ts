import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedData } from "@/lib/cache";

export async function GET() {
	// Query 'empresas' table from your local DB
	const empresas = await getCachedData("empresas", async () => {
		return prisma.empresas.findMany();
	});
	return NextResponse.json(empresas);
}

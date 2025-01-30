import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedData } from "@/lib/cache";

export async function GET() {
	// Query 'elements' table from your local DBasdasd
	const elements = await getCachedData("elements", async () => {
		return prisma.elements.findMany();
	});
	return NextResponse.json(elements);
}

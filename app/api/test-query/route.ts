import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
	try {
		// Get count of obras
		const obrasCount = await prisma.obras.count();

		// Get first 5 obras
		const obras = await prisma.obras.findMany({
			take: 5,
			select: {
				IdObras: true,
				NombreObra: true,
				Monto_Contrato: true,
			},
		});

		return NextResponse.json({
			success: true,
			count: obrasCount,
			sample: obras,
		});
	} catch (error) {
		console.error("Database error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to query obras" },
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
}

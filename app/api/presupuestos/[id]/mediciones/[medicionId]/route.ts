import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/presupuestos/[id]/mediciones/[medicionId]
export async function GET(
	request: Request,
	{ params }: { params: { id: string; medicionId: string } }
) {
	try {
		const medicion = await prisma.mediciones.findFirst({
			where: {
				id: parseInt(params.medicionId),
				presupuestoId: parseInt(params.id),
			},
		});

		if (!medicion) {
			return NextResponse.json(
				{ error: "Medición no encontrada" },
				{ status: 404 }
			);
		}

		return NextResponse.json(medicion);
	} catch (error) {
		console.error("Error fetching medicion:", error);
		return NextResponse.json(
			{ error: "Error al cargar la medición" },
			{ status: 500 }
		);
	}
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/presupuestos/[id]/mediciones
export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const mediciones = await prisma.mediciones.findMany({
			where: {
				presupuestoId: parseInt(params.id),
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json(mediciones);
	} catch (error) {
		console.error("Error fetching mediciones:", error);
		return NextResponse.json(
			{ error: "Error al cargar las mediciones" },
			{ status: 500 }
		);
	}
}

// POST /api/presupuestos/[id]/mediciones
export async function POST(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const body = await request.json();
		const presupuestoId = parseInt(params.id);

		// Create the medicion
		const medicion = await prisma.mediciones.create({
			data: {
				presupuestoId,
				data: {
					...body.data,
					totalCompleted: body.totalCompleted,
					completedPercentage: body.completedPercentage,
				},
			},
		});

		return NextResponse.json(medicion);
	} catch (error) {
		console.error("Error creating medicion:", error);
		return NextResponse.json(
			{ error: "Error al crear la medición" },
			{ status: 500 }
		);
	}
}

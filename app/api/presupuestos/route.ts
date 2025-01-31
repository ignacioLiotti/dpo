// app/api/presupuestos/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST Handler
export async function POST(req: Request) {
	try {
		const request = await req.json();
		const { data, obraId } = request;

		console.log("aca", data, obraId);
		console.log("aca", await request);

		if (!obraId) {
			return NextResponse.json(
				{ error: "obraId is required" },
				{ status: 400 }
			);
		}

		// Create a new presupuesto
		const newPresupuesto = await prisma.presupuestos.create({
			data: {
				data,
				obraId,
			},
		});

		return NextResponse.json(newPresupuesto, { status: 201 });
	} catch (error) {
		if (error instanceof Error) {
			console.log("Error: ", error.stack);
		}
	}
}

// GET Handler
export async function GET() {
	try {
		// Fetch all presupuestos sorted by id
		const presupuestos = await prisma.presupuestos.findMany({
			orderBy: { id: "asc" },
		});
		return NextResponse.json(presupuestos, { status: 200 });
	} catch (error) {
		if (error instanceof Error) {
			console.log("Error: ", error.stack);
		}
	}
}

// PUT Handler
export async function PUT(req: Request) {
	try {
		const { id, data } = await req.json();

		if (!id) {
			return NextResponse.json({ error: "id is required" }, { status: 400 });
		}

		// Update an existing presupuesto
		const updatedPresupuesto = await prisma.presupuestos.update({
			where: { id: Number(id) },
			data: { data },
		});

		return NextResponse.json(updatedPresupuesto, { status: 200 });
	} catch (error) {
		if (error instanceof Error) {
			console.log("Error: ", error.stack);
		}
	}
}

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
			console.log("obraId is required. Error: ", error.stack);
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
export async function GET(req: Request) {
	try {
		const urlParts = req.url.split("/");
		const id = urlParts[urlParts.length - 1]; // Extract the id from the URL path
		console.log("id", id);

		if (id) {
			// Fetch a specific presupuesto by ID
			const presupuesto = await prisma.presupuestos.findUnique({
				where: { id: Number(id) },
			});

			if (!presupuesto) {
				return NextResponse.json(
					{ error: "Presupuesto not found" },
					{ status: 404 }
				);
			}

			return NextResponse.json(presupuesto, { status: 200 });
		} else {
			return NextResponse.json({ error: "id is required" }, { status: 400 });
		}
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

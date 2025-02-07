// app/api/presupuestos/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { handleAPIError } from "@/lib/utils/errorHandler";
import {
	getPresupuestoById,
	updatePresupuesto,
	deletePresupuesto,
} from "@/app/controllers/presupuestos.controller";

const prisma = new PrismaClient();

// POST Handler
export async function POST(req: Request) {
	try {
		const request = await req.json();
		const { data, obraId } = request;

		console.log("aca", data, obraId);
		console.log("aca", await request);
		if (!obraId) {
			console.log("obraId is required");
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
export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const presupuesto = await getPresupuestoById(Number(params.id));
		return NextResponse.json(presupuesto);
	} catch (error) {
		return handleAPIError(error);
	}
}

// PUT Handler
export async function PUT(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const data = await request.json();
		const presupuesto = await updatePresupuesto(Number(params.id), data);
		return NextResponse.json(presupuesto);
	} catch (error) {
		return handleAPIError(error);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		await deletePresupuesto(Number(params.id));
		return new NextResponse(null, { status: 204 });
	} catch (error) {
		return handleAPIError(error);
	}
}

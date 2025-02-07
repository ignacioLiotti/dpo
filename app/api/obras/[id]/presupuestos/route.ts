import { NextRequest, NextResponse } from "next/server";
import { handleAPIError } from "@/lib/utils/errorHandler";
import {
	getPresupuestosByObraId,
	createPresupuesto,
} from "@/app/controllers/presupuestos.controller";

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const presupuestos = await getPresupuestosByObraId(Number(params.id));
		return NextResponse.json(presupuestos);
	} catch (error) {
		return handleAPIError(error);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const data = await request.json();
		const presupuesto = await createPresupuesto(Number(params.id), data);
		return NextResponse.json(presupuesto, { status: 201 });
	} catch (error) {
		return handleAPIError(error);
	}
}

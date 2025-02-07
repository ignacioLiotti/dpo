import { NextRequest, NextResponse } from "next/server";
import { handleAPIError } from "@/lib/utils/errorHandler";
import { validateRequiredFields } from "@/lib/utils/validation";
import {
	getObraById,
	updateObra,
	deleteObra,
} from "@/app/controllers/obras.controller";

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = await params;
		const paramsId = Number(id);
		const obra = await getObraById(paramsId);

		if (!obra) {
			return NextResponse.json({ error: "Obra not found" }, { status: 404 });
		}

		return NextResponse.json(obra);
	} catch (error) {
		return handleAPIError(error);
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = await params;
		const data = await request.json();
		validateRequiredFields(data, ["NombreObra"]);
		const obra = await updateObra(Number(id), data);
		return NextResponse.json(obra);
	} catch (error) {
		return handleAPIError(error);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = await params;
		await deleteObra(Number(id));
		return new NextResponse(null, { status: 204 });
	} catch (error) {
		return handleAPIError(error);
	}
}

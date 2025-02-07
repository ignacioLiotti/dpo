import { NextRequest, NextResponse } from "next/server";
import { handleAPIError } from "@/lib/utils/errorHandler";
import { validateRequiredFields } from "@/lib/utils/validation";
import { createObra, getAllObras } from "@/app/controllers/obras.controller";

export async function GET() {
	try {
		const obras = await getAllObras();
		if (!obras) {
			return NextResponse.json({ obras: [] });
		}
		return NextResponse.json(obras);
	} catch (error) {
		return handleAPIError(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		const data = await request.json();
		validateRequiredFields(data, ["NombreObra"]);
		const obra = await createObra(data);
		return NextResponse.json(obra, { status: 201 });
	} catch (error) {
		return handleAPIError(error);
	}
}

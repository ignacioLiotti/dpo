import { NextRequest, NextResponse } from "next/server";
import {
	getData,
	createData,
	updateData,
	deleteData,
} from "@/app/controllers/data.controller";
import { APIError } from "@/lib/utils/errorHandler";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const type = searchParams.get("type") as
			| "obra"
			| "presupuesto"
			| "medicion";
		const id = searchParams.get("id");

		if (!type) {
			throw new APIError("El parámetro 'type' es requerido");
		}

		const data = await getData(type, id ? parseInt(id) : undefined);
		return NextResponse.json(data);
	} catch (error) {
		if (error instanceof APIError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status }
			);
		}
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const type = searchParams.get("type") as
			| "obra"
			| "presupuesto"
			| "medicion";

		if (!type) {
			throw new APIError("El parámetro 'type' es requerido");
		}

		const body = await request.json();
		const data = await createData(type, body);
		return NextResponse.json(data);
	} catch (error) {
		if (error instanceof APIError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status }
			);
		}
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const type = searchParams.get("type") as
			| "obra"
			| "presupuesto"
			| "medicion";
		const id = searchParams.get("id");

		if (!type || !id) {
			throw new APIError("Los parámetros 'type' e 'id' son requeridos");
		}

		const body = await request.json();
		const data = await updateData(type, parseInt(id), body);
		return NextResponse.json(data);
	} catch (error) {
		if (error instanceof APIError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status }
			);
		}
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const type = searchParams.get("type") as
			| "obra"
			| "presupuesto"
			| "medicion";
		const id = searchParams.get("id");

		if (!type || !id) {
			throw new APIError("Los parámetros 'type' e 'id' son requeridos");
		}

		const data = await deleteData(type, parseInt(id));
		return NextResponse.json(data);
	} catch (error) {
		if (error instanceof APIError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status }
			);
		}
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

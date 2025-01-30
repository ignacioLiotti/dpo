import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const certificados = await prisma.certificadosObraMensuales.findMany({
			include: {
				presupuesto: true,
				certificadoAnterior: true,
				certificadoSiguiente: true,
			},
		});
		return NextResponse.json(certificados);
	} catch (error) {
		console.error("Error fetching certificados:", error);
		return NextResponse.json(
			{ error: "Error fetching certificados" },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { presupuestoId, documentoJson, certificadoAnteriorId } = body;

		const certificado = await prisma.certificadosObraMensuales.create({
			data: {
				presupuestoId,
				documentoJson,
				certificadoAnteriorId,
			},
			include: {
				presupuesto: true,
				certificadoAnterior: true,
			},
		});

		return NextResponse.json(certificado);
	} catch (error) {
		if (error instanceof Error) {
			console.log("Error: ", error.stack);
		}
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

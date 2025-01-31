import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const id = (await params).id;
		const certificado = await prisma.certificadosObraMensuales.findUnique({
			where: {
				id: parseInt(id),
			},
			include: {
				presupuesto: true,
				certificadoAnterior: true,
				certificadoSiguiente: true,
			},
		});

		if (!certificado) {
			return NextResponse.json(
				{ error: "Certificado not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(certificado);
	} catch (error) {
		console.error("Error fetching certificado:", error);
		return NextResponse.json(
			{ error: "Error fetching certificado" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const body = await request.json();
		const { documentoJson } = body;
		const id = (await params).id;

		const certificado = await prisma.certificadosObraMensuales.update({
			where: {
				id: parseInt(id),
			},
			data: {
				documentoJson,
			},
			include: {
				presupuesto: true,
				certificadoAnterior: true,
				certificadoSiguiente: true,
			},
		});

		return NextResponse.json(certificado);
	} catch (error) {
		console.error("Error updating certificado:", error);
		return NextResponse.json(
			{ error: "Error updating certificado" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const id = (await params).id;
		await prisma.certificadosObraMensuales.delete({
			where: {
				id: parseInt(id),
			},
		});

		return NextResponse.json({ message: "Certificado deleted successfully" });
	} catch (error) {
		console.error("Error deleting certificado:", error);
		return NextResponse.json(
			{ error: "Error deleting certificado" },
			{ status: 500 }
		);
	}
}

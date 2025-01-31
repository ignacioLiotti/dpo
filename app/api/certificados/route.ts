import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const certificados = await prisma.certificaciones.findMany();
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
		const certificado = await prisma.certificaciones.create({
			data: body,
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

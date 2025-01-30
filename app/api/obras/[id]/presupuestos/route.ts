import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"; // Import Prisma Client

const prisma = new PrismaClient(); // Initialize Prisma Client

// Function to handle GET request for presupuestos of a singular obra
export async function GET(req: Request) {
	try {
		const urlParts = req.url.split("/");
		console.log("urlParts", urlParts);
		const id = parseInt(urlParts[urlParts.length - 2], 10); // Ensure id is parsed as an integer

		// Fetch the presupuestos related to the obra from your data source using Prisma
		const presupuestos = await prisma.presupuestos.findMany({
			where: { obraId: id }, // Replace 'obraId' with the correct field name if different
			include: { certificados: true }, // Include certificados
		});

		if (!presupuestos || presupuestos.length === 0) {
			return NextResponse.json(
				{ error: "No presupuestos found for this obra" },
				{ status: 404 }
			);
		}

		return NextResponse.json(presupuestos, { status: 200 }); // Return the presupuestos data
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

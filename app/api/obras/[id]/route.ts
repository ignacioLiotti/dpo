import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"; // Import Prisma Client

const prisma = new PrismaClient(); // Initialize Prisma Client

// Function to handle GET request for a singular obra
export async function GET(req: Request) {
	try {
		const urlParts = req.url.split("/");
		const id = Number(urlParts[urlParts.length - 1]); // Extract and convert the id to number

		// Fetch the obra from your data source using Prisma
		const obra = await prisma.obras.findUnique({
			where: { IdObras: id },
		});

		if (!obra) {
			return NextResponse.json({ error: "obra not found" }, { status: 404 });
		}

		return NextResponse.json(obra, { status: 200 }); // Return the obra data
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

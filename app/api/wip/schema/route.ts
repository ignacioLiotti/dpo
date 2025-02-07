import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
	try {
		const schemaText = fs.readFileSync(
			path.join(process.cwd(), "prisma/schema.prisma"),
			"utf8"
		);
		return NextResponse.json({ schema: schemaText });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to read schema" },
			{ status: 500 }
		);
	}
}

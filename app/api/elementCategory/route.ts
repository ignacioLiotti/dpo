import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
	try {
		// Parse the query parameter from the request
		const url = new URL(req.url);
		const category = url.searchParams.get("category");

		// Validate the category parameter exists
		if (!category) {
			return NextResponse.json(
				{ error: "Category parameter is required." },
				{ status: 400 }
			);
		}

		// Fetch items for the requested category
		const elements = await prisma.items.findMany({
			where: {
				origin_table: category,
			},
			include: {
				prices: {
					orderBy: {
						price_date: "desc",
					},
					take: 1,
				},
			},
		});

		// Map elements to include only necessary fields
		const result = elements.map((element) => ({
			id: element.id,
			code: element.cod,
			name: element.item_name,
			unit: element.unid,
			price: element.prices[0]?.price || 0,
			category: element.category,
			origin: element.origin_table,
		}));

		// Return the result
		return NextResponse.json(result);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}

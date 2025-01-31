import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
	try {
		// Parse the query parameter from the request
		const url = new URL(req.url);
		const category = url.searchParams.get("category");

		// Validate the category
		if (
			!["materiales", "indices", "items", "jornales"].includes(category || "")
		) {
			return NextResponse.json(
				{ error: "Invalid or missing category." },
				{ status: 400 }
			);
		}
		// Fetch elements and tags for the requested category
		const elements = await (
			prisma[category as keyof typeof prisma] as any
		).findMany({
			include: {
				[`${category}_prices`]: {
					orderBy: { valid_from: "desc" },
					take: 1,
				},
				element_tags: {
					include: {
						tags: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		});
		// Map elements to include only necessary fields for the combobox
		const result = elements.map((element: any) => ({
			id: element.id,
			name: element.name || "Sin descripción",
			unit: element.unit || "",
			price: element[`${category}_prices`]?.[0]?.price || 0,
			tags: element.element_tags?.map(
				(tag: { tags: { id: number; name: string } }) => ({
					id: tag.tags.id,
					name: tag.tags.name,
				})
			),
		}));

		// Return the result
		return NextResponse.json(result);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}

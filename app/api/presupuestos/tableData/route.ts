import { prisma } from "@/lib/prisma";
import { getCachedData } from "@/lib/cache";
import { NextResponse } from "next/server";

// A small utility to sanitize or validate sort fields
function getSortClause(sortParam: string | null): string {
	if (!sortParam) {
		return "ORDER BY i.id ASC"; // default
	}

	// Example: sort=cod:asc or sort=name:desc
	const [field, dir] = sortParam.split(":");
	const sortField = (field || "").trim();
	const sortDir = (dir || "").trim().toUpperCase() === "DESC" ? "DESC" : "ASC";

	// Whitelist valid columns for sorting
	const validColumns = [
		"id",
		"cod",
		"name",
		"unit",
		"category",
		"type",
		"origin_table",
	];
	if (!validColumns.includes(sortField)) {
		return "ORDER BY i.id ASC"; // fallback if invalid
	}

	return `ORDER BY i.${sortField} ${sortDir}`;
}

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);

		// 1) Grab parameters
		const page = parseInt(url.searchParams.get("page") || "0", 10); // e.g. 0, 1, 2, ...
		const limit = parseInt(url.searchParams.get("limit") || "100", 10);
		const searchTerm = url.searchParams.get("search") || ""; // e.g. "wood"
		const sortParam = url.searchParams.get("sort"); // e.g. "cod:asc"

		// 2) Convert page -> offset
		const start = page * limit;

		// 3) Build the ORDER BY clause
		const orderByClause = getSortClause(sortParam);

		// 4) Build a small WHERE clause for search
		//    Below we match `name` to the searchTerm (case-insensitive).
		//    Adjust for your DB or additional columns as needed.
		//    If you are on Postgres, you can do ILIKE. MySQL only has LOWER().
		const safeSearch = searchTerm.replace(/'/g, "''"); // naive escaping example
		const whereClause = safeSearch
			? `WHERE LOWER(i.name) LIKE LOWER('%${safeSearch}%')`
			: "";

		// 5) Use the cache or fetch anew
		const data = await getCachedData(
			`items_page_${page}_limit_${limit}_search_${searchTerm}_sort_${sortParam}`,
			async () => {
				// Debug query to see the actual data in prices table
				const debugQuery = `
          SELECT *
          FROM prices
          LIMIT 3;
        `;

				const itemsQuery = `
          SELECT
            i.id,
            i.cod,
            i.name,
            i.unit,
            i.category,
            i.type,
            i.origin_table,
            COALESCE(p.price, 0) as price,
            p.priceDate
          FROM items i
          LEFT JOIN (
            SELECT itemId, price, priceDate
            FROM prices p1
            WHERE (itemId, priceDate) IN (
              SELECT itemId, MAX(priceDate) as max_date
              FROM prices
              GROUP BY itemId
            )
          ) p ON i.id = p.itemId
          ${whereClause}
          ${orderByClause}
          LIMIT ${limit} OFFSET ${start}
        `;

				// 5b) Fetch total count (for all matching rows)
				const totalQuery = `
          SELECT COUNT(*) AS count
          FROM items i
          ${whereClause}
        `;

				const [items, totals, debugResults] = await Promise.all([
					prisma.$queryRawUnsafe(itemsQuery),
					prisma.$queryRawUnsafe(totalQuery),
					prisma.$queryRawUnsafe(debugQuery),
				]);

				console.log("Debug - First few prices:", debugResults);

				// 6) Process items to match the expected format
				const itemsWithDetails = (items as any[]).map((item) => ({
					id: item.id,
					name: item.name,
					unit: item.unit,
					price: item.price,
					precio: item.price,
					category: item.category,
					type: item.type,
					origin_table: item.origin_table,
				}));

				// 7) Group items by their category instead of origin_table
				const groupedItems = itemsWithDetails.reduce((acc, item) => {
					const category = item.category || "Sin Categoría";
					if (!acc[category]) {
						acc[category] = [];
					}
					acc[category].push(item);
					return acc;
				}, {} as Record<string, typeof itemsWithDetails>);

				// 8) Return the grouped data directly
				return groupedItems;
			}
		);

		// 9) Check and respond
		const allArraysEmpty = Object.values(data).every(
			(val) => Array.isArray(val) && val.length === 0
		);
		if (!data || allArraysEmpty) {
			return NextResponse.json(
				{ error: "No hay elementos disponibles." },
				{ status: 404 }
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		if (error instanceof Error) {
			console.log("Error: ", error.stack);
		}
		console.error("Error fetching items:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}

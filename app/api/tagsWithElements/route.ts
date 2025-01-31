import { prisma } from "@/lib/prisma";
import { getCachedData } from "@/lib/cache";
import { NextResponse } from "next/server";

// A small utility to sanitize or validate sort fields
function getSortClause(sortParam: string | null): string {
	if (!sortParam) {
		return "ORDER BY i.id ASC"; // default
	}

	// Example: sort=cod:asc or sort=item_name:desc
	const [field, dir] = sortParam.split(":");
	const sortField = (field || "").trim();
	const sortDir = (dir || "").trim().toUpperCase() === "DESC" ? "DESC" : "ASC";

	// Whitelist valid columns for sorting
	const validColumns = [
		"id",
		"cod",
		"item_name",
		"unid",
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
		//    Below we match `item_name` to the searchTerm (case-insensitive).
		//    Adjust for your DB or additional columns as needed.
		//    If you are on Postgres, you can do ILIKE. MySQL only has LOWER().
		const safeSearch = searchTerm.replace(/'/g, "''"); // naive escaping example
		const whereClause = safeSearch
			? `WHERE LOWER(i.item_name) LIKE LOWER('%${safeSearch}%')`
			: "";

		// 5) Use the cache or fetch anew
		const data = await getCachedData(
			`items_page_${page}_limit_${limit}_search_${searchTerm}_sort_${sortParam}`,
			async () => {
				// 5a) Fetch paginated items
				const itemsQuery = `
          SELECT
            i.id,
            i.cod,
            i.item_name,
            i.unid,
            i.category,
            i.type,
            i.origin_table,
            i.publicar,
            p.price,
            p.price_date
          FROM items i
          LEFT JOIN (
            SELECT item_id, price, price_date
            FROM prices p1
            WHERE (item_id, price_date) IN (
              SELECT item_id, MAX(price_date) as max_date
              FROM prices
              GROUP BY item_id
            )
          ) p ON i.id = p.item_id
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

				const [items, totalResult] = await Promise.all([
					prisma.$queryRawUnsafe(itemsQuery),
					prisma.$queryRawUnsafe(totalQuery),
				]);

				// totalResult should be an array of objects; each object has { count: number }
				const totalCount =
					Array.isArray(totalResult) && totalResult[0]?.count
						? Number(totalResult[0].count)
						: 0;

				// 6) Process items to match the expected format
				const itemsWithDetails = (items as any[]).map((item) => ({
					id: item.id,
					codigo: item.cod,
					nombre: item.item_name,
					unidad: item.unid,
					precio: item.price,
					fecha_precio: item.price_date,
					category: item.category,
					type: item.type,
					origin_table: item.origin_table,
				}));

				// 7) Group items by their origin (backward compatibility)
				const groupedItems = itemsWithDetails.reduce((acc, item) => {
					const category = item.origin_table?.toLowerCase() || "uncategorized";
					if (!acc[category]) {
						acc[category] = [];
					}
					acc[category].push(item);
					return acc;
				}, {} as Record<string, typeof itemsWithDetails>);

				// 8) Return with total + grouped data
				return {
					materiales: groupedItems["materiales"] || [],
					indices: groupedItems["indices"] || [],
					items: groupedItems["items"] || [],
					jornales: groupedItems["jornales"] || [],
					total: totalCount,
				};
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

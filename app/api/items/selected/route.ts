import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const selectedIds = searchParams.get("ids")?.split(",") || [];

		if (selectedIds.length === 0) {
			return NextResponse.json({ items: [] });
		}

		const supabase = await createClient();

		// Fetch items with their latest prices
		const { data: items, error } = await supabase
			.from("items")
			.select(
				`
        *,
        precios!inner (
          precio,
          fecha
        )
      `
			)
			.in("id", selectedIds);

		if (error) {
			console.error("Error fetching items:", error);
			return NextResponse.json(
				{ error: "Failed to fetch items" },
				{ status: 500 }
			);
		}

		// Process items to get the latest price for each
		const processedItems = items?.map((item) => {
			const prices = item.precios;
			// Sort prices by date and get the latest one
			const latestPrice = prices.sort(
				(a: any, b: any) =>
					new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
			)[0];

			// Convert to the format expected by the presupuesto page
			return {
				id: item.id,
				name: item.nombre,
				unit: item.unidad,
				quantity: 1, // Default quantity
				unitPrice: latestPrice?.precio || 0,
				totalPrice: latestPrice?.precio || 0, // Initially same as unit price
				price: latestPrice?.precio || 0,
				category: item.categoria,
				parcial: 0,
				rubro: 0,
				accumulated: 0,
				element_tags: [{ tags: { name: item.categoria } }],
			};
		});

		// Group items by category
		const groupedItems = processedItems.reduce((acc: any, item) => {
			const category = item.category;
			if (!acc[category]) {
				acc[category] = [];
			}
			acc[category].push(item);
			return acc;
		}, {});

		return NextResponse.json({
			presupuestoData: groupedItems,
			allElements: processedItems,
			mediciones: [], // Empty mediciones array as initial state
		});
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

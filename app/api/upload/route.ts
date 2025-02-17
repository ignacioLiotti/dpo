import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const supabase = await createClient();

		// Parse the request body
		const { items, priceDate } = await request.json();

		if (!items || !Array.isArray(items) || !priceDate) {
			return NextResponse.json(
				{ error: "Invalid data format" },
				{ status: 400 }
			);
		}

		let successCount = 0;

		// Process items in batches to handle potential duplicates
		for (const item of items) {
			try {
				// First, try to find if the item already exists
				const { data: existingItems, error: searchError } = await supabase
					.from("items")
					.select("id")
					.eq("nombre", item.nombre)
					.eq("unidad", item.unidad)
					.eq("categoria", item.categoria)
					.single();

				if (searchError && searchError.code !== "PGRST116") {
					// PGRST116 is the "no rows returned" error
					console.error("Error searching for item:", searchError);
					continue;
				}

				let itemId;

				if (existingItems) {
					// Item exists, use its ID
					itemId = existingItems.id;
				} else {
					// Item doesn't exist, insert it
					const { data: newItem, error: insertError } = await supabase
						.from("items")
						.insert({
							codigo: `${item.categoria.substring(0, 3).toUpperCase()}-${Date.now()}`, // Generate a simple code
							nombre: item.nombre,
							unidad: item.unidad,
							categoria: item.categoria,
						})
						.select()
						.single();

					if (insertError) {
						console.error("Error inserting item:", insertError);
						continue;
					}

					itemId = newItem.id;
				}

				// Insert the price for this item
				const { error: priceError } = await supabase.from("precios").insert({
					item_id: itemId,
					precio: item.precio,
					fecha: priceDate,
				});

				if (priceError) {
					console.error("Error inserting price:", priceError);
					continue;
				}

				successCount++;
			} catch (itemError) {
				console.error("Error processing item:", itemError);
				continue;
			}
		}

		return NextResponse.json(
			{ success: true, count: successCount },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error processing request:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

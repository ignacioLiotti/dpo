import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		const page = parseInt(searchParams.get("page") || "0");
		const limit = parseInt(searchParams.get("limit") || "10");
		const search = searchParams.get("search") || "";
		const sort = searchParams.get("sort") || "";

		const supabase = await createClient();

		if (id) {
			const { data: item, error } = await supabase
				.from("items")
				.select(
					`
					*,
					precios (
						*
					)
				`
				)
				.eq("id", id)
				.order("fecha", { foreignTable: "precios", ascending: false })
				.single();

			if (error) throw error;
			return NextResponse.json(item);
		}

		// Start building the query
		let query = supabase.from("items").select(
			`
				*,
				precios (
					*
				)
			`,
			{ count: "exact" }
		); // Add count to get total

		// Add search if provided
		if (search) {
			query = query.or(
				`nombre.ilike.%${search}%,categoria.ilike.%${search}%,unidad.ilike.%${search}%`
			);
		}

		// Add sorting if provided
		if (sort) {
			const [column, order] = sort.split(":");
			if (column && order) {
				query = query.order(column, { ascending: order === "asc" });
			}
		} else {
			// Default sorting
			query = query.order("created_at", { ascending: false });
		}

		// Add pagination
		const from = page * limit;
		const to = from + limit - 1;
		query = query.range(from, to);

		// Execute the query
		const { data: items, error, count } = await query;

		if (error) throw error;

		// Process items to include only the latest price
		const processedItems = items.map((item) => ({
			...item,
			precios: item.precios.slice(0, 1), // Keep only the latest price
		}));

		return NextResponse.json({
			items: processedItems,
			total: count || 0,
			page,
			limit,
			pageCount: Math.ceil((count || 0) / limit),
			hasMore: (page + 1) * limit < (count || 0),
		});
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch items" },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const data = await request.json();

		const { data: item, error } = await supabase
			.from("items")
			.insert([
				{
					codigo: data.codigo,
					nombre: data.nombre,
					unidad: data.unidad,
					categoria: data.categoria,
				},
			])
			.select(
				`
				*,
				precios (
					*
				)
			`
			)
			.single();

		if (error) throw error;
		return NextResponse.json(item);
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to create item" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const supabase = await createClient();
		const { id, ...data } = await request.json();

		const { data: item, error } = await supabase
			.from("items")
			.update(data)
			.eq("id", id)
			.select(
				`
				*,
				precios (
					*
				)
			`
			)
			.single();

		if (error) throw error;
		return NextResponse.json(item);
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to update item" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const supabase = await createClient();
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({ error: "ID is required" }, { status: 400 });
		}

		// Supabase will automatically delete related prices due to ON DELETE CASCADE
		const { error } = await supabase.from("items").delete().eq("id", id);

		if (error) throw error;
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to delete item" },
			{ status: 500 }
		);
	}
}

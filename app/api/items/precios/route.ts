import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const { itemId, precio, fecha } = await request.json();

		const { data: price, error } = await supabase
			.from("precios")
			.insert([
				{
					item_id: itemId,
					precio,
					fecha: new Date(fecha).toISOString(),
				},
			])
			.select()
			.single();

		if (error) throw error;
		return NextResponse.json(price);
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json({ error: "Failed to add price" }, { status: 500 });
	}
}

export async function GET(request: Request) {
	try {
		const supabase = await createClient();
		const { searchParams } = new URL(request.url);
		const itemId = searchParams.get("itemId");

		if (!itemId) {
			return NextResponse.json(
				{ error: "itemId is required" },
				{ status: 400 }
			);
		}

		const { data: prices, error } = await supabase
			.from("precios")
			.select("*")
			.eq("item_id", itemId)
			.order("fecha", { ascending: false });

		if (error) throw error;
		return NextResponse.json(prices);
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch prices" },
			{ status: 500 }
		);
	}
}

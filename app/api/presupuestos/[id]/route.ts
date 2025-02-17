import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const supabase = await createClient();

		const { data: presupuesto, error } = await supabase
			.from("presupuestos")
			.select("*")
			.eq("id", id)
			.single();

		if (error) throw error;

		// No need to transform the data anymore, just return it as is
		return NextResponse.json(presupuesto);
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch presupuesto" },
			{ status: 500 }
		);
	}
}

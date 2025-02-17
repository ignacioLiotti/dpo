import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_: NextRequest, { params }: any) {
	try {
		const supabase = await createClient();
		const { id } = await params;

		if (!id) {
			return NextResponse.json(
				{ error: "Se requiere el ID de la obra" },
				{ status: 400 }
			);
		}

		const { data: mediciones, error } = await supabase
			.from("mediciones")
			.select("*")
			.eq("obra_id", id)
			.order("month", { ascending: false });

		if (error) {
			console.error("Error fetching mediciones:", error);
			return NextResponse.json(
				{ error: "Error al obtener las mediciones" },
				{ status: 500 }
			);
		}

		return NextResponse.json(mediciones);
	} catch (error) {
		console.error("Error in mediciones GET:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

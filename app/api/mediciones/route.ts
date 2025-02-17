import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

interface MedicionItem {
	id: string;
	anterior: number;
	presente: number;
	acumulado: number;
}

interface MedicionSeccion {
	nombre: string;
	items: MedicionItem[];
}

interface MedicionData {
	secciones: MedicionSeccion[];
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const obraId = searchParams.get("obraId");
		const id = searchParams.get("id");

		console.log("obraId", obraId);
		console.log("id", id);

		const supabase = await createClient();

		if (id) {
			const { data: medicion, error } = await supabase
				.from("mediciones")
				.select("*")
				.eq("id", id)
				.single();

			if (error) throw error;
			return NextResponse.json(medicion);
		}

		console.log("obraId", obraId);

		if (obraId) {
			const { data: mediciones, error } = await supabase
				.from("mediciones")
				.select("*")
				.eq("obra_id", obraId)
				.order("periodo", { ascending: false });

			console.log("mediciones", mediciones);

			if (error) throw error;
			return NextResponse.json(mediciones);
		}

		return NextResponse.json(
			{ error: "obraId or id is required" },
			{ status: 400 }
		);
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch mediciones" },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const body = await request.json();
		console.log("body", body);
		const { obraId, presupuestoId, periodo, data } = body;

		// Validate required fields
		if (!obraId || !periodo || !data) {
			return NextResponse.json(
				{ error: "obraId, periodo, and data are required" },
				{ status: 400 }
			);
		}

		// Type check for obraId
		if (typeof obraId !== "number") {
			return NextResponse.json(
				{ error: "obraId must be a number" },
				{ status: 400 }
			);
		}

		// Validate data structure
		if (!data.secciones || !Array.isArray(data.secciones)) {
			return NextResponse.json(
				{ error: "data must contain a secciones array" },
				{ status: 400 }
			);
		}

		// Store presupuestoId in the data object if provided
		const fullData = {
			...data,
			presupuestoId, // Store presupuestoId in the JSONB data field
		};

		// Create medicion
		const { data: medicion, error: medicionError } = await supabase
			.from("mediciones")
			.insert([
				{
					obra_id: obraId,
					periodo: new Date(periodo).toISOString(),
					data: fullData,
				},
			])
			.select()
			.single();

		if (medicionError) {
			console.error("Error creating medicion:", medicionError);
			throw new Error(medicionError.message);
		}

		return NextResponse.json(medicion);
	} catch (error) {
		console.error("Error creating medicion:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to create medicion",
			},
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const supabase = await createClient();
		const { id, periodo, data, presupuestoId } = await request.json();

		if (!id || !periodo || !data) {
			return NextResponse.json(
				{ error: "id, periodo, and data are required" },
				{ status: 400 }
			);
		}

		// Store presupuestoId in the data object if provided
		const fullData = {
			...data,
			presupuestoId, // Store presupuestoId in the JSONB data field
		};

		// Update medicion
		const { data: updatedMedicion, error: updateError } = await supabase
			.from("mediciones")
			.update({
				periodo: new Date(periodo).toISOString(),
				data: fullData,
			})
			.eq("id", id)
			.select()
			.single();

		if (updateError) {
			console.error("Error updating medicion:", updateError);
			throw new Error(updateError.message);
		}

		return NextResponse.json(updatedMedicion);
	} catch (error) {
		console.error("Error updating medicion:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to update medicion",
			},
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

		const { error } = await supabase.from("mediciones").delete().eq("id", id);

		if (error) {
			console.error("Error deleting medicion:", error);
			throw new Error(error.message);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to delete medicion",
			},
			{ status: 500 }
		);
	}
}

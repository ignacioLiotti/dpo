import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const supabase = await createClient();
		const obraId = request.url.split("=")[1];

		if (!obraId) {
			return NextResponse.json(
				{ error: "Se requiere el ID de la obra" },
				{ status: 400 }
			);
		}

		const { data: presupuestos, error } = await supabase
			.from("presupuestos")
			.select("*")
			.eq("obra_id", obraId)
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Error fetching presupuestos:", error);
			return NextResponse.json(
				{ error: "Error al obtener los presupuestos" },
				{ status: 500 }
			);
		}

		return NextResponse.json(presupuestos);
	} catch (error) {
		console.error("Error in presupuestos GET:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const { obraId, medicionId, progress, data } = await request.json();

		// Validate required fields
		if (!obraId || !medicionId || !progress || !data) {
			return NextResponse.json(
				{ error: "Faltan campos requeridos" },
				{ status: 400 }
			);
		}

		// Create presupuesto
		const { data: presupuesto, error: presupuestoError } = await supabase
			.from("presupuestos")
			.insert({
				obra_id: obraId,
				medicion_id: medicionId,
				progress: progress,
				data: data,
				created_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (presupuestoError) {
			console.error("Error creating presupuesto:", presupuestoError);
			return NextResponse.json(
				{ error: "Error al crear el presupuesto" },
				{ status: 500 }
			);
		}

		return NextResponse.json(presupuesto);
	} catch (error) {
		console.error("Error in presupuestos POST:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const supabase = await createClient();
		const { id, nombre, total, data } = await request.json();

		if (!id || !nombre || !data || typeof total !== "number") {
			return NextResponse.json(
				{ error: "id, nombre, total, and data are required" },
				{ status: 400 }
			);
		}

		// Update presupuesto
		const { data: updatedPresupuesto, error: updateError } = await supabase
			.from("presupuestos")
			.update({
				nombre,
				total,
				data,
			})
			.eq("id", id)
			.select()
			.single();

		if (updateError) throw updateError;
		return NextResponse.json(updatedPresupuesto);
	} catch (error) {
		console.error("Error updating presupuesto:", error);
		return NextResponse.json(
			{ error: "Failed to update presupuesto" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const supabase = await createClient();
		const { id } = await request.json();

		if (!id) {
			return NextResponse.json({ error: "ID is required" }, { status: 400 });
		}

		const { error } = await supabase.from("presupuestos").delete().eq("id", id);

		if (error) throw error;
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to delete presupuesto" },
			{ status: 500 }
		);
	}
}

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const body = await request.json();

		// Convert and validate fields
		const obra_id = Number(body.obra_id);
		const medicion_id = Number(body.medicion_id);
		const periodo = new Date(body.periodo).toISOString();
		const { data } = body;

		// Validate required fields and types
		if (!obra_id || isNaN(obra_id)) {
			return NextResponse.json(
				{ error: "obra_id debe ser un número válido" },
				{ status: 400 }
			);
		}

		if (!medicion_id || isNaN(medicion_id)) {
			return NextResponse.json(
				{ error: "medicion_id debe ser un número válido" },
				{ status: 400 }
			);
		}

		if (!periodo || isNaN(Date.parse(periodo))) {
			return NextResponse.json(
				{ error: "periodo debe ser una fecha válida" },
				{ status: 400 }
			);
		}

		if (!data || typeof data !== "object") {
			return NextResponse.json(
				{ error: "data debe ser un objeto válido" },
				{ status: 400 }
			);
		}

		console.log("aca", { obra_id, medicion_id, periodo, data });

		// Create certificado
		const { data: certificado, error: certificadoError } = await supabase
			.from("certificados")
			.insert({
				obra_id,
				medicion_id,
				periodo,
				data,
				created_at: new Date().toISOString(),
			})
			.select()
			.single();

		if (certificadoError) {
			console.error("Error creating certificado:", certificadoError);
			return NextResponse.json(
				{ error: "Error al crear el certificado" },
				{ status: 500 }
			);
		}

		return NextResponse.json(certificado);
	} catch (error) {
		console.log(error);
		console.error("Error in certificados POST:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

export async function GET(request: Request) {
	try {
		const supabase = await createClient();
		const { searchParams } = new URL(request.url);
		const obraId = Number(searchParams.get("obraId"));

		console.log("aca", { obraId });
		console.log("aca", typeof obraId);

		if (!obraId || isNaN(obraId)) {
			return NextResponse.json(
				{ error: "Se requiere un ID de obra válido" },
				{ status: 400 }
			);
		}

		const { data: certificados, error } = await supabase
			.from("certificados")
			.select("*")
			.eq("obra_id", obraId)
			.order("created_at", { ascending: false });

		console.log("aca", { certificados });

		if (error) {
			console.error("Error fetching certificados:", error);
			return NextResponse.json(
				{ error: "Error al obtener los certificados" },
				{ status: 500 }
			);
		}

		return NextResponse.json(certificados);
	} catch (error) {
		console.error("Error in certificados GET:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}

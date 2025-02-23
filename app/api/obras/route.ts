import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const supabase = await createClient();

		// Get all obras
		const { data: obras, error } = await supabase
			.from("obras")
			.select("*")
			.order("id", { ascending: false });

		if (error) throw error;
		return NextResponse.json(obras);
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch obras" },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const data = await request.json();

		const { data: obra, error } = await supabase
			.from("obras")
			.insert([
				{
					"3p": data["3p"],
					ainaugurar: data.ainaugurar,
					area: data.area,
					avance: data.avance,
					basico: data.basico,
					clasificacion: data.clasificacion,
					codigoSIG: data.codigoSIG,
					departamento: data.departamento,
					empresaAdjudicada: data.empresaAdjudicada,
					empresaPoliza: data.empresaPoliza,
					expte: data.expte,
					expte2: data.expte2,
					fechaAdjudicacion: data.fechaAdjudicacion,
					fechaAdjudicacion_1: data.fechaAdjudicacion_1,
					fechaContrato: data.fechaContrato,
					fechaFin: data.fechaFin,
					fechaInauguracion: data.fechaInauguracion,
					fechaInicio: data.fechaInicio,
					fechaLicitacion: data.fechaLicitacion,
					fechaNormaLegal: data.fechaNormaLegal,
					nombre: data.nombre,
					idEdificio: data.idEdificio,
					inaugurada: data.inaugurada,
					inspectores: data.inspectores,
					localidad: data.localidad,
					memoriaDesc: data.memoriaDesc,
					modalidad: data.modalidad,
					montoContrato: data.montoContrato,
					montoPoliza: data.montoPoliza,
					noInaugurado: data.noInaugurado,
					normaLegalAdjudicacion: data.normaLegalAdjudicacion,
					normaLegalLicitacion: data.normaLegalLicitacion,
					numeroLicitacion: data.numeroLicitacion,
					numeroPoliza: data.numeroPoliza,
					observaciones: data.observaciones,
					plazo: data.plazo,
					presupuestoOficial: data.presupuestoOficial,
					prioridad: data.prioridad,
					proyectista: data.proyectista,
				},
			])
			.select()
			.single();

		if (error) throw error;
		return NextResponse.json(obra);
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to create obra" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const supabase = await createClient();
		const { id, ...data } = await request.json();

		const { data: obra, error } = await supabase
			.from("obras")
			.update(data)
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;
		return NextResponse.json(obra);
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to update obra" },
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

		const { error } = await supabase.from("obras").delete().eq("id", id);

		if (error) throw error;
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to delete obra" },
			{ status: 500 }
		);
	}
}

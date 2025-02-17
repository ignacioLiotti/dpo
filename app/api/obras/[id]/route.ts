import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = await params;

		const supabase = await createClient();

		console.log("id", id);

		if (id) {
			const { data: obra, error } = await supabase
				.from("obras")
				.select("*")
				.eq("id", id)
				.single();

			if (error) {
				console.error("Error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch obra" },
					{ status: 500 }
				);
			}
			return NextResponse.json(obra);
		}

		// Get all obras
		const { data: obras, error } = await supabase
			.from("obras")
			.select("*")
			.order("created_at", { ascending: false });

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
					nombre: data.nombre,
					ubicacion: data.ubicacion,
					descripcion: data.descripcion,
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

export async function DELETE(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = await createClient();
		const { id } = await params;

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

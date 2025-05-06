"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type {
	Obra,
	Presupuesto,
	PresupuestoSection,
	PresupuestoItem,
} from "@/utils/types/presupuesto";

interface PresupuestoItemInput {
	name: string;
	unit?: string;
	quantity: number;
	unit_price: number;
}

interface PresupuestoSectionInput {
	name: string;
	items: PresupuestoItemInput[];
}

// Obras
export async function createObra({
	nombre,
	localidad,
}: Pick<Obra, "nombre" | "localidad">) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("Not authenticated");

	const { error } = await supabase
		.from("obras")
		.insert({ nombre, localidad, user_id: user.id });

	if (error) throw error;

	revalidatePath("/customObras");
	redirect("/customObras");
}

export async function getObra(id: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("obras")
		.select("*")
		.eq("id", id)
		.single();

	if (error) throw error;
	return data as Obra;
}

// Presupuestos
export async function createPresupuesto({
	obra_id,
	name,
	sections,
}: {
	obra_id: string;
	name: string;
	sections: PresupuestoSectionInput[];
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) throw new Error("Not authenticated");

	// Start a transaction by creating the presupuesto first
	const { data: presupuesto, error: presupuestoError } = await supabase
		.from("presupuestos")
		.insert({ obra_id, name, user_id: user.id })
		.select()
		.single();

	if (presupuestoError) throw presupuestoError;

	// Then create all sections with their items
	for (let i = 0; i < sections.length; i++) {
		const section = sections[i];
		const { data: presupuestoSection, error: sectionError } = await supabase
			.from("presupuesto_sections")
			.insert({
				presupuesto_id: presupuesto.id,
				user_id: user.id,
				name: section.name,
				order_index: i,
			})
			.select()
			.single();

		if (sectionError) throw sectionError;

		// Create items for this section
		const items = section.items.map(
			(item: PresupuestoItemInput, itemIndex: number) => ({
				...item,
				section_id: presupuestoSection.id,
				user_id: user.id,
				order_index: itemIndex,
			})
		);

		const { error: itemsError } = await supabase
			.from("presupuesto_items")
			.insert(items);

		if (itemsError) throw itemsError;
	}

	revalidatePath(`/customObras/${obra_id}`);
	redirect(`/customObras/${obra_id}`);
}

export async function getPresupuestos(obra_id: string) {
	const supabase = await createClient();

	// First get all presupuestos
	const { data: presupuestos, error: presupuestosError } = await supabase
		.from("presupuestos")
		.select("*")
		.eq("obra_id", obra_id)
		.order("created_at", { ascending: false });

	if (presupuestosError) throw presupuestosError;

	// Then for each presupuesto, get its sections and items
	const presupuestosWithDetails = await Promise.all(
		presupuestos.map(async (presupuesto) => {
			const { data: sections, error: sectionsError } = await supabase
				.from("presupuesto_sections")
				.select(
					`
          *,
          items:presupuesto_items(*)
        `
				)
				.eq("presupuesto_id", presupuesto.id)
				.order("order_index", { ascending: true });

			if (sectionsError) throw sectionsError;

			return {
				...presupuesto,
				sections: sections || [],
			};
		})
	);

	return presupuestosWithDetails;
}

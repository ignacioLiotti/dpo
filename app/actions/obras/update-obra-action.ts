"use server";

import {
	UpdateObraFormValues,
	updateObraSchema,
} from "@/lib/schemas/obra-schemas";
import { ActionResponseType } from "@/types/obra";
import { revalidatePath } from "next/cache";
import { supabase } from "@/supabase/client";

async function updateObraInDb(values: UpdateObraFormValues) {
	try {
		const { data, error } = await supabase
			.from("obras")
			.update({
				obra_name: values.obra_name,
				provincia: values.provincia,
				departamento: values.departamento,
				calle: values.calle,
				ubicacion_google_maps: values.ubicacion_google_maps,
				presupuesto: values.presupuesto,
				user_id: values.user_id,
			})
			.eq("id", values.id)
			.select()
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error("Error updating obra:", error);
		return null;
	}
}

export async function updateObraAction(
	formData: FormData
): Promise<ActionResponseType<any>> {
	try {
		// Parse and validate the input
		const parsed = updateObraSchema.parse({
			id: formData.get("id"),
			obra_name: formData.get("obra_name"),
			provincia: formData.get("provincia"),
			departamento: formData.get("departamento"),
			calle: formData.get("calle"),
			ubicacion_google_maps: formData.get("ubicacion_google_maps"),
			presupuesto: Number(formData.get("presupuesto")),
			user_id: formData.get("user_id"),
		});

		console.log("Parsed input:", parsed);

		// Update the obra in the database
		const obra = await updateObraInDb(parsed);
		if (!obra) {
			return {
				success: false,
				error: {
					code: "UPDATE_FAILED",
					message: "Error al actualizar la obra",
				},
			};
		}

		// Revalidate the obras page
		revalidatePath("/obras");

		return {
			success: true,
			data: obra,
		};
	} catch (error) {
		console.error("Error in updateObraAction:", error);
		return {
			success: false,
			error: {
				code: "UNKNOWN_ERROR",
				message: error instanceof Error ? error.message : "Error desconocido",
			},
		};
	}
}

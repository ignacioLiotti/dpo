"use server";

import { z } from "zod";
import { createSafeActionClient } from "next-safe-action";
import { obraBaseSchema } from "@/supabase/schemas/obras-schemas";
import type { Obra, ActionResponseType } from "@/supabase/types/obras-types";
import { revalidatePath } from "next/cache";
import { createClient } from "@/supabase/server";
const action = createSafeActionClient();

// Mock database create function
async function mockCreateObraInDb(
	values: z.infer<typeof obraBaseSchema>
): Promise<Obra> {
	console.log("Creating obra in DB (mock):", values);
	await new Promise((resolve) => setTimeout(resolve, 500));

	const newObra: Obra = {
		id: crypto.randomUUID(),
		...values,
		descripcion: values.descripcion || null,
		fechaInicio: values.fechaInicio || null,
		fechaFin: values.fechaFin || null,
		presupuestoOficial: values.presupuestoOficial || 0,
		fechaBasico: values.fechaBasico || null,
		expediente: values.expediente || null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	return newObra;
}

async function createObraInDb(
	values: z.infer<typeof obraBaseSchema>
): Promise<Obra> {
	const supabase = await createClient();
	console.log("supabase", supabase);
	const { data, error } = await supabase
		.from("obras")
		.insert(values)
		.select()
		.single();
	if (error) {
		console.error("Error in createObraInDb:", error);
		throw new Error(error.message);
	}
	return data;
}

export const createObraAction = action
	.schema(obraBaseSchema)
	.action(async ({ parsedInput }): Promise<ActionResponseType<Obra>> => {
		try {
			console.log("Server Action: createObraAction called with:", parsedInput);

			const newObra = await createObraInDb(parsedInput);

			// revalidatePath("/obras");

			return { success: true, data: newObra };
		} catch (error) {
			console.error("Error in createObraAction:", error);
			if (error instanceof Error) {
				return {
					success: false,
					error: { code: "CREATE_FAILED", message: error.message },
				};
			}
			return {
				success: false,
				error: { code: "UNKNOWN_ERROR", message: "An unknown error occurred" },
			};
		}
	});

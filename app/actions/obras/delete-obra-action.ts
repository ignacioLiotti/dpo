import { ActionResponseType } from "@/types/obra";
import { revalidatePath } from "next/cache";
import { supabase } from "@/supabase/client";

async function deleteObraFromDb(id: string) {
	try {
		const { error } = await supabase.from("obras").delete().eq("id", id);

		if (error) throw error;
		return true;
	} catch (error) {
		console.error("Error deleting obra:", error);
		return false;
	}
}

export async function deleteObraAction(
	id: string
): Promise<ActionResponseType<boolean>> {
	try {
		// Delete the obra from the database
		const success = await deleteObraFromDb(id);
		if (!success) {
			return {
				success: false,
				error: {
					code: "DELETE_FAILED",
					message: "Error al eliminar la obra",
				},
			};
		}

		// Revalidate the obras page
		revalidatePath("/obras");

		return {
			success: true,
			data: true,
		};
	} catch (error) {
		console.error("Error in deleteObraAction:", error);
		return {
			success: false,
			error: {
				code: "UNKNOWN_ERROR",
				message: error instanceof Error ? error.message : "Error desconocido",
			},
		};
	}
}

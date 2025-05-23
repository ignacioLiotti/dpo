// get obra action from supabase

import { supabase } from "@/supabase/client";
import { Database } from "@/types/supabase";

type Obra = Database["public"]["Tables"]["obras"]["Row"];

export async function getObraActionByID(id: string): Promise<Obra | null> {
	try {
		const { data, error } = await supabase
			.from("obras")
			.select("*")
			.eq("id", id)
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error("Error fetching obra:", error);
		return null;
	}
}

export async function getAllObrasAction(): Promise<Obra[] | null> {
	try {
		const { data, error } = await supabase
			.from("obras")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	} catch (error) {
		console.error("Error fetching obras:", error);
		return null;
	}
}

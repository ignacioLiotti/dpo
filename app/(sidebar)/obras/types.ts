import { z } from "zod";
// Assuming obraEstadoEnum will be available from this path after schema an obra file is created/updated
// If lib/schemas/obra-schemas.ts is not created yet, this might cause a temporary issue.
import { obraEstadoEnum } from "./schema";
import type { Database } from "@/supabase.types";

export type Obra = Database["public"]["Tables"]["obras"]["Row"];
export type ObraInsert = Database["public"]["Tables"]["obras"]["Insert"];
export type ObraUpdate = Database["public"]["Tables"]["obras"]["Update"];

export type Adicional = Database["public"]["Tables"]["adicionales"]["Row"];
export type AdicionalInsert =
	Database["public"]["Tables"]["adicionales"]["Insert"];
export type AdicionalUpdate =
	Database["public"]["Tables"]["adicionales"]["Update"];

export type AmpliacionPlazo =
	Database["public"]["Tables"]["ampliaciones_plazo"]["Row"];
export type AmpliacionPlazoInsert =
	Database["public"]["Tables"]["ampliaciones_plazo"]["Insert"];
export type AmpliacionPlazoUpdate =
	Database["public"]["Tables"]["ampliaciones_plazo"]["Update"];

export type Redeterminacion =
	Database["public"]["Tables"]["redeterminaciones"]["Row"];
export type RedeterminacionInsert =
	Database["public"]["Tables"]["redeterminaciones"]["Insert"];
export type RedeterminacionUpdate =
	Database["public"]["Tables"]["redeterminaciones"]["Update"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// Enum types
export type ObraEstado = Database["public"]["Enums"]["obra_estado"];
export type AdicionalEstado = Database["public"]["Enums"]["adicional_estado"];
export type AmpliacionPlazoEstado =
	Database["public"]["Enums"]["ampliacion_plazo_estado"];
export type RedeterminacionEstado =
	Database["public"]["Enums"]["redeterminacion_estado"];

// We'll need types for related entities too, examples:
export type Reparticion = {
	id: string;
	nombre: string;
};

export type Area = {
	id: string;
	nombre: string;
};

export type TipoObra = {
	id: string;
	nombre: string;
};

// Define other related types (Redeterminacion, Adicional, AmpliacionPlazo) here later

// Standardized Action Response Type
export interface ActionResponseType<T> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		issues?: z.ZodIssue[]; // For Zod validation issues
	} | null;
}

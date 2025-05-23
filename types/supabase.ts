export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	public: {
		Tables: {
			adicionales: {
				Row: {
					created_at: string;
					descripcion: string;
					estado: Database["public"]["Enums"]["adicional_estado"];
					fecha_aprobacion: string | null;
					fecha_solicitud: string;
					id: string;
					monto_aprobado: number | null;
					monto_solicitado: number;
					numero: number;
					obra_id: string;
					observaciones: string | null;
					updated_at: string;
					user_id: string | null;
				};
				Insert: {
					created_at?: string;
					descripcion: string;
					estado?: Database["public"]["Enums"]["adicional_estado"];
					fecha_aprobacion?: string | null;
					fecha_solicitud?: string;
					id?: string;
					monto_aprobado?: number | null;
					monto_solicitado: number;
					numero: number;
					obra_id: string;
					observaciones?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Update: {
					created_at?: string;
					descripcion?: string;
					estado?: Database["public"]["Enums"]["adicional_estado"];
					fecha_aprobacion?: string | null;
					fecha_solicitud?: string;
					id?: string;
					monto_aprobado?: number | null;
					monto_solicitado?: number;
					numero?: number;
					obra_id?: string;
					observaciones?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "adicionales_obra_id_fkey";
						columns: ["obra_id"];
						isOneToOne: false;
						referencedRelation: "obras";
						referencedColumns: ["id"];
					},
				];
			};
			ampliaciones_plazo: {
				Row: {
					created_at: string;
					dias_aprobados: number | null;
					dias_solicitados: number;
					estado: Database["public"]["Enums"]["ampliacion_plazo_estado"];
					fecha_aprobacion: string | null;
					fecha_solicitud: string;
					id: string;
					motivo: string;
					numero: number;
					obra_id: string;
					observaciones: string | null;
					updated_at: string;
					user_id: string | null;
				};
				Insert: {
					created_at?: string;
					dias_aprobados?: number | null;
					dias_solicitados: number;
					estado?: Database["public"]["Enums"]["ampliacion_plazo_estado"];
					fecha_aprobacion?: string | null;
					fecha_solicitud?: string;
					id?: string;
					motivo: string;
					numero: number;
					obra_id: string;
					observaciones?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Update: {
					created_at?: string;
					dias_aprobados?: number | null;
					dias_solicitados?: number;
					estado?: Database["public"]["Enums"]["ampliacion_plazo_estado"];
					fecha_aprobacion?: string | null;
					fecha_solicitud?: string;
					id?: string;
					motivo?: string;
					numero?: number;
					obra_id?: string;
					observaciones?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "ampliaciones_plazo_obra_id_fkey";
						columns: ["obra_id"];
						isOneToOne: false;
						referencedRelation: "obras";
						referencedColumns: ["id"];
					},
				];
			};
			obras: {
				Row: {
					calle: string;
					created_at: string;
					departamento: string;
					id: string;
					obra_name: string;
					presupuesto: number;
					provincia: string;
					ubicacion_google_maps: string | null;
					user_id: string | null;
				};
				Insert: {
					calle: string;
					created_at?: string;
					departamento: string;
					id?: string;
					obra_name: string;
					presupuesto: number;
					provincia: string;
					ubicacion_google_maps?: string | null;
					user_id?: string | null;
				};
				Update: {
					calle?: string;
					created_at?: string;
					departamento?: string;
					id?: string;
					obra_name?: string;
					presupuesto?: number;
					provincia?: string;
					ubicacion_google_maps?: string | null;
					user_id?: string | null;
				};
				Relationships: [];
			};
			profiles: {
				Row: {
					avatar_url: string | null;
					created_at: string;
					full_name: string | null;
					id: string;
					role: string;
					updated_at: string;
					username: string | null;
				};
				Insert: {
					avatar_url?: string | null;
					created_at?: string;
					full_name?: string | null;
					id: string;
					role?: string;
					updated_at?: string;
					username?: string | null;
				};
				Update: {
					avatar_url?: string | null;
					created_at?: string;
					full_name?: string | null;
					id?: string;
					role?: string;
					updated_at?: string;
					username?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "profiles_role_fkey";
						columns: ["role"];
						isOneToOne: false;
						referencedRelation: "role_hierarchy";
						referencedColumns: ["role"];
					},
				];
			};
			redeterminaciones: {
				Row: {
					created_at: string;
					estado: Database["public"]["Enums"]["redeterminacion_estado"];
					fecha_aprobacion: string | null;
					fecha_solicitud: string;
					id: string;
					monto_aprobado: number | null;
					monto_solicitado: number;
					numero: number;
					obra_id: string;
					observaciones: string | null;
					updated_at: string;
					user_id: string | null;
				};
				Insert: {
					created_at?: string;
					estado?: Database["public"]["Enums"]["redeterminacion_estado"];
					fecha_aprobacion?: string | null;
					fecha_solicitud?: string;
					id?: string;
					monto_aprobado?: number | null;
					monto_solicitado: number;
					numero: number;
					obra_id: string;
					observaciones?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Update: {
					created_at?: string;
					estado?: Database["public"]["Enums"]["redeterminacion_estado"];
					fecha_aprobacion?: string | null;
					fecha_solicitud?: string;
					id?: string;
					monto_aprobado?: number | null;
					monto_solicitado?: number;
					numero?: number;
					obra_id?: string;
					observaciones?: string | null;
					updated_at?: string;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "redeterminaciones_obra_id_fkey";
						columns: ["obra_id"];
						isOneToOne: false;
						referencedRelation: "obras";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			has_role: {
				Args: {
					required_role: string;
				};
				Returns: boolean;
			};
		};
		Enums: {
			adicional_estado: "SOLICITADO" | "EN_REVISION" | "APROBADO" | "RECHAZADO";
			ampliacion_plazo_estado:
				| "SOLICITADA"
				| "EN_REVISION"
				| "APROBADA"
				| "RECHAZADA";
			obra_estado:
				| "PLANIFICADA"
				| "EN_EJECUCION"
				| "FINALIZADA"
				| "SUSPENDIDA"
				| "CANCELADA";
			redeterminacion_estado:
				| "SOLICITADA"
				| "EN_REVISION"
				| "APROBADA"
				| "RECHAZADA";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

// Helper types for table rows
export type Tables<T extends keyof Database["public"]["Tables"]> =
	Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
	Database["public"]["Enums"][T];

// Specific table types
export type Obra = Tables<"obras">;
export type Adicional = Tables<"adicionales">;
export type AmpliacionPlazo = Tables<"ampliaciones_plazo">;
export type Redeterminacion = Tables<"redeterminaciones">;
export type Profile = Tables<"profiles">;

// Enum types
export type ObraEstado = Enums<"obra_estado">;
export type AdicionalEstado = Enums<"adicional_estado">;
export type AmpliacionPlazoEstado = Enums<"ampliacion_plazo_estado">;
export type RedeterminacionEstado = Enums<"redeterminacion_estado">;

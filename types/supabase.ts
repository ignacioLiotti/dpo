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
			profiles: {
				Row: {
					id: string;
					username: string | null;
					full_name: string | null;
					avatar_url: string | null;
					role: string;
					website: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					username?: string | null;
					full_name?: string | null;
					avatar_url?: string | null;
					role?: string;
					website?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					username?: string | null;
					full_name?: string | null;
					avatar_url?: string | null;
					role?: string;
					website?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			// Add other tables here as needed
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
			[_ in never]: never;
		};
	};
};

// Helper types for front-end use
export type UserRole = "user" | "super_user" | "admin";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

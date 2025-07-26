import type { Database } from "@/supabase.types";

// Organization types - Only the ones actually used
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationInsert = Database["public"]["Tables"]["organizations"]["Insert"];
export type OrganizationUpdate = Database["public"]["Tables"]["organizations"]["Update"];

// Extended type with relations
export interface MembershipWithOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization: Organization;
}
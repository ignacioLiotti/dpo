import type { Database } from "../supabase.types";

// Organization types
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationInsert = Database["public"]["Tables"]["organizations"]["Insert"];
export type OrganizationUpdate = Database["public"]["Tables"]["organizations"]["Update"];

// Organization membership types
export type OrganizationMembership = Database["public"]["Tables"]["organization_memberships"]["Row"];
export type OrganizationMembershipInsert = Database["public"]["Tables"]["organization_memberships"]["Insert"];
export type OrganizationMembershipUpdate = Database["public"]["Tables"]["organization_memberships"]["Update"];

// Organization invitation types
export type OrganizationInvitation = Database["public"]["Tables"]["organization_invitations"]["Row"];
export type OrganizationInvitationInsert = Database["public"]["Tables"]["organization_invitations"]["Insert"];
export type OrganizationInvitationUpdate = Database["public"]["Tables"]["organization_invitations"]["Update"];

// Organization role types
export type OrganizationRole = "owner" | "admin" | "member" | "viewer";

// Extended types with relations
export interface OrganizationWithMemberships extends Organization {
  memberships: (OrganizationMembership & {
    user: {
      id: string;
      email: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  })[];
  memberCount: number;
}

export interface MembershipWithOrganization extends OrganizationMembership {
  organization: Organization;
}

export interface InvitationWithOrganization extends OrganizationInvitation {
  organization: Organization;
  invitedBy: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

// Organization settings type
export interface OrganizationSettings {
  defaultRole?: OrganizationRole;
  allowPublicInvites?: boolean;
  requireEmailVerification?: boolean;
  maxMembers?: number;
  features?: {
    obras?: boolean;
    documents?: boolean;
    analytics?: boolean;
  };
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
}

// Organization context types
export interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  memberships: MembershipWithOrganization[];
  user: any | null;
  isLoading: boolean;
  error: string | null;
  switchOrganization: (organizationId: string) => Promise<void>;
  createOrganization: (data: OrganizationInsert) => Promise<Organization>;
  updateOrganization: (id: string, data: OrganizationUpdate) => Promise<Organization>;
  inviteUser: (email: string, role: OrganizationRole) => Promise<void>;
  acceptInvitation: (token: string) => Promise<void>;
  leaveOrganization: (organizationId: string) => Promise<void>;
  removeMember: (membershipId: string) => Promise<void>;
  updateMemberRole: (membershipId: string, role: OrganizationRole) => Promise<void>;
  refresh: () => Promise<void>;
}

// Form types
export interface CreateOrganizationFormData {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export interface InviteUserFormData {
  email: string;
  role: OrganizationRole;
  message?: string;
}

// API response types
export interface CreateOrganizationResponse {
  success: boolean;
  data?: Organization;
  error?: string;
}

export interface InviteUserResponse {
  success: boolean;
  data?: OrganizationInvitation;
  error?: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  data?: {
    organization_id: string;
    role: OrganizationRole;
  };
  error?: string;
}

// Utility types
export type OrganizationPermission = 
  | "view_organization"
  | "edit_organization" 
  | "delete_organization"
  | "manage_members"
  | "invite_members"
  | "remove_members"
  | "manage_roles"
  | "view_members"
  | "create_obras"
  | "edit_obras"
  | "delete_obras"
  | "view_obras"
  | "create_documents"
  | "edit_documents"
  | "delete_documents"
  | "view_documents";

export interface RolePermissions {
  owner: OrganizationPermission[];
  admin: OrganizationPermission[];
  member: OrganizationPermission[];
  viewer: OrganizationPermission[];
}

// Organization statistics
export interface OrganizationStats {
  memberCount: number;
  obraCount: number;
  documentCount: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
}

// Multi-tenancy helper types
export interface TenantContext {
  organizationId: string;
  organizationSlug: string;
  role: OrganizationRole;
  permissions: OrganizationPermission[];
}

// Validation schemas (for use with Zod)
export interface OrganizationValidation {
  name: {
    min: number;
    max: number;
    pattern?: RegExp;
  };
  slug: {
    min: number;
    max: number;
    pattern: RegExp;
  };
  description: {
    max: number;
  };
}
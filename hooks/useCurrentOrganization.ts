import { useOrganization } from "@/contexts/organization-context";

/**
 * Hook to get the current organization ID for use in server actions
 * Returns null if no organization is selected
 */
export function useCurrentOrganization() {
  const { currentOrganization, user, isLoading } = useOrganization();

  return {
    organizationId: currentOrganization?.id || null,
    organization: currentOrganization,
    user,
    isLoading,
    hasOrganization: !!currentOrganization,
  };
}
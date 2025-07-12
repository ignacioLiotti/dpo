"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Building2 } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/layout/sidebar/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useOrganization } from "@/contexts/organization-context"
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const {
    currentOrganization,
    organizations,
    memberships,
    isLoading,
    switchOrganization
  } = useOrganization()

  const handleSelect = async (organizationId: string) => {
    if (organizationId === currentOrganization?.id) return;

    try {
      await switchOrganization(organizationId);
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  };

  const getCurrentMembership = () => {
    if (!currentOrganization) return null;
    return memberships.find(m => m.organization_id === currentOrganization.id);
  };

  const getMembershipRole = (orgId: string) => {
    const membership = memberships.find(m => m.organization_id === orgId);
    return membership?.role || 'member';
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="animate-pulse">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-3 w-16 bg-muted rounded mt-1" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!currentOrganization && organizations.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <CreateOrganizationDialog
            trigger={
              <SidebarMenuButton size="lg" asChild>
                <div>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Plus className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Create Organization</span>
                    <span className="truncate text-xs text-muted-foreground">Get started</span>
                  </div>
                </div>
              </SidebarMenuButton>
            }
          />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const currentMembership = getCurrentMembership();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {currentOrganization ? (
                <>
                  <Avatar className="size-8">
                    <AvatarImage
                      src={currentOrganization.logo_url || undefined}
                      alt={currentOrganization.name}
                    />
                    <AvatarFallback className="bg-[#ff5800] text-primary-foreground outline outline-2 outline-outline border-2">
                      {currentOrganization.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {currentOrganization.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {currentMembership?.role || 'member'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">No Organization</span>
                    <span className="truncate text-xs text-muted-foreground">Select one</span>
                  </div>
                </>
              )}
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((org, index) => {
              const role = getMembershipRole(org.id);
              return (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSelect(org.id)}
                  className="gap-2 p-2"
                >
                  <Avatar className="size-6">
                    <AvatarImage
                      src={org.logo_url || undefined}
                      alt={org.name}
                    />
                    <AvatarFallback className="text-xs">
                      {org.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{org.name}</div>
                    <Badge
                      variant={getRoleBadgeVariant(role)}
                      className="text-xs px-1 py-0 h-4 mt-1"
                    >
                      {role}
                    </Badge>
                  </div>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <CreateOrganizationDialog
              trigger={
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Create Organization</div>
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

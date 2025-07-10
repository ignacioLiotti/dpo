'use client';

import React from 'react';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import { cn } from '@/utils/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOrganization } from '@/contexts/organization-context';
import { Badge } from '@/components/ui/badge';

interface OrganizationSwitcherProps {
  className?: string;
}

export function OrganizationSwitcher({ className }: OrganizationSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const { 
    currentOrganization, 
    organizations, 
    memberships,
    isLoading, 
    switchOrganization 
  } = useOrganization();

  const handleSelect = async (organizationId: string) => {
    if (organizationId === currentOrganization?.id) return;
    
    try {
      await switchOrganization(organizationId);
      setOpen(false);
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
      <div className={cn("flex items-center gap-2", className)}>
        <div className="h-8 w-8 rounded bg-muted animate-pulse" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!currentOrganization && organizations.length === 0) {
    return (
      <Button
        variant="outline"
        className={cn("justify-start gap-2", className)}
        onClick={() => {/* TODO: Open create organization dialog */}}
      >
        <Plus className="h-4 w-4" />
        Create Organization
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select organization"
          className={cn("justify-between min-w-[200px]", className)}
        >
          {currentOrganization ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="h-5 w-5">
                <AvatarImage 
                  src={currentOrganization.logo_url || undefined} 
                  alt={currentOrganization.name}
                />
                <AvatarFallback className="text-xs">
                  {currentOrganization.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-medium">
                {currentOrganization.name}
              </span>
              <Badge 
                variant={getRoleBadgeVariant(getCurrentMembership()?.role || 'member')}
                className="text-xs px-1 py-0 h-4"
              >
                {getCurrentMembership()?.role}
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Select organization</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            <CommandGroup heading="Organizations">
              {organizations.map((org) => {
                const role = getMembershipRole(org.id);
                return (
                  <CommandItem
                    key={org.id}
                    onSelect={() => handleSelect(org.id)}
                    className="text-sm"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar className="h-5 w-5">
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
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          currentOrganization?.id === org.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  // TODO: Open create organization dialog
                }}
                className="text-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
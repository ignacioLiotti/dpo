'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Building } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOrganizationSwitcher } from '../hooks';
import { CreateOrganizationDialog } from './create-organization-dialog';

/**
 * Organization switcher component that consolidates all organization switching logic
 */
export function OrganizationSwitcher() {
  const {
    organizations,
    currentOrganization,
    switchOrganization,
    isLoading,
    getCurrentRole,
  } = useOrganizationSwitcher();

  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleOrganizationSelect = async (organizationId: string) => {
    if (organizationId === currentOrganization?.id) {
      setOpen(false);
      return;
    }

    try {
      await switchOrganization(organizationId);
      setOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'member':
        return 'outline';
      case 'viewer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select organization"
            className="w-full justify-between h-auto p-3"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={currentOrganization?.avatar_url || ''} 
                  alt={currentOrganization?.name || 'Organization'} 
                />
                <AvatarFallback>
                  {currentOrganization?.name?.charAt(0) || <Building className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start min-w-0">
                <span className="font-medium truncate">
                  {currentOrganization?.name || 'No organization'}
                </span>
                {currentOrganization && (
                  <Badge 
                    variant={getRoleBadgeVariant(getCurrentRole(currentOrganization.id))}
                    className="text-xs"
                  >
                    {getCurrentRole(currentOrganization.id)}
                  </Badge>
                )}
              </div>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" side="right" align="start">
          <Command>
            <CommandInput placeholder="Search organizations..." />
            <CommandList>
              <CommandEmpty>No organizations found.</CommandEmpty>
              {organizations.length > 0 && (
                <CommandGroup heading="Organizations">
                  {organizations.map((org) => {
                    const role = getCurrentRole(org.id);
                    return (
                      <CommandItem
                        key={org.id}
                        value={org.id}
                        onSelect={() => handleOrganizationSelect(org.id)}
                        className="flex items-center space-x-3 p-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={org.avatar_url || ''} 
                            alt={org.name} 
                          />
                          <AvatarFallback>
                            {org.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium truncate">{org.name}</span>
                            <Badge 
                              variant={getRoleBadgeVariant(role)}
                              className="text-xs"
                            >
                              {role}
                            </Badge>
                          </div>
                          {org.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {org.description}
                            </p>
                          )}
                        </div>
                        <Check
                          className={`ml-auto h-4 w-4 ${
                            currentOrganization?.id === org.id
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowCreateDialog(true);
                  }}
                  className="flex items-center space-x-3 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span>Create Organization</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
}
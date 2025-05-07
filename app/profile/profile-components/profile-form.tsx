'use client';

import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useAction } from 'next-safe-action/hooks';
import type { Profile } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { updateProfile } from '@/app/actions/profile';
import { createSafeActionClient } from "next-safe-action";

// Define the input type locally as well for the form
type ProfileUpdateInput = {
  username: string | null;
  full_name: string | null;
};

interface ProfileFormProps {
  profile: Profile | null;
}

export const action = createSafeActionClient();

export function ProfileForm({ profile }: ProfileFormProps) {

  // Define the form using TanStack Form
  const form = useForm({
    defaultValues: {
      username: profile?.username ?? '',
      full_name: profile?.full_name ?? '',
    },
    onSubmit: async ({ value }) => {
      // Execute the server action with the form values
      execute(value);
    },
  });

  // Hook to execute the server action
  const {
    execute,
    status,
    result,
    reset: resetAction, // Function to reset action state
  } = useAction(updateProfile, {
    onSuccess: (response) => {
      if (response.data?.success) {
        toast.success('Profile updated successfully!');
      } else if (response.data?.error) {
        toast.error(`Error (${response.data.error.code}): ${response.data.error.message}`);
      }
    },
    onError: (error) => {
      // Handle different types of errors
      if (error.validationErrors) {
        // Handle Zod validation errors
        const errorMessages = Object.values(error.validationErrors).join(', ');
        toast.error(`Validation Error: ${errorMessages}`);
      } else if (error.serverError) {
        toast.error(`Server Error: ${error.serverError}`);
      } else {
        toast.error('An unexpected error occurred');
      }
    },
  });

  const isLoading = status === 'executing';
  const serverError = result?.serverError;

  // Helper function to render a badge for the user role
  const getUserRoleBadge = (role: string | null | undefined) => {
    if (!role) return null;

    let colorClass = '';
    switch (role) {
      case 'admin':
        colorClass = 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
        break;
      case 'super_user':
        colorClass = 'bg-warning text-warning-foreground hover:bg-warning/80';
        break;
      default:
        colorClass = 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    }

    return (
      <Badge className={colorClass}>
        {role}
      </Badge>
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      {/* Username Field */}
      <form.Field
        name="username"
        validators={{
          onChange: ({ value }) =>
            !value || value.length >= 3
              ? undefined
              : 'Username must be at least 3 characters',
        }}
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Username</Label>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value ?? ''}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              disabled={isLoading}
              aria-invalid={field.state.meta.errors?.length > 0}
              aria-describedby={field.state.meta.errors?.length > 0 ? `${field.name}-error` : undefined}
            />
            {field.state.meta.errors?.length > 0 && (
              <div id={`${field.name}-error`} className="text-xs text-destructive pt-1">
                {field.state.meta.errors.join(', ')}
              </div>
            )}
          </div>
        )}
      />

      {/* Full Name Field */}
      <form.Field
        name="full_name"
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Full Name</Label>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value ?? ''}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              disabled={isLoading}
            />
            {/* No specific error display here, but could add if needed */}
          </div>
        )}
      />

      {/* Role Field (Read-only) */}
      <div className="space-y-2">
        <Label>User Role</Label>
        <div className="flex items-center h-10 px-3 rounded-md border border-input bg-background/50">
          {getUserRoleBadge(profile?.role)}
          <span className="ml-2 text-sm text-muted-foreground">
            {profile?.role === 'admin'
              ? 'Administrator with full access'
              : profile?.role === 'super_user'
                ? 'Super user with elevated privileges'
                : 'Standard user account'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          Your role determines what features you can access in the application.
          {profile?.role !== 'admin' && " Contact an administrator if you need elevated permissions."}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        {/* Display overall server error message */}
        {serverError && (
          <p className="text-sm text-destructive mr-auto">
            Error: {serverError}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            form.reset(); // Reset TanStack form state
            resetAction(); // Reset next-safe-action state (status, result)
          }}
          disabled={isLoading}
        >
          Reset
        </Button>
        {/* Disable submit if form is invalid OR if action is currently executing */}
        <Button type="submit" disabled={isLoading || !form.state.isValid}>
          {isLoading ? 'Updating...' : 'Update Profile'}
        </Button>
      </div>
    </form>
  );
} 
# Auth System Documentation

## Overview

The new consolidated auth system centralizes all authentication, user management, and organization functionality into a single `/app/auth` directory. This eliminates code duplication and provides a consistent API across the entire application.

## Architecture

```
/app/auth/
├── README.md              # This documentation
├── index.ts              # Main exports
├── utils.ts              # Client-side utilities
├── server-utils.ts       # Server-side utilities (separate to avoid Next.js conflicts)
├── context.tsx           # Unified auth context provider
├── hooks.ts              # Specialized auth hooks
├── actions.ts            # Server actions for auth operations
└── components/           # Auth-related UI components
    ├── auth-provider.tsx
    ├── role-guard.tsx
    ├── organization-switcher.tsx
    └── create-organization-dialog.tsx
```

## Core Concepts

### 1. Separation of Client and Server Code

- **`utils.ts`**: Client-side utilities that can be used in components
- **`server-utils.ts`**: Server-side utilities for API routes and server actions
- This separation prevents Next.js build errors from mixing client/server code

### 2. Unified Context

The `AuthContext` combines:
- User authentication state
- Organization management
- System-wide roles (admin, super_user, user)
- Organization-specific roles (owner, admin, member, viewer)
- Permissions checking
- Multi-tab synchronization

### 3. Multi-Tab Synchronization

The auth system uses BroadcastChannel API to sync state across browser tabs:
- Sign in/out events
- Organization switching
- User state changes

## How to Use

### Basic Setup

1. The auth system is already wrapped around your app in `/app/providers.tsx`:

```tsx
import { AuthProviderWrapper } from '@/app/auth/components';

export function Providers({ children }) {
  return (
    <QueryClientProvider>
      <ThemeProvider>
        <AuthProviderWrapper>
          {children}
        </AuthProviderWrapper>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

### Client-Side Usage

#### 1. Basic Authentication

```tsx
import { useAuth } from '@/app/auth';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;
  
  return <div>Welcome, {user.email}!</div>;
}
```

#### 2. User Roles (System-Wide)

```tsx
import { useUserRole } from '@/app/auth';

function AdminPanel() {
  const { role, isAdmin, isSuperUser } = useUserRole();
  
  if (!isAdmin()) {
    return <div>Access denied - admins only</div>;
  }
  
  return <div>Admin panel content</div>;
}
```

#### 3. Organization Management

```tsx
import { useOrganizations } from '@/app/auth';

function OrgManager() {
  const {
    currentOrganization,
    organizations,
    switchOrganization,
    createOrganization
  } = useOrganizations();
  
  const handleCreateOrg = async () => {
    try {
      await createOrganization({
        name: 'New Organization',
        description: 'A new org'
      });
    } catch (error) {
      console.error('Failed to create org:', error);
    }
  };
  
  return (
    <div>
      <h1>Current: {currentOrganization?.name}</h1>
      {organizations.map(org => (
        <button 
          key={org.id}
          onClick={() => switchOrganization(org.id)}
        >
          {org.name}
        </button>
      ))}
    </div>
  );
}
```

#### 4. Organization Permissions

```tsx
import { useOrganizationPermissions } from '@/app/auth';

function OrgSettings() {
  const { role, canManageSettings, isOwner } = useOrganizationPermissions();
  
  if (!canManageSettings()) {
    return <div>You don't have permission to manage settings</div>;
  }
  
  return (
    <div>
      <h1>Organization Settings</h1>
      {isOwner() && <button>Delete Organization</button>}
    </div>
  );
}
```

#### 5. Route Protection

```tsx
import { RoleGuard } from '@/app/auth/components';

function ProtectedPage() {
  return (
    <RoleGuard 
      requiredRole="admin"
      redirectTo="/unauthorized"
    >
      <div>Admin-only content</div>
    </RoleGuard>
  );
}

// Or with organization permissions
function OrgProtectedPage() {
  return (
    <RoleGuard 
      requiredOrganizationRole="owner"
      requiredPermission="manage_settings"
    >
      <div>Owner-only content</div>
    </RoleGuard>
  );
}
```

### Server-Side Usage

#### 1. API Routes

```tsx
import { createServerSupabaseClient, getUserOrganization } from '@/app/auth/server-utils';

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { user, organizationId } = await getUserOrganization(supabase);
    
    // Fetch organization-scoped data
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('organization_id', organizationId);
      
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }
}
```

#### 2. Server Actions

```tsx
'use server';

import { createServerSupabaseClient, getUserOrganization } from '@/app/auth/server-utils';

export async function createDocumentAction(data: any) {
  const supabase = await createServerSupabaseClient();
  
  try {
    const { user, organizationId } = await getUserOrganization(supabase);
    
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        ...data,
        organization_id: organizationId,
        created_by: user.id
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return { success: true, data: document };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## Available Hooks

### Core Hooks

1. **`useAuth()`** - Main auth hook with everything
2. **`useUser()`** - Just user info and auth state
3. **`useUserRole()`** - System-wide role management
4. **`useCurrentOrganization()`** - Current org info
5. **`useOrganizations()`** - Organization management
6. **`useOrganizationPermissions()`** - Org-level permissions
7. **`useOrganizationSwitcher()`** - For building org switcher UIs
8. **`useAuthLoading()`** - Loading and error states
9. **`useAuthActions()`** - Sign out and refresh actions
10. **`usePermissionGuard()`** - Complex permission checks
11. **`useRouteGuard()`** - Route protection logic

### Hook Examples

```tsx
// Simple user check
const { user, isAuthenticated } = useUser();

// Role checking
const { isAdmin, hasRole } = useUserRole();
if (hasRole('super_user')) { /* ... */ }

// Current organization
const { organization, organizationId } = useCurrentOrganization();

// Permission combinations
const { canAccess } = usePermissionGuard();
const hasAccess = canAccess({
  systemRole: 'super_user',
  organizationRole: 'admin',
  requireAll: true // Must have both
});
```

## Components

### OrganizationSwitcher

Pre-built organization switcher dropdown:

```tsx
import { OrganizationSwitcher } from '@/app/auth/components';

function Header() {
  return (
    <nav>
      <OrganizationSwitcher />
    </nav>
  );
}
```

### RoleGuard

Component for protecting UI elements:

```tsx
<RoleGuard requiredRole="admin">
  <AdminOnlyComponent />
</RoleGuard>
```

## Role Hierarchies

### System Roles
- `admin` (level 3) - Full system access
- `super_user` (level 2) - Extended features
- `user` (level 1) - Basic access

### Organization Roles
- `owner` - Can delete org, all permissions
- `admin` - Can manage members and settings
- `member` - Standard access
- `viewer` - Read-only access

## Multi-Tab Sync

The auth system automatically syncs across tabs:

1. **Sign In**: All tabs update with new user
2. **Sign Out**: All tabs redirect to login
3. **Organization Switch**: All tabs update to new org
4. **State Changes**: Broadcast via BroadcastChannel

## Migration from Old System

### Old Pattern → New Pattern

```tsx
// OLD: Multiple imports and contexts
import { useUser } from '@/hooks/useUser';
import { useUserRole } from '@/hooks/useUserRole';
import { useOrganization } from '@/contexts/organization-context';

// NEW: Single import
import { useAuth, useUserRole, useOrganizations } from '@/app/auth';
```

### Server-Side Changes

```tsx
// OLD: Duplicate getUserOrganization in every file
async function getUserOrganization(supabase: any) {
  // ... duplicate code
}

// NEW: Import from server-utils
import { getUserOrganization } from '@/app/auth/server-utils';
```

## Best Practices

1. **Use Specialized Hooks**: Instead of always using `useAuth()`, use specific hooks like `useUser()` or `useOrganizationPermissions()` for better performance

2. **Server vs Client**: Always use `server-utils` in API routes and server actions, and regular `utils` in client components

3. **Error Handling**: The auth system throws `AuthError` and `OrganizationError` for specific error types

4. **Loading States**: Always check `isLoading` before rendering auth-dependent content

5. **Permission Checks**: Use `RoleGuard` component for UI protection and permission hooks for logic

## Troubleshooting

### Common Issues

1. **"Cannot use next/headers in client component"**
   - Make sure you're importing from `/app/auth` not `/app/auth/server-utils` in client components

2. **"User not authenticated" in API routes**
   - Ensure you're using `getUserOrganization()` to get both user and org ID

3. **Multi-tab sync not working**
   - Check if browser supports BroadcastChannel API
   - Verify same origin for all tabs

4. **TypeScript errors with roles**
   - Import types from `/app/auth/utils`
   - Use proper null checks with permission functions
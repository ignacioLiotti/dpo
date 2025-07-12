'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertCircle, Check, Search, X } from 'lucide-react';

// Export the interface
export interface UserWithRole {
  id: string;
  email: string;  // We'll get this from auth.users
  username: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
}

export function UserRoleManager({ initialUsers }: { initialUsers: UserWithRole[] }) { // Add props type
  // Initialize state with the prop
  const [users, setUsers] = useState<UserWithRole[]>(initialUsers);
  // Remove loading state, as data is fetched server-side
  // const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const { isAdmin, isLoading: roleLoading } = useUserRole();

  // Keep client for updates
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Remove data fetching useEffect
  // useEffect(() => { /* ... removed fetchUsers logic ... */ }, [supabase, roleLoading, isAdmin]);

  // Update function remains largely the same, but updates local state managed by useState
  async function updateUserRole(userId: string, newRole: string) {
    setUpdatingUserId(userId);
    // ... (rest of the update function remains the same, updates local 'users' state)
    // Make sure the 'users' state update happens within this function on success
    try {
      // Using our Edge Function to update the role
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-user-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ userId, newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(`Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingUserId(null);
    }
  }


  // Filter users based on search and selected role (uses local 'users' state)
  const filteredUsers = users.filter(user => {
    // ... filtering logic remains the same ...
    // ... rest of the component ...
    const matchesSearch =
      search === '' ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(search.toLowerCase());

    const matchesRole = selectedRole === null || selectedRole === '-' || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });


  // Admin check remains
  if (!roleLoading && !isAdmin()) {
    // ... access denied card ...
    return (
      <Card className="w-full">
        <CardHeader className="bg-destructive text-destructive-foreground">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle size={18} />
            Access Denied
          </CardTitle>
          <CardDescription className="text-destructive-foreground/80">
            You do not have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <p>This page requires admin privileges.</p>
        </CardContent>
      </Card>
    );
  }

  // Remove the top-level loading state check around the table
  return (
    <Card className="w-full">
      {/* ... CardHeader, Search, Filter ... */}
      <CardHeader>
        <CardTitle>User Role Management</CardTitle>
        <CardDescription>
          Manage user roles and permissions across the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={selectedRole || '-'}
            onValueChange={(value) => setSelectedRole(value !== '-' ? value : null)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="super_user">Super User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Remove loading spinner here, data is passed via props */}
        <div className="rounded-md border">
          {/* Table rendering uses local 'filteredUsers' state */}
          {/* ... Table structure ... */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Change Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.username || user.email || 'No username'}</div>
                      <div className="text-sm text-muted-foreground">{user.full_name || ''}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${user.role === 'admin'
                          ? 'bg-destructive/10 text-destructive'
                          : user.role === 'super_user'
                            ? 'bg-warning/10 text-warning-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          disabled={updatingUserId === user.id}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                          defaultValue={user.role}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="super_user">Super User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>

                        {updatingUserId === user.id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 
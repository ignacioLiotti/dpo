import { UserRoleManager } from '@/app/(admin)/users/user-components/user-role-manager';
import { getUsersWithRolesAndEmails } from '@/app/actions/admin';
import type { UserWithRole } from '@/app/(admin)/users/user-components/user-role-manager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'User Management',
  description: 'Manage users and their roles across the application',
};

export default async function AdminUsersPage() {
  const result = await getUsersWithRolesAndEmails();

  let users: UserWithRole[] = [];
  let fetchError: string | null = null;

  if (!result) {
    fetchError = "Action failed to return a result.";
    console.error("Action returned undefined result.");
  } else {
    if (result.serverError) {
      fetchError = typeof result.serverError === 'string'
        ? result.serverError
        : 'An unknown server error occurred during fetch.';
      console.error("Server Error fetching users:", result.serverError);
    } else if (result.validationErrors) {
      fetchError = "Invalid request data.";
      console.error("Validation Error fetching users:", result.validationErrors);
    } else if (result.data) {
      if (result.data.success) {
        users = result.data.data ?? [];
      } else {
        fetchError = result.data.error?.message || 'Action reported failure while fetching users.';
        console.error("Action Error fetching users:", result.data.error);
      }
    } else {
      fetchError = "Received an unexpected response structure from the user fetch action.";
      console.error("Unexpected action result structure:", result);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      {fetchError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Users</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      <UserRoleManager initialUsers={users} />
    </div>
  );
} 
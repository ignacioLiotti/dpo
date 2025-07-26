import { OrganizationSetupForm } from './organization-setup-form';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient, getUserOrganization } from '@/app/auth/server-utils';

export default async function OrganizationSetupPage() {
  const supabase = await createServerSupabaseClient();
  const { user, organizationId } = await getUserOrganization(supabase);

  // If user already has an organization, redirect them
  if (organizationId) {
    redirect('/files');
  }

  // If not authenticated, redirect to sign in
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to DPO App! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Let's set up your organization to get started
          </p>
        </div>

        <div className="mt-8">
          <OrganizationSetupForm userEmail={user.email || ''} />
        </div>
      </div>
    </div>
  );
}
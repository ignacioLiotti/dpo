import { Suspense } from 'react';
import { AcceptInvitationForm } from './accept-invitation-form';

export default function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Accept Organization Invitation
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited to join an organization
          </p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <AcceptInvitationForm token={searchParams.token} />
        </Suspense>
      </div>
    </div>
  );
}
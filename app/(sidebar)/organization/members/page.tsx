import { Suspense } from 'react';
import { MembersManagement } from './components/members-management';
import { ErrorBoundary } from '@/components/error-boundary';

export default function OrganizationMembersPage() {
  return (
    <ErrorBoundary>
      <div className="container mx-auto py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Organization Members</h1>
          <p className="text-muted-foreground">
            Manage your organization's team members and send invitations
          </p>
        </div>
        
        <Suspense fallback={<MembersLoadingSkeleton />}>
          <MembersManagement />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

function MembersLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}
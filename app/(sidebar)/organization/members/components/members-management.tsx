'use client';

import { useState, useEffect } from 'react';
import { getOrganizationMembers, getOrganizationInvitations } from '@/app/actions/invitations';
import { InviteMemberDialog } from './invite-member-dialog';
import { MembersList } from './members-list';
import { InvitationsList } from './invitations-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export function MembersManagement() {
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const fetchData = async () => {
    try {
      const [membersResponse, invitationsResponse] = await Promise.all([
        getOrganizationMembers({}),
        getOrganizationInvitations({}),
      ]);

      if (membersResponse?.data) {
        setMembers(membersResponse.data);
      }
      
      if (invitationsResponse?.data) {
        setInvitations(invitationsResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch members data:', error);
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvitationSent = () => {
    setShowInviteDialog(false);
    fetchData(); // Refresh the lists
  };

  const handleInvitationCancelled = () => {
    fetchData(); // Refresh the lists
  };

  if (isLoading) {
    return <div>Loading members...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Team Management</h2>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="invitations">
            Pending Invitations ({invitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <MembersList members={members} onUpdate={fetchData} />
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <InvitationsList 
            invitations={invitations} 
            onCancelled={handleInvitationCancelled} 
          />
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onInvitationSent={handleInvitationSent}
      />
    </div>
  );
}
'use client';

import { useState } from 'react';
import { cancelOrganizationInvitation } from '@/app/actions/invitations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, X, Clock, User } from 'lucide-react';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  email: string;
  role: string;
  invited_by_name: string;
  invited_at: string;
  expires_at: string;
}

interface InvitationsListProps {
  invitations: Invitation[];
  onCancelled?: () => void;
}

export function InvitationsList({ invitations, onCancelled }: InvitationsListProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (invitationId: string) => {
    setCancellingId(invitationId);
    try {
      const result = await cancelOrganizationInvitation({ invitationId });
      
      if (result?.data) {
        toast.success('Invitation cancelled');
        onCancelled?.();
      }
    } catch (error: any) {
      console.error('Failed to cancel invitation:', error);
      toast.error(error?.message || 'Failed to cancel invitation');
    } finally {
      setCancellingId(null);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} remaining`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} remaining`;
    } else {
      return 'Expires soon';
    }
  };

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No pending invitations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <Card key={invitation.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-muted rounded-full">
                <Mail className="h-4 w-4" />
              </div>
              
              <div>
                <p className="font-medium">{invitation.email}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Invited by {invitation.invited_by_name}</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{getTimeRemaining(invitation.expires_at)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{invitation.role}</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCancel(invitation.id)}
                disabled={cancellingId === invitation.id}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
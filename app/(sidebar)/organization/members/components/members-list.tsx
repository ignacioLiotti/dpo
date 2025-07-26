'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Shield, User, Eye, UserX } from 'lucide-react';

interface Member {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  joined_at: string;
  avatar_url?: string;
}

interface MembersListProps {
  members: Member[];
  onUpdate?: () => void;
}

export function MembersList({ members, onUpdate }: MembersListProps) {
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return <Shield className="h-3 w-3 mr-1" />;
      case 'member':
        return <User className="h-3 w-3 mr-1" />;
      case 'viewer':
        return <Eye className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    // TODO: Implement role change functionality
    console.log('Change role for', userId, 'to', newRole);
    onUpdate?.();
  };

  const handleRemoveMember = async (userId: string) => {
    // TODO: Implement member removal functionality
    console.log('Remove member', userId);
    onUpdate?.();
  };

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No members yet. Start by inviting your team!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <Card key={member.user_id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={member.avatar_url} alt={member.full_name} />
                <AvatarFallback>
                  {member.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <p className="font-medium">{member.full_name}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(member.joined_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={getRoleBadgeVariant(member.role)}>
                {getRoleIcon(member.role)}
                {member.role}
              </Badge>
              
              {member.role !== 'owner' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleRoleChange(member.user_id, 'admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Make Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange(member.user_id, 'member')}>
                      <User className="mr-2 h-4 w-4" />
                      Make Member
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRoleChange(member.user_id, 'viewer')}>
                      <Eye className="mr-2 h-4 w-4" />
                      Make Viewer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-destructive"
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Remove from organization
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useUserRole } from '@/app/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  LogOut,
  User,
  Settings,
  ChevronDown,
  Shield,
  ShieldAlert,
  UserCog,
  Users,
  LogIn,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { signOutAction } from '@/app/auth/actions';
import { GradientAvatar } from '../ui/gradient-avatar';
import { cn } from '@/utils/utils';

interface UserProfileDropdownProps {
  handleSignOut?: () => void;
}

export function UserProfileDropdown({
  handleSignOut
}: UserProfileDropdownProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { role, isLoading: isRoleLoading, hasRole } = useUserRole();
  
  // Get user information from auth context
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || null;
  const userEmail = user?.email || null;
  const userAvatarUrl = user?.user_metadata?.avatar_url || null;
  

  // Show loading state while auth is loading
  if (isLoading || isRoleLoading) {
    return (
      <Button variant="input" className="flex items-center gap-2 px-2 rounded-full hover:bg-accent transition-colors border shadow">
        <div className="relative">
          <Avatar className="h-8 w-8 border-2 p-0.5">
            <AvatarFallback>L</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex text-left">
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </Button>
    );
  }

  // Early return for unauthenticated users
  if (!isAuthenticated || !user || !userEmail) {
    return (
      <Button variant="outline" onClick={() => router.push('/sign-in')}>
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Button>
    );
  }

  // --- Logic for Logged-In User ---
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);

  // Create Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!userName) return userEmail.charAt(0).toUpperCase(); // Fallback to email initial
    return userName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to update the user's own role
  const handleRoleChange = async (newRole: string) => {
    if (isUpdatingRole || newRole === role || !user) return;
    setIsUpdatingRole(true);

    try {
      // Get current session for auth header
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Session expired, please log in again');
        return;
      }

      // Using our Edge Function to update the role
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-user-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId: user.id, newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      toast.success(`Your role has been updated to ${newRole}`);

      // Refresh the page to reflect changes
      router.refresh();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(`Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Get role badge styles
  const getRoleBadgeStyles = () => {
    if (!role) return '';

    switch (role) {
      case 'admin':
        return 'fill-[#FFD700] text-[#FFD700]';
      case 'super_user':
        return 'fill-green-500';
      default:
        return '';
    }
  };



  // Render the dropdown for logged-in users
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="input" className="flex items-center gap-2 px-2 rounded-full hover:bg-accent transition-colors border shadow">
          <div className="relative">
            <Avatar className="h-8 w-8 border-2 p-0.5">
              <AvatarImage src={userAvatarUrl || undefined} alt={userName || 'User'} />
              <AvatarFallback className="p-2 overflow-hidden"><GradientAvatar username={userName || 'User'} /></AvatarFallback>
            </Avatar>
            {/* <Star className={cn("absolute -top-1 -right-1 h-3.5 w-3.5 fill-muted stroke-[1.5px]", getRoleBadgeStyles())} /> */}
          </div>
          <div className="flex text-left">
            <span className="text-sm font-medium flex items-center gap-1">
              {userName || userEmail?.split('@')[0] || 'User'}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="font-medium leading-none">{userName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Role Management Section - Only show if admin or developer */}
        {(hasRole('admin') || isDeveloper) && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Shield className="mr-2 h-4 w-4" />
              <span>My Role</span>
              {isUpdatingRole && (
                <div className="ml-auto animate-spin h-3 w-3 border-2 border-t-transparent border-primary rounded-full"></div>
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={role || undefined} onValueChange={handleRoleChange}>
                  <DropdownMenuRadioItem value="user" disabled={isUpdatingRole}>
                    <User className="mr-2 h-4 w-4" />
                    <span>User</span>
                  </DropdownMenuRadioItem>

                  <DropdownMenuRadioItem value="super_user" disabled={isUpdatingRole}>
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>Super User</span>
                  </DropdownMenuRadioItem>

                  <DropdownMenuRadioItem value="admin" disabled={isUpdatingRole}>
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <div className="text-xs px-2 py-1.5 text-muted-foreground">
                  {isDeveloper
                    ? "Developer access: You can always change roles"
                    : "Change your role to test different permissions"}
                </div>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )}

        {/* Conditionally render separator only if role management was shown */}
        {(hasRole('admin') || isDeveloper) && <DropdownMenuSeparator />}

        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserProfileDropdown } from '@/components/layout/user-profile-dropdown';
import { useAuth, useUserRole } from '@/app/auth';
import { UserIcon, HomeIcon, Settings, Users, BellIcon, BookIcon, BookOpenIcon } from 'lucide-react';
import { signOutAction } from '@/app/auth/actions';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger } from './sidebar/sidebar';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { toast } from 'sonner';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { Input } from '../ui/input';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const router = useRouter();

  // Get user information from auth context
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || null;
  const userEmail = user?.email || null;
  const userAvatar = user?.user_metadata?.avatar_url || null;
  const isLoadingUser = isLoading;

  // User data is now handled by the auth context, no need for manual data fetching

  const baseNavLinks = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/profile', label: 'Profile', icon: UserIcon },
  ];

  const navLinks = (() => {
    if (isRoleLoading || !isAuthenticated) {
      return baseNavLinks;
    }

    const links = [...baseNavLinks];
    const isAdmin = role === 'admin';
    const isSuperUser = role === 'super_user' || isAdmin;

    if (isAdmin) {
      links.push({ href: '/admin/users', label: 'User Management', icon: Users });
    }
    if (isSuperUser && !links.some(link => link.href === '/super-user/settings')) {
      links.push({ href: '/super-user/settings', label: 'Settings', icon: Settings });
    }
    return links;
  })();

  const handleSignOut = async () => {
    await signOutAction();
    router.refresh();
  };


  return (
    <header className="sticky top-0 w-full pb-1 z-20">
      <div className="flex h-12 items-center justify-center w-full">
        <div className="flex items-center justify-start w-1/2 gap-4 h-full rounded-none rounded-t-3xl pl-4">

          <SidebarTrigger className="" />
          <Breadcrumbs />


        </div>
        <Input className="w-1/4" placeholder="Search" showSearchIcon showCommandIcon />
        <div className="flex items-center justify-end w-1/2 h-full">
          <div className="flex items-center gap-4 h-full rounded-none rounded-bl-3xl pl-2">

            <Button variant="ghost" className="rounded-full h-8 w-8">
              <BookOpenIcon className="h-4 w-4" />
            </Button>

            <Button variant="ghost" className="rounded-full h-8 w-8" onClick={() => toast.success('Notification')}>
              <BellIcon className="h-4 w-4" />
            </Button>

            <Separator className=" bg-outline w-[2px] h-6" />

            {isLoadingUser ? (
              <div className="flex items-center gap-2">
                <Skeleton className="rounded-full h-8 w-8" />
                <Skeleton className="h-4 w-24 rounded" >
                  <span className="text-sm font-medium opacity-0">
                    Loading...
                  </span>
                </Skeleton>
              </div>
            ) : isAuthenticated ? (
              <UserProfileDropdown
                handleSignOut={handleSignOut}
              />
            ) : (
              <Button asChild variant="outline">
                <Link href="/sign-in">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { UserProfileDropdown } from '@/components/layout/user-profile-dropdown';
import { useUserRole } from '@/hooks/useUserRole';
import { UserIcon, HomeIcon, Settings, Users, BellIcon, BookIcon, BookOpenIcon } from 'lucide-react';
import { signOutAction } from '@/app/actions/sign';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger } from './sidebar/sidebar';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { toast } from 'sonner';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { Input } from '../ui/input';

export function Navbar({ session }: { session: any }) {
  const pathname = usePathname();
  const { role, isLoading: isRoleLoading } = useUserRole();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    if (!session) {
      setUserName(null);
      setUserEmail(null);
      setUserAvatar(null);
      setIsLoadingUser(false);
      return;
    }

    let isMounted = true;
    async function getUserData() {
      if (isMounted) setIsLoadingUser(true);
      try {
        const user = session.user;
        if (!user?.id) {
          if (isMounted) {
            setUserName(null);
            setUserEmail(null);
            setUserAvatar(null);
            setIsLoadingUser(false);
          }
          return;
        }

        if (isMounted) setUserEmail(user.email || null);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116' && isMounted) {
          console.error('Error fetching profile:', error);
        }

        if (isMounted) {
          if (profile) {
            setUserName(profile.full_name || profile.username);
            setUserAvatar(profile.avatar_url);
          } else {
            setUserName(user.user_metadata?.full_name || user.user_metadata?.name || null);
            setUserAvatar(null);
          }
        }
      } catch (error) {
        if (isMounted) console.error('Error fetching user data:', error);
        if (isMounted) {
          setUserName(null);
          setUserAvatar(null);
          setUserEmail(session?.user?.email || null);
        }
      } finally {
        if (isMounted) setIsLoadingUser(false);
      }
    }

    getUserData();

    return () => {
      isMounted = false;
    };
  }, [supabase, session]);

  const baseNavLinks = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/profile', label: 'Profile', icon: UserIcon },
  ];

  const navLinks = (() => {
    if (isRoleLoading || !session) {
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

            {session ? (
              isLoadingUser ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="rounded-full h-8 w-8" />
                  <Skeleton className="h-4 w-24 rounded" >
                    <span className="text-sm font-medium opacity-0">
                      {session.user.email.split('@')[0]}
                    </span>
                  </Skeleton>
                </div>
              ) : (
                <UserProfileDropdown
                  userName={userName}
                  userEmail={userEmail}
                  userAvatarUrl={userAvatar}
                  handleSignOut={handleSignOut}
                />
              )
            ) : (
              !isLoadingUser && (
                <Button asChild variant="outline">
                  <Link href="/sign-in">Login</Link>
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 
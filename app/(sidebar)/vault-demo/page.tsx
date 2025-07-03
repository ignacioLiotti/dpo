import { VaultDemoClient } from './vault-demo-client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function VaultDemoPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Fetch obras for the authenticated user
  const { data: obras, error } = await supabase
    .from("obras")
    .select("*")
    .eq("user_id", user.id)
    .limit(10);

  if (error) {
    console.error('Error fetching obras:', error);
  }

  return (
    <div className='w-full h-full'>
      {user.id}
      <VaultDemoClient
        obras={obras || []}
        userId={user.id}
      />
    </div>
  );
}
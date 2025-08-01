import Hero from "@/components/hero";
import { createServerSupabaseClient } from "@/app/auth/server-utils";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  
  // Check if user is authenticated first
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // If not authenticated, show hero page
  if (userError || !user) {
    return <Hero />;
  }

  // If authenticated, check for organization
  const { data: orgId } = await supabase.rpc('get_user_organization_id');
  
  // If user is authenticated but has no organization, redirect to setup
  if (!orgId) {
    redirect('/organization-setup');
  }

  // If user has organization, redirect to main app
  redirect('/files');
}
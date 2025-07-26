import Hero from "@/components/hero";
import { createServerSupabaseClient, getUserOrganization } from "@/app/auth/server-utils";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { user, organizationId } = await getUserOrganization(supabase);

  // If user is authenticated but has no organization, redirect to setup
  if (user && !organizationId) {
    redirect('/organization-setup');
  }

  // If user has organization, redirect to main app
  if (user && organizationId) {
    redirect('/files');
  }

  // Show hero for non-authenticated users
  return (
    <Hero />
  );
}
import * as React from "react";
import { NavMain, type NavItem } from "@/components/layout/sidebar/nav-main";
import { NavUser } from "@/components/layout/sidebar/nav-user";
import { TeamSwitcher } from "@/components/layout/sidebar/team-switcher";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, } from "@/components/layout/sidebar/sidebar";
import type { User } from '@supabase/supabase-js'
import { UserProfileDropdown } from "@/components/layout/user-profile-dropdown";
import { createClient } from "@/supabase/server";

interface InputNavItem {
  title: string;
  url: string;
  iconKey: string;
  items?: InputNavItem[];
}

interface AppSidebarProps {
  mappedData: InputNavItem[];
  user: User | null;
}

export async function AppSidebar({ mappedData, user }: AppSidebarProps) {
  const teams = [{ name: "Blank App Branch", plan: "Enterprise", }, { name: "Acme Corp.", plan: "Startup", }, { name: "Evil Corp.", plan: "Free", },];
  // const projects = [{ name: "Design Engineering", url: "#", icon: Frame, }, { name: "Sales & Marketing", url: "#", icon: PieChart, }, { name: "Travel", url: "#", icon: Map, },];

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!mappedData) {
    return <Sidebar collapsible="icon" />;
  }

  return (
    <Sidebar collapsible="icon" className=" !border-r-0 pt-1 z-20 flex justify-center items-center">
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mappedData as any} />
        {/* <NavProjects projects={projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        {/* <UserProfileDropdown userName={user?.user_metadata?.name} userEmail={user?.email} userAvatarUrl={user?.user_metadata?.avatar_url} /> */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>);
}
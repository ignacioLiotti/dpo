import * as React from "react";
import { NavMain, type NavItem } from "@/components/layout/sidebar/nav-main";
import { NavUser } from "@/components/layout/sidebar/nav-user";
import { TeamSwitcher } from "@/components/layout/sidebar/team-switcher";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, } from "@/components/layout/sidebar/sidebar";
import type { User } from '@supabase/supabase-js'
import { UserProfileDropdown } from "@/components/layout/user-profile-dropdown";
import { createClient } from "@/supabase/server";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  // const projects = [{ name: "Design Engineering", url: "#", icon: Frame, }, { name: "Sales & Marketing", url: "#", icon: PieChart, }, { name: "Travel", url: "#", icon: Map, },];

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!mappedData) {
    return <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
    </Sidebar>;
  }

  return (
    <Sidebar collapsible="icon" className=" !border-r-0 pt-1 z-20 flex justify-center items-center">
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mappedData as any} />
        {/* <NavProjects projects={projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        {/* <UserProfileDropdown userName={user?.user_metadata?.name} userEmail={user?.email} userAvatarUrl={user?.user_metadata?.avatar_url} /> */}
      </SidebarFooter>
      <SidebarRail className="group/rail pointer-events-auto cursor-pointer group-data-[state=expanded]:[--angle:30deg] group-data-[state=collapsed]:[--angle:-30deg] group-data-[state=expanded]:[--translate-x:-8px] group-data-[state=collapsed]:[--translate-x:8px]">
        <div className=" w-full h-full ml-[-1px] flex justify-center items-center flex-col">
          <span className="w-1 h-3 mb-[-5px] bg-gray-400 group-hover/rail:rotate-[var(--angle)] group-hover/rail:translate-x-[var(--translate-x)] origin-top transition-all duration-300 ease-spring" />
          <span className="w-1 h-3 bg-gray-400 group-hover/rail:rotate-[calc(var(--angle)*-1)] group-hover/rail:translate-x-[var(--translate-x)] origin-bottom transition-all duration-300 ease-spring" />
        </div>
      </SidebarRail >
    </Sidebar>);
}
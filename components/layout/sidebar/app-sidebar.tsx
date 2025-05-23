import * as React from "react";
import { NavMain, type NavItem } from "@/components/layout/sidebar/nav-main";
import { NavUser } from "@/components/layout/sidebar/nav-user";
import { TeamSwitcher } from "@/components/layout/sidebar/team-switcher";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, } from "@/components/layout/sidebar/sidebar";
import type { User } from '@supabase/supabase-js'
import * as Icons from "lucide-react";
import { UserProfileDropdown } from "@/components/layout/user-profile-dropdown";
import { createClient } from "@/supabase/server";
type IconKey = keyof typeof iconMap;

interface InputNavItem {
  title: string;
  url: string;
  iconKey: keyof typeof Icons;
  items?: InputNavItem[];
}

const processNavItems = (items: InputNavItem[]): NavItem[] => {
  return items.map(item => {
    const IconComponent = iconMap[item.iconKey as IconKey];

    const newItem: NavItem = {
      title: item.title,
      url: item.url,
      icon: IconComponent,
      items: item.items ? processNavItems(item.items) : undefined,
    };
    return newItem;
  });
};

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

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
        <NavMain items={mappedData} />
        {/* <NavProjects projects={projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        {/* <UserProfileDropdown userName={user?.user_metadata?.name} userEmail={user?.email} userAvatarUrl={user?.user_metadata?.avatar_url} /> */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>);
}
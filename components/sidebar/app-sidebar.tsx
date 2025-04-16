"use client";

import * as React from "react";
import {
  AudioWaveform, Bot, BrainCogIcon, Coins, Command, DatabaseZapIcon,
  FilePlus, FlaskConicalIcon, FolderSearch2, Frame, HardHatIcon, House,
  LayoutListIcon, LayoutTemplateIcon, LogIn, Map, PieChart, QrCodeIcon,
  TriangleAlert, UserCog, UserPlus
} from "lucide-react";
import { NavMain, type NavItem } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, } from "@/components/ui/sidebar";
import type { User } from '@supabase/supabase-js'
import * as Icons from "lucide-react";

type IconKey = keyof typeof iconMap;

interface InputNavItem {
  title: string;
  url: string;
  iconKey: keyof typeof Icons;
  items?: InputNavItem[];
}

const iconMap = {
  FilePlus, House, FolderSearch2, BrainCogIcon, LayoutTemplateIcon,
  DatabaseZapIcon, HardHatIcon, Coins, FlaskConicalIcon, Bot,
  LayoutListIcon, QrCodeIcon, UserCog, LogIn, UserPlus
};

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

export function AppSidebar({ mappedData, user }: AppSidebarProps) {
  const teams = [{ name: "Blank App Branch", logo: TriangleAlert, plan: "Enterprise", }, { name: "Acme Corp.", logo: AudioWaveform, plan: "Startup", }, { name: "Evil Corp.", logo: Command, plan: "Free", },];
  const projects = [{ name: "Design Engineering", url: "#", icon: Frame, }, { name: "Sales & Marketing", url: "#", icon: PieChart, }, { name: "Travel", url: "#", icon: Map, },];
  const itemsForNavMain = processNavItems(mappedData);

  if (!mappedData) {
    return <Sidebar collapsible="icon" />;
  }

  return (<Sidebar collapsible="icon" className=" !border-r-0">
    <SidebarHeader>
      <TeamSwitcher teams={teams} />
    </SidebarHeader>
    <SidebarContent>
      <NavMain items={itemsForNavMain} />
      {/* <NavProjects projects={projects} /> */}
    </SidebarContent>
    <SidebarFooter>
      <NavUser user={user} />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>);
}
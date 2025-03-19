"use client";

import * as React from "react";
import {
  AudioWaveform,
  Bot,
  BrainCogIcon,
  Coins,
  Command,
  DatabaseZapIcon,
  FilePlus,
  FlaskConicalIcon,
  FolderSearch2,
  Frame,
  GalleryVerticalEnd,
  HardHatIcon,
  House,
  LayoutListIcon,
  LayoutTemplateIcon,
  Map,
  PieChart,
  QrCodeIcon
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavProjects } from "@/components/sidebar/nav-projects";
import { NavUser } from "@/components/sidebar/nav-user";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import type { NavItem } from "@/components/sidebar/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

type IconKey = keyof typeof iconMap;

interface NavItemData {
  title: string;
  url: string;
  iconKey: IconKey;
}

interface NavData extends NavItemData {
  items: NavItemData[];
}

const iconMap = {
  FilePlus,
  House,
  FolderSearch2,
  BrainCogIcon,
  LayoutTemplateIcon,
  DatabaseZapIcon,
  HardHatIcon,
  Coins,
  FlaskConicalIcon,
  Bot,
  LayoutListIcon,
  QrCodeIcon
};

const transformDirectoryToNav = (
  structure: Record<string, any>,
  basePath: string = ""
): NavData[] => {
  const result: NavData[] = [];

  const findIconKey = (key: string): IconKey => {
    switch (key.toLowerCase()) {
      case "create":
        return "FilePlus";
      case "main":
        return "House";
      case "explore":
        return "FolderSearch2";
      case "api":
        return "BrainCogIcon";
      case "dashboard":
        return "LayoutTemplateIcon";
      case "db":
        return "DatabaseZapIcon";
      case "obras":
        return "HardHatIcon";
      case "presupuesto":
        return "Coins";
      case "uitest":
        return "FlaskConicalIcon";
      default:
        return "Bot";
    }
  };

  for (const key in structure) {
    if (key === "files") continue;

    const folder = structure[key];
    const files = folder.files || [];
    const hasPageFile = files.includes("page.tsx");
    const subfolders = Object.keys(folder).filter(k => k !== "files");

    if (hasPageFile) {
      const iconKey = findIconKey(key);
      const items = transformDirectoryToNav(folder, `${basePath}/${key}`);

      result.push({
        title: capitalizeFirstLetter(key),
        url: `${basePath}/${key}`.replace(/\/+/g, "/"),
        iconKey,
        items: [
          {
            title: "Main",
            url: `${basePath}/${key}`.replace(/\/+/g, "/"),
            iconKey: "House",
          },
          ...items
        ]
      });
    } else if (typeof folder === "object") {
      const iconKey = findIconKey(key);

      result.push({
        title: capitalizeFirstLetter(key),
        url: `${basePath}/${key}`.replace(/\/+/g, "/"),
        iconKey,
        items: transformDirectoryToNav(folder, `${basePath}/${key}`)
      });
    }
  }

  return result;
}

const mapIconsToComponents = (navItems: NavData[]): NavItem[] => {
  return navItems.map(item => ({
    title: item.title,
    url: item.url,
    icon: iconMap[item.iconKey],
    items: item.items.map(subItem => ({
      title: subItem.title,
      url: subItem.url,
      icon: iconMap[subItem.iconKey]
    }))
  }));
};

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function AppSidebar({ mappedData }: { mappedData: NavData[] }) {
  const teams = [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ];

  const projects = [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ];

  const itemsWithIcons = mapIconsToComponents(mappedData);

  if (!mappedData) {
    return <Sidebar collapsible="icon" />;
  }

  return (
    <Sidebar collapsible="icon" className=" !border-r-0">
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={itemsWithIcons} />
        {/* <NavProjects projects={projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: "User", email: "user@example.com", avatar: "" }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

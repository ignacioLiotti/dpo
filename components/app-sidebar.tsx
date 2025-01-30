"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
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
  LayoutTemplateIcon,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Modify the transform function to store icon keys
const transformDirectoryToNav = (
  structure: Record<string, any>,
  basePath: string = ""
): any[] => {
  const result: any[] = [];

  const findIconKey = (key) => {
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
        return "Bot"; // Default icon key
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
        iconKey: iconKey, // Store icon key
        items: [
          {
            title: "Main",
            url: `${basePath}/${key}`.replace(/\/+/g, "/"),
            iconKey: "House", // Use the Main icon key for the "Main" page
          },
          ...items
        ]
      });
    } else if (typeof folder === "object") {
      const iconKey = findIconKey(key);

      result.push({
        title: capitalizeFirstLetter(key),
        url: `${basePath}/${key}`.replace(/\/+/g, "/"),
        iconKey: iconKey, // Store icon key
        items: transformDirectoryToNav(folder, `${basePath}/${key}`)
      });
    }
  }

  return result;
}

// Map icon keys back to components
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
  Bot
};

// Function to map icon keys back to components
const mapIconsToComponents = (navItems) => {
  return navItems.map(item => ({
    ...item,
    icon: iconMap[item.iconKey],
    items: item.items.map(subItem => ({
      ...subItem,
      icon: iconMap[subItem.iconKey]
    }))
  }));
};

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function AppSidebar({ mappedData }) {

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
  ]

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
  ]

  const itemsWithIcons = mapIconsToComponents(mappedData)

  if (!mappedData) {
    return <Sidebar collapsible="icon" />;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={itemsWithIcons} />
        <NavProjects projects={projects} /> {/* Add projects if applicable */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: "User", email: "user@example.com", avatar: "" }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

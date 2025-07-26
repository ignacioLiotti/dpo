"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import * as Icons from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/layout/sidebar/sidebar";
import React from "react";

// Icon mapping for the navigation
const iconMap = {
  AudioWaveform: Icons.AudioWaveform,
  Bot: Icons.Bot,
  BrainCogIcon: Icons.BrainCog,
  Coins: Icons.Coins,
  Command: Icons.Command,
  DatabaseZapIcon: Icons.DatabaseZap,
  FilePlus: Icons.FilePlus,
  FlaskConicalIcon: Icons.FlaskConical,
  FolderSearch2: Icons.FolderSearch2,
  Frame: Icons.Frame,
  HardHatIcon: Icons.HardHat,
  House: Icons.House,
  LayoutListIcon: Icons.LayoutList,
  LayoutTemplateIcon: Icons.LayoutTemplate,
  LogIn: Icons.LogIn,
  Map: Icons.Map,
  PieChart: Icons.PieChart,
  QrCodeIcon: Icons.QrCode,
  TriangleAlert: Icons.TriangleAlert,
  UserCog: Icons.UserCog,
  UserPlus: Icons.UserPlus,
};

type IconKey = keyof typeof iconMap;

type SubItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  iconKey?: string;
};

export type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  iconKey?: string;
  isActive?: boolean;
  items?: SubItem[];
};

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

export function NavMain({
  items,
}: {
  items: NavItem[] | InputNavItem[];
}) {
  const pathname = usePathname();

  // Process items if they have iconKey instead of icon (coming from server)
  const processedItems = React.useMemo(() => {
    if (items.length > 0 && 'iconKey' in items[0]) {
      return processNavItems(items as InputNavItem[]);
    }
    return items as NavItem[];
  }, [items]);

  // Check if a subitem is active
  const isSubItemActive = (subItems?: SubItem[]) =>
    subItems?.some((subItem) => subItem.url === pathname);

  const { toggleSidebar, state } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {processedItems.map((item) => {
          const hasActiveSubItem = isSubItemActive(item.items);

          return item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || hasActiveSubItem}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => {
                      if (state === 'collapsed') {
                        toggleSidebar()
                      }
                    }}
                    className={`flex items-center px-4 py-2 rounded-lg hover:bg-white/70 hover:text-primary cursor-pointer transition-colors ${item.isActive || hasActiveSubItem ? "bg-white text-primary shadow outline outline-outline outline-1" : ""
                      }`}
                  >
                    {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                    <span className="text-sm font-medium">{item.title}</span>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          className={`flex items-center px-4 py-1.5 rounded-lg hover:bg-white/70 hover:text-primary cursor-pointer transition-colors ${subItem.url === pathname ? "bg-white outline outline-outline outline-1 text-primary shadow" : ""
                            }`}
                        >
                          <Link href={subItem.url}>
                            {subItem.icon && <subItem.icon className="mr-3 h-4 w-4" />}
                            <span className="text-sm">{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={`flex items-center px-4 py-2 rounded-lg hover:bg-white/70 hover:text-primary transition-colors ${item.url === pathname ? "bg-white text-primary shadow outline outline-outline outline-1" : ""
                  }`}
              >
                <Link href={item.url}>
                  {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

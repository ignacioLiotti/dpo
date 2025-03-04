"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

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
} from "@/components/ui/sidebar";
import React from "react";

type SubItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
};

export type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: SubItem[];
};

export function NavMain({
  items,
}: {
  items: NavItem[];
}) {
  const pathname = usePathname();

  // Check if a subitem is active
  const isSubItemActive = (subItems?: SubItem[]) =>
    subItems?.some((subItem) => subItem.url === pathname);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
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
                    className={`flex items-center px-4 py-2 rounded-lg hover:bg-white/70 hover:text-primary cursor-pointer transition-colors ${item.isActive || hasActiveSubItem ? "bg-white text-primary shadow" : ""
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
                          className={`flex items-center px-4 py-1.5 rounded-lg hover:bg-white/70 hover:text-primary cursor-pointer transition-colors ${subItem.url === pathname ? "bg-white text-primary shadow" : ""
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
                className={`flex items-center px-4 py-2 rounded-lg hover:bg-white/70 hover:text-primary transition-colors ${item.url === pathname ? "bg-white text-primary shadow" : ""
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

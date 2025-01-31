import React from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, House, PanelsTopLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface AllTabsProps {
  type: "text" | "icon" | "both"; // Type of content (text, icon, or both)
  direction: "vertical" | "horizontal"; // Layout direction of the tabs
  variant: "default" | "card"; // Determines how the tab content is displayed
  children: React.ReactNode;
}

export default function AllTabs({ type, direction, variant, children }: AllTabsProps) {
  const renderTabsTrigger = (triggerProps: any) => {
    const { value, children, number, new: isNew } = triggerProps;

    const renderIconAndText = () => {
      return (
        <>
          {triggerProps.icon && <span className="mr-2">{triggerProps.icon}</span>}
          {type !== "icon" && children}
          {number && (
            <Badge
              className="min-w-5 justify-center bg-primary/15 px-1 transition-opacity group-data-[state=inactive]:opacity-50"
              variant="secondary"
            >
              {number}
            </Badge>
          )}
          {isNew && <Badge variant="destructive">New</Badge>}
        </>
      );
    };

    return (
      <TabsTrigger value={value} className="py-3">
        {type === "icon" ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>{renderIconAndText()}</TooltipTrigger>
              <TooltipContent className="px-2 py-1 text-xs">{children}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          renderIconAndText()
        )}
      </TabsTrigger>
    );
  };

  return (
    <>
      <Tabs defaultValue="tab-1">
        <ScrollArea>
          <TabsList className={direction === "horizontal" ? "flex" : "flex-col"}>
            {React.Children.map(children, (child: any) => {
              if (child.type === TabsTrigger) {
                return renderTabsTrigger(child.props);
              }
              return null;
            })}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {React.Children.map(children, (child: any) => {
          if (child.type === TabsContent) {
            return child;
          }
          return null;
        })}
      </Tabs>
    </>
  );
}

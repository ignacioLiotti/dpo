import Component from "@/components/CustomTabs/comp-426";
import AllTabs from "@/components/CustomTabs/alltabs";
import Component2 from "@/components/CustomTabs/comp-433";
import Component3 from "@/components/CustomTabs/comp-437";
import Component4 from "@/components/CustomTabs/comp-440";
import Component5 from "@/components/CustomTabs/comp-441";
import Component6 from "@/components/CustomTabs/comp-442";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, CogIcon, House, PanelsTopLeft, Shapes, Zap } from "lucide-react";
import React from "react";

export default function Playground() {
  return (
    <div className="flex items-center justify-center">
      <div style={{ padding: "1rem" }} className="flex flex-col justify-center items-center w-[50vw] gap-5">
        {/* <Component /> */}
        433
        <Component2 />
        440<Component4 />
        441<Component5 />
        437<Component3 />

        {/* <Component6 /> */}
      </div>
    </div>
  );
}

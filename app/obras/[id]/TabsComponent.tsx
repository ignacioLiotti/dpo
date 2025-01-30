// app/obras/[id]/TabsComponent.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { House, PanelsTopLeft, Box } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import PresupuestosContent from './PresupuestosContent';

function TabsComponent({
  obra,
}: {
  obra: { NombreObra: string; Observaciones: string; IdObras: string },
}) {
  return (
    <Tabs defaultValue="tab-1">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">{obra.NombreObra}</h1>
          <p className="text-sm text-input/60 font-semibold">{obra.Observaciones}</p>
        </div>

        <ScrollArea>
          <TabsList className="mb-3">
            <TabsTrigger value="tab-1">
              <House
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tab-2" className="group">
              <PanelsTopLeft
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Projects
              <Badge className="ms-1.5 bg-primary/15 px-1 transition-opacity group-data-[state=inactive]:opacity-50">
                {/* The length will be updated dynamically */}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="tab-3" className="group">
              <Box
                className="-ms-0.5 me-1.5 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Packages
              <Badge className="ms-1.5 transition-opacity group-data-[state=inactive]:opacity-50">
                New
              </Badge>
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <TabsContent value="tab-1">
        <p className="p-4 pt-1 text-center text-xs text-muted-foreground">Content for Tab 1</p>
      </TabsContent>

      <PresupuestosContent
        obraId={obra.IdObras}
      />

      <TabsContent value="tab-3">
        <p className="p-4 pt-1 text-center text-xs text-muted-foreground">Content for Tab 3</p>
      </TabsContent>
    </Tabs>
  );
}

export default TabsComponent;
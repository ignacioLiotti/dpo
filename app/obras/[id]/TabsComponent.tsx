// app/obras/[id]/TabsComponent.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { House, PanelsTopLeft, Box } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import PresupuestosContent from './PresupuestosContent';
import { formatCurrency } from '@/lib/utils/format';
import { MedicionHistory } from '@/components/medicion/MedicionHistory';
import { useEffect, useState } from 'react';
import { useMedicion } from '@/lib/hooks/useMedicion';
import { MedicionData } from '@/lib/types/presupuesto';

interface Obra {
  NombreObra: string;
  Observaciones: string;
  IdObras: string;
  Monto_Contrato?: number;
  Plazo?: number;
  Fecha_de_Contrato?: Date;
  Fecha_de_Inicio?: Date;
  presupuestos?: { id: number }[];
}

function TabsComponent({
  obra,
}: {
  obra: Obra
}) {
  const [mediciones, setMediciones] = useState<MedicionData[]>([]);
  const { getMediciones } = useMedicion({
    presupuestoId: obra.presupuestos?.[0]?.id || 0
  });

  useEffect(() => {
    if (obra.presupuestos?.[0]?.id) {
      const loadMediciones = async () => {
        try {
          const data = await getMediciones();
          setMediciones(data);
        } catch (err) {
          console.error("Error loading mediciones:", err);
        }
      };
      loadMediciones();
    }
  }, [getMediciones, obra.presupuestos]);

  // Calculate progress based on dates
  const calculateProgress = () => {
    if (!obra.Fecha_de_Inicio || !obra.Plazo) return 0;

    const startDate = new Date(obra.Fecha_de_Inicio);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (obra.Plazo * 30)); // Assuming Plazo is in months

    const today = new Date();
    const totalDays = endDate.getTime() - startDate.getTime();
    const daysElapsed = today.getTime() - startDate.getTime();

    const progress = (daysElapsed / totalDays) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const progress = calculateProgress();
  const formattedStartDate = obra.Fecha_de_Inicio
    ? new Date(obra.Fecha_de_Inicio).toLocaleDateString()
    : 'Pending';
  const formattedEndDate = obra.Fecha_de_Inicio && obra.Plazo
    ? new Date(new Date(obra.Fecha_de_Inicio).setMonth(new Date(obra.Fecha_de_Inicio).getMonth() + obra.Plazo)).toLocaleDateString()
    : 'Pending';

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
              Presupuestos
              <Badge className="ms-1.5 bg-primary/15 px-1 transition-opacity group-data-[state=inactive]:opacity-50">
                {obra.presupuestos?.length || 0}
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

      <TabsContent value="tab-1" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Overview Card */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Project Overview</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Project Name</label>
                <p className="text-base">{obra.NombreObra}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Project ID</label>
                <p className="text-base">{obra.IdObras}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contract Duration</label>
                <p className="text-base">{obra.Plazo ? `${obra.Plazo} months` : 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p className="text-base">{obra.Observaciones || 'No observations available'}</p>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Project Progress</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formattedStartDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected End Date</p>
                  <p className="font-medium">{formattedEndDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Overview */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Budget Overview</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contract Amount</p>
                  <p className="font-medium">{obra.Monto_Contrato ? formatCurrency(obra.Monto_Contrato) : 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Number of Budgets</p>
                  <p className="font-medium">{obra.presupuestos?.length || 0} presupuestos</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget Utilization</span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Contract Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Important Dates</p>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">Contract Date</label>
                    <p className="text-sm">
                      {obra.Fecha_de_Contrato
                        ? new Date(obra.Fecha_de_Contrato).toLocaleDateString()
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Project Start</label>
                    <p className="text-sm">{formattedStartDate}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Contract Status</p>
                <p className="text-sm">
                  {progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mediciones History */}
        {mediciones.length > 0 && obra.presupuestos?.[0]?.id && (
          <div className="mt-8">
            <MedicionHistory presupuestoId={obra.presupuestos[0].id} />
          </div>
        )}
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
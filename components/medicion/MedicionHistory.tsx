import { useEffect, useState } from "react";
import { MedicionData } from "@/lib/types/presupuesto";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMedicion } from "@/lib/hooks/useMedicion";

interface MedicionHistoryProps {
  presupuestoId: string | number;
}

export function MedicionHistory({ presupuestoId }: MedicionHistoryProps) {
  const { getMediciones, isLoading, error } = useMedicion({ presupuestoId });
  const [mediciones, setMediciones] = useState<MedicionData[]>([]);

  useEffect(() => {
    const loadMediciones = async () => {
      try {
        const data = await getMediciones();
        setMediciones(data);
      } catch (err) {
        console.error("Error loading mediciones:", err);
      }
    };
    loadMediciones();
  }, [getMediciones]);

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Sort mediciones by date
  const sortedMediciones = [...mediciones].sort((a, b) =>
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  // Calculate month-over-month progress
  const getProgressChange = (current: number, previous: number | undefined) => {
    if (previous === undefined) return 0;
    return current - previous;
  };

  if (sortedMediciones.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estado Actual</CardTitle>
          <CardDescription>Resumen del avance de la obra</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monto Completado</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(sortedMediciones[0].totalCompleted)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avance Total</p>
                <p className="text-2xl font-bold">
                  {sortedMediciones[0].completedPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso General</span>
                <span className="font-medium">{sortedMediciones[0].completedPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${sortedMediciones[0].completedPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Mediciones</CardTitle>
          <CardDescription>Detalle cronológico de todas las mediciones</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] w-full pr-4">
            <div className="space-y-8">
              {sortedMediciones.map((medicion, index) => {
                const progressChange = getProgressChange(
                  medicion.completedPercentage,
                  sortedMediciones[index + 1]?.completedPercentage
                );

                return (
                  <div
                    key={medicion.id}
                    className="relative flex items-start border-l-2 border-primary pl-4"
                  >
                    <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            Medición #{sortedMediciones.length - index}
                          </p>
                          <time className="text-sm text-muted-foreground">
                            {new Date(medicion.fecha).toLocaleDateString('es-AR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </time>
                        </div>
                        {progressChange > 0 && (
                          <Badge variant="secondary" className="bg-primary/10">
                            +{progressChange.toFixed(2)}%
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Monto Completado</p>
                          <p className="font-medium">
                            {formatCurrency(medicion.totalCompleted)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Porcentaje Total</p>
                          <p className="font-medium">
                            {medicion.completedPercentage.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="h-2 rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${medicion.completedPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
} 
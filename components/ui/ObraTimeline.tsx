import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline, TimelineItem, TimelineSeparator, TimelineIndicator, TimelineHeader, TimelineDate, TimelineTitle } from "@/components/ui/timeline";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { Briefcase, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import type { Obra } from "@/types";

interface TimelineEvent {
  id: string;
  obraId: string | number;
  obraNombre: string;
  date: Date;
  type: string;
  color: string;
  departamento: string;
  localidad: string;
  empresa: string;
}

interface GroupedEvents {
  [key: string]: TimelineEvent[];
}

export const ObraTimeline = ({ obras }: { obras: Obra[] }) => {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    processTimelineEvents(obras);
  }, [obras]);

  const processTimelineEvents = (obras: Obra[]) => {
    // Get current date and date 3 months from now
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);

    // Extract all date events within the next 3 months
    const events: TimelineEvent[] = [];

    obras.forEach(obra => {
      const dateFields = [
        { field: 'fechaAdjudicacion', label: 'Adjudicación', color: 'bg-gray-800' },
        { field: 'fechaContrato', label: 'Contrato', color: 'bg-gray-800' },
        { field: 'fechaInicio', label: 'Inicio de Obra', color: 'bg-gray-800' },
        { field: 'fechaFin', label: 'Finalización de Obra', color: 'bg-gray-800' },
        { field: 'fechaLicitacion', label: 'Licitación ', color: 'bg-gray-800' },
        { field: 'fechaInauguracion', label: 'Inauguración Proxima', color: 'bg-gray-800' }
      ];

      dateFields.forEach(({ field, label, color }) => {
        if (obra[field as keyof Obra]) {
          const eventDate = new Date(obra[field as keyof Obra] as string);

          // Only include dates within the 3-month window
          if (eventDate >= today && eventDate <= threeMonthsLater) {
            events.push({
              id: `${obra.id}-${field}`,
              obraId: obra.id || '',
              obraNombre: obra.nombre || 'Sin nombre',
              date: eventDate,
              type: label,
              color: color,
              departamento: obra.departamento || '',
              localidad: obra.localidad || '',
              empresa: obra.empresaAdjudicada || ''
            });
          }
        }
      });
    });

    // Sort events by date
    events.sort((a, b) => a.date.getTime() - b.date.getTime());
    setTimelineEvents(events);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('es-AR', { month: 'short' });
    return `${day} ${month.toLowerCase()}`;
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  };

  // Group events by month
  const groupEventsByMonth = () => {
    const grouped: GroupedEvents = {};

    timelineEvents.forEach(event => {
      const monthYear = getMonthName(event.date);
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(event);
    });

    return grouped;
  };

  const groupedEvents = groupEventsByMonth();

  if (timelineEvents.length === 0) return (
    <Card className="flex items-center justify-center h-64">
      <CardContent className="text-muted-foreground">
        No hay eventos programados para los próximos 3 meses.
      </CardContent>
    </Card>
  );

  return (
    <Card className="shadow-none h-full">
      <CardHeader className="pb-2 px-4">
        <CardTitle className="text-xl font-medium text-gray-800">
          Cronograma de Obras
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-y-auto h-full max-h-[300px] floating-scroll pt-0 px-4">
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([month, events]) => (
            <div key={month} className="mb-6">
              <h3 className="text-sm uppercase tracking-wider font-semibold sticky top-0 bg-white/90 backdrop-blur-sm py-2 z-10">
                {month}
              </h3>

              <Timeline orientation="vertical" className="pl-1">
                {events.map((event, eventIndex) => (
                  <TimelineItem
                    key={event.id}
                    step={eventIndex + 1}
                    className="last:pb-0"
                  >
                    <TimelineSeparator className="group-data-[orientation=vertical]/timeline:h-[calc(100%-1.75rem)] group-data-[orientation=vertical]/timeline:translate-y-6" />
                    <TimelineIndicator>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: eventIndex * 0.1, type: "spring" }}
                        className={`absolute inset-0 bg-black rounded-full`}
                      />
                    </TimelineIndicator>

                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <TimelineHeader>
                            <div className="flex items-center gap-2 ">
                              <TimelineDate className="text-xs font-semibold m-0 text-primary">
                                {formatShortDate(event.date)}
                              </TimelineDate>
                              <span className="text-xs font-medium">•</span>
                              <span className="text-xs font-medium text-muted-foreground">{event.type}</span>
                            </div>
                            <TimelineTitle className="text-sm font-light line-clamp-2 text-ellipsis mb-3">
                              {event.obraNombre}
                            </TimelineTitle>
                          </TimelineHeader>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="w-80 p-0 rounded-xl">
                          <Card className="border-none shadow-none ">
                            <CardHeader className={`${event.color} text-white rounded-t-xl py-3 px-4`}>
                              <CardTitle className="text-base font-medium">{event.type}</CardTitle>
                              <p className="text-xs opacity-90 font-normal">{formatDate(event.date)}</p>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                              <h4 className="text-lg font-medium text-foreground">
                                {event.obraNombre}
                              </h4>

                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-start text-muted-foreground">
                                  <MapPin className="w-4 h-4 mr-2 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-medium">Ubicación</div>
                                    <div className="text-foreground">{event.localidad}, {event.departamento}</div>
                                  </div>
                                </div>
                                <div className="flex items-start text-muted-foreground">
                                  <Briefcase className="w-4 h-4 mr-2 mt-0.5" />
                                  <div>
                                    <div className="text-xs font-medium">Empresa</div>
                                    <div className="text-foreground">{event.empresa || "No asignada"}</div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TimelineItem>
                ))}
              </Timeline>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

"use client";

import { useEffect, useMemo, useState } from "react";
import { useObras } from "@/hooks/useObras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  Tooltip as RechartsTooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { Building2, CircleDollarSign, Timer, Activity, Search, CalendarRange, TrendingDown, TrendingUp, ChevronRight, ArrowUpDown, Calendar, Clock, Info, MapPin, Briefcase } from "lucide-react";
import type { Obra } from "@/types";
import ObrasTable from "./ObrasTable";
import _ from "lodash";
import { DateRange } from "react-day-picker";
import { format, subMonths, parse, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { TabsContent, TabsList } from "@/components/ui/tabs";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef
} from "@tanstack/react-table";
import React from "react";
import ObrasReporte from "./ObrasReporte";
import { Timeline, TimelineItem, TimelineSeparator, TimelineIndicator, TimelineHeader, TimelineDate, TimelineTitle, TimelineContent } from "@/components/ui/timeline";

const COLORS = {
  charts: {
    primary: '#5347ce',
    secondary: '#10B981',
    tertiary: '#4896fe',
    quaternary: '#16c8c7'
  }
};

// Currency formatter helper
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: 'compact'
  }).format(value);
};

interface ChartDataItem {
  name: string;
  value: number;
}

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

const ESTADOS = [
  "Terminada",
  "con Proyecto Ejecutivo",
  "Cancelada",
  "Factibilidad",
  "En Ejecución",
  "Otra Reparticion",
  "Desestimada",
  "en Proyecto",
  "Pre Financiacion",
  "sistemaObsoleta",
  "Sin Estado",
  "Economia de Obra",
  "Licitacion",
  "Rescindida",
  "Adjudicacion"
];

// Group estados into stages
const ESTADO_STAGES = {
  initial: ["Factibilidad", "en Proyecto", "con Proyecto Ejecutivo"],
  middle: ["Licitacion", "Adjudicacion", "Pre Financiacion"],
  active: ["En Ejecución"],
  completed: ["Terminada"],
  other: ["Cancelada", "Otra Reparticion", "Desestimada", "sistemaObsoleta", "Sin Estado", "Economia de Obra", "Rescindida"]
};

interface StatsWithComparison {
  value: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'neutral';
  previousValue: number;
  periodLabel: string;
}

interface DashboardStats {
  totalObras: StatsWithComparison;
  totalMoney: StatsWithComparison;
  averageMoney: StatsWithComparison;
  activeObras: StatsWithComparison;
}

interface TimeByArea {
  [key: string]: {
    total: number;
    count: number;
  };
}

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

const RecentObrasTable = ({ data }: { data: Obra[] }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns: ColumnDef<Obra>[] = [
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4 h-8 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Nombre</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-xs truncate">
          {row.getValue("nombre") || "Sin nombre"}
        </div>
      ),
    },
    {
      accessorKey: "localidad",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4 h-8 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Localidad</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.getValue("localidad") || "N/A",
    },
    {
      accessorKey: "avance",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4 h-8 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Estado</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const estado = row.getValue("avance") as string;
        return (
          <Badge
            className={
              estado === "Terminada"
                ? "bg-green-50 text-green-700 hover:bg-green-50 border-green-100"
                : estado === "En Ejecución"
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-100"
            }
          >
            {estado || "Sin estado"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "montoContrato",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Inversión</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {row.getValue("montoContrato") || "N/A"}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  return (
    <div className="overflow-hidden rounded-sm border border-gray-100 h-full">
      <Table className="w-full text-xs overflow-y-auto max-h-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-gray-50 border-b border-gray-100 hover:bg-gray-100 sticky top-0">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="py-2 px-4">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="">
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-2 px-4">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

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
          {/* <span className="text-sm text-muted-foreground block mt-1">
            Próximos 3 Meses
          </span> */}
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
                    <TimelineSeparator className=" group-data-[orientation=vertical]/timeline:h-[calc(100%-1.75rem)] group-data-[orientation=vertical]/timeline:translate-y-6" />
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

export default function ObrasPage() {
  const { data: obras = [], isLoading, error } = useObras();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Animation controls
  const slideControls = useAnimation();

  const handlePageChange = async (page: number) => {
    await slideControls.start({
      x: page * -100 + '%',
      transition: { type: "spring", stiffness: 300, damping: 30 }
    });
    setCurrentPage(page);
  };

  // Date filter presets
  const presets = [
    { label: "Último mes", getDates: () => ({ from: subMonths(new Date(), 1), to: new Date() }) },
    { label: "Últimos 6 meses", getDates: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
    { label: "Último año", getDates: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
    { label: "Últimos 4 años", getDates: () => ({ from: subMonths(new Date(), 48), to: new Date() }) },
  ];

  useEffect(() => {
    if (dateRange) {
      const preset = presets.find(preset => preset.getDates().from === dateRange.from && preset.getDates().to === dateRange.to);
      setSelectedPreset(preset?.label || null);
    }
  }, []);

  // Parse date helper function
  const parseDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    try {
      return parse(dateStr.toLowerCase(), "dd-MMM-yy", new Date(), { locale: es });
    } catch {
      return null;
    }
  };

  // Add this helper function after the parseDate function
  const getAllMonthsBetween = (startDate: Date, endDate: Date) => {
    const months: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      months.push(format(currentDate, 'MMM yy', { locale: es }));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
  };

  // Filter obras by date range
  const filteredObrasByDate = useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) return obras;

    return obras.filter((obra) => {
      const startDate = parseDate(obra.fechaInicio);
      if (!startDate) return false;

      const range = {
        start: dateRange.from!,
        end: dateRange.to || new Date(),
      };

      return isWithinInterval(startDate, range);
    });
  }, [obras, dateRange]);

  // Calculate stats for a specific time period
  const calculatePeriodStats = (obras: Obra[], startDate: Date, endDate: Date) => {
    const periodObras = obras.filter((obra) => {
      const obraDate = parseDate(obra.fechaInicio);
      if (!obraDate) return false;
      return isWithinInterval(obraDate, { start: startDate, end: endDate });
    });

    const totalObras = periodObras.length;
    const totalMoney = periodObras.reduce((acc, obra) =>
      acc + parseFloat(obra.montoContrato?.replace(/[$.]/g, '').replace(',', '.') || "0"), 0);
    const averageMoney = totalObras > 0 ? totalMoney / totalObras : 0;
    const activeObras = periodObras.filter((obra) => obra.avance === "En Ejecución").length;

    return { totalObras, totalMoney, averageMoney, activeObras };
  };

  // Calculate percentage change
  const calculateChange = (current: number, previous: number, periodLabel: string): StatsWithComparison => {
    const percentageChange = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    return {
      value: current,
      previousValue: previous,
      percentageChange,
      trend: percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'neutral',
      periodLabel
    };
  };

  // Enhanced stats calculation with comparison
  const stats = useMemo(() => {
    if (!obras.length) return null;

    let currentPeriodStats;
    let previousPeriodStats;
    let periodLabel = 'todo el periodo';

    if (dateRange?.from) {
      const currentEnd = dateRange.to || new Date();
      const periodLength = currentEnd.getTime() - dateRange.from.getTime();
      const previousPeriodStart = new Date(dateRange.from.getTime() - periodLength);
      const previousPeriodEnd = new Date(dateRange.from);

      // Calculate period label based on length
      const monthsDiff = Math.round(periodLength / (1000 * 60 * 60 * 24 * 30));
      if (monthsDiff === 1) periodLabel = 'mes anterior';
      else if (monthsDiff === 6) periodLabel = '6 meses anteriores';
      else if (monthsDiff === 12) periodLabel = 'año anterior';
      else periodLabel = `${monthsDiff} meses anteriores`;

      currentPeriodStats = calculatePeriodStats(obras, dateRange.from, currentEnd);
      previousPeriodStats = calculatePeriodStats(obras, previousPeriodStart, previousPeriodEnd);
    } else {
      currentPeriodStats = calculatePeriodStats(obras, new Date(0), new Date());
      previousPeriodStats = { totalObras: 0, totalMoney: 0, averageMoney: 0, activeObras: 0 };
    }

    return {
      totalObras: calculateChange(currentPeriodStats.totalObras, previousPeriodStats.totalObras, periodLabel),
      totalMoney: calculateChange(currentPeriodStats.totalMoney, previousPeriodStats.totalMoney, periodLabel),
      averageMoney: calculateChange(currentPeriodStats.averageMoney, previousPeriodStats.averageMoney, periodLabel),
      activeObras: calculateChange(currentPeriodStats.activeObras, previousPeriodStats.activeObras, periodLabel)
    };
  }, [obras, dateRange]);

  // Update the monthly progress calculation in chartData useMemo
  const monthlyData = useMemo(() => {
    // Get date range
    const start = dateRange?.from || subMonths(new Date(), 6);
    const end = dateRange?.to || new Date();

    // Get all months between start and end
    const allMonths = getAllMonthsBetween(start, end);

    // Initialize data structure with all months
    const data = allMonths.reduce((acc, month) => {
      acc[month] = { iniciadas: 0, terminadas: 0 };
      return acc;
    }, {} as Record<string, { iniciadas: number; terminadas: number }>);

    // Fill in the actual data
    filteredObrasByDate.forEach(obra => {
      const startDate = parseDate(obra.fechaInicio);
      const endDate = parseDate(obra.fechaFin);

      if (startDate && isWithinInterval(startDate, { start, end })) {
        const monthKey = format(startDate, 'MMM yy', { locale: es });
        if (data[monthKey]) {
          data[monthKey].iniciadas++;
        }
      }

      if (endDate && isWithinInterval(endDate, { start, end })) {
        const monthKey = format(endDate, 'MMM yy', { locale: es });
        if (data[monthKey]) {
          data[monthKey].terminadas++;
        }
      }
    });

    // Convert to array and maintain chronological order
    return Object.entries(data)
      .map(([name, values]) => ({
        name,
        ...values
      }))
      .sort((a, b) => {
        const dateA = parse(a.name, 'MMM yy', new Date(), { locale: es });
        const dateB = parse(b.name, 'MMM yy', new Date(), { locale: es });
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredObrasByDate, dateRange]);

  const chartData = useMemo(() => {
    if (!filteredObrasByDate.length) return {
      statusData: [],
      areaData: [],
      timelineData: [],
      timeToCompletionData: [],
      monthlyProgress: []
    };

    // Group obras by stages
    const stageCount = filteredObrasByDate.reduce((acc: Record<string, number>, obra: Obra) => {
      let stage = "other";
      const estado = obra.avance || "Sin Estado";

      Object.entries(ESTADO_STAGES).forEach(([key, states]) => {
        if (states.includes(estado)) {
          stage = key;
        }
      });

      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});

    // Create data for the gauge chart
    const stageData = [
      { name: 'Inicial', value: stageCount.initial || 0, color: '#10B981' },
      { name: 'En Proceso', value: stageCount.middle + (stageCount.active || 0), color: '#06B6D4' },
      { name: 'Completada', value: stageCount.completed || 0, color: '#4F46E5' },
      // { name: 'Empty', value: stageCount.other || 0, color: '#F3F4F6' }, // For half-circle effect
    ].sort((a, b) => b.value - a.value);

    stageData.push({ name: 'Empty', value: stageCount.other || 0, color: '#F3F4F6' });

    console.log('stageData', stageData);

    // Calculate area distribution with percentages
    const areaSum = filteredObrasByDate.reduce((acc: Record<string, number>, obra: Obra) => {
      const area = obra.area || "Sin área";
      acc[area] = (acc[area] || 0) + parseFloat(obra.montoContrato?.replace('$', '')?.replace(',', '') || "0");
      return acc;
    }, {});

    const totalAmount = Object.values(areaSum).reduce((sum, value) => sum + value, 0);

    const areaData = Object.entries(areaSum)
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / totalAmount) * 100
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3); // Take top 3 areas

    const obrasByYear = _.groupBy(filteredObrasByDate, obra => {
      const date = obra.fechaInicio ? new Date(obra.fechaInicio) : null;
      return date ? date.getFullYear() : 'Sin fecha';
    });

    const timelineData = Object.entries(obrasByYear)
      .filter(([year]) => year !== 'Sin fecha')
      .map(([year, yearObras]) => ({
        year: parseInt(year),
        investment: yearObras.reduce((acc, obra) =>
          acc + parseFloat(obra.montoContrato?.replace('$', '')?.replace(',', '') || "0"), 0)
      }))
      .sort((a, b) => a.year - b.year);

    const completedObras = filteredObrasByDate.filter(obra =>
      obra.avance === "Terminada" && obra.fechaInicio && obra.fechaFin
    );

    const timeByArea = completedObras.reduce<TimeByArea>((acc, obra) => {
      const area = obra.area || "Otra";
      const startDate = new Date(obra.fechaInicio!);
      const endDate = new Date(obra.fechaFin!);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (!acc[area]) {
        acc[area] = { total: 0, count: 0 };
      }
      acc[area].total += days;
      acc[area].count += 1;

      return acc;
    }, {});

    const timeToCompletionData = Object.entries(timeByArea).map(([area, data]) => ({
      area,
      avgDays: Math.round(data.total / data.count)
    }));

    return {
      statusData: stageData,
      areaData,
      timelineData,
      timeToCompletionData,
      monthlyProgress: monthlyData
    };
  }, [filteredObrasByDate]);

  const filteredObras = useMemo(() => {
    if (!searchQuery.trim()) return filteredObrasByDate;

    const query = searchQuery.toLowerCase();
    return filteredObrasByDate.filter((obra: Obra) =>
      obra.nombre?.toLowerCase().includes(query) ||
      obra.localidad?.toLowerCase().includes(query) ||
      obra.departamento?.toLowerCase().includes(query) ||
      obra.empresaAdjudicada?.toLowerCase().includes(query)
    );
  }, [filteredObrasByDate, searchQuery]);

  // Stats Badge Component
  const StatBadge = ({ stat }: { stat: StatsWithComparison }) => {
    if (stat.trend === 'neutral') return null;

    const formattedPreviousValue = typeof stat.previousValue === 'number' && stat.previousValue > 1000
      ? stat.previousValue.toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      : stat.previousValue.toLocaleString('es-AR');

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant={stat.trend === 'up' ? 'secondary' : 'destructive'}
              className={`ml-2 flex items-center gap-1 cursor-help ${stat.trend === 'up'
                ? 'bg-emerald-100 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-700 dark:text-emerald-100'
                : ''
                }`}
            >
              {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(stat.percentageChange).toFixed(1)}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="flex flex-col gap-1">
            <p className="font-medium">Comparación con {stat.periodLabel}</p>
            <p className="text-sm text-muted-foreground">
              Valor anterior: {formattedPreviousValue}
            </p>
            <p className="text-xs text-muted-foreground">
              {stat.trend === 'up' ? 'Incremento' : 'Decremento'} de {Math.abs(stat.percentageChange).toFixed(1)}%
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (error) {
    return <div className="flex items-center justify-center min-h-screen">Error loading obras: {error.message}</div>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container space-y-6 w-full max-w-full flex flex-1 flex-col h-full mb-4 bg-white rounded-3xl shadow-[0_0_0px_5px_#bcc5e81c,_0_0_0px_2px_#dfe0e4_] px-8 pt-10">
      <Tabs defaultValue="reporte" className="h-full">
        <div className="flex justify-end items-between">
          {/* <h1 className="text-3xl font-bold text-muted-foreground">Dashboard de Obras</h1> */}

        </div>

        <TabsContent value="obras" className="bg-containerBackground h-full mt-0 -mx-8">
          <div className="flex flex-col gap-4 bg-containerBackground h-full">
            {/* Stats Cards */}
            <div className="flex gap-4 justify-between bg-white px-8 pb-4 ">
              <div className="col-span-5">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <CardTitle className="text-lg font-medium">Total Inversión</CardTitle>
                    {stats && <StatBadge stat={stats.totalMoney} />}
                  </div>
                  <div className="text-5xl font-bold">
                    ${stats?.totalMoney.value.toLocaleString('es-AR')}
                  </div>
                  <div className="flex items-center gap-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      <TabsList>
                        <TabsTrigger value="reporte">Reporte</TabsTrigger>
                        <TabsTrigger value="estadisticas">Tabla</TabsTrigger>
                        <TabsTrigger value="obras">Graficos</TabsTrigger>
                      </TabsList>
                    </motion.div>


                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="flex items-center gap-2">
                          <CalendarRange className="h-4 w-4" />
                          {selectedPreset || "Filtrar por fecha"}
                          {dateRange?.from && (
                            <>
                              <Separator orientation="vertical" className="h-8 shadow" />
                              <span className="text-sm text-muted-foreground">
                                {format(dateRange.from, "MMM yyyy", { locale: es })[0].toUpperCase() + format(dateRange.from, "MMM yyyy", { locale: es }).slice(1)}
                                {dateRange.to && ` - ${format(dateRange.to, "MMM yyyy", { locale: es })[0].toUpperCase() + format(dateRange.to, "MMM yyyy", { locale: es }).slice(1)}`}
                              </span>
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuLabel>Filtros predefinidos</DropdownMenuLabel>
                        {presets.map((preset) => (
                          <DropdownMenuItem
                            key={preset.label}
                            onClick={() => {
                              setDateRange(preset.getDates());
                              setSelectedPreset(preset.label);
                            }}
                          >
                            {preset.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <div className="p-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarRange className="mr-2 h-4 w-4" />
                                Personalizado
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <CalendarComponent
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={(range) => {
                                  setDateRange(range);
                                  setSelectedPreset(null);
                                }}
                                numberOfMonths={2}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setDateRange(undefined);
                          setSelectedPreset(null);
                        }}>
                          Limpiar filtro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="min-w-[320px]"
                >
                  <Card className="rounded-2xl">
                    <CardContent className="flex flex-row items-center justify-between space-y-0 py-6">
                      <div className="flex flex-row items-center gap-2 bg-containerBackground rounded-xl p-3 border shadow-[inset_0_1px_0_#fff,0_0_0_1px_#8d8d8d4a,0_2px_7px_0px_#79797914] ">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center">
                          <CardTitle className="text-sm font-medium">Total Obras</CardTitle>
                          {stats && <StatBadge stat={stats.totalObras} />}
                        </div>
                        <div className="text-2xl font-bold">{stats?.totalObras.value}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="min-w-[320px]"
                >
                  <Card className="rounded-2xl">
                    <CardContent className="flex flex-row items-center justify-between space-y-0 py-6">
                      <div className="flex flex-row items-center gap-2 bg-containerBackground rounded-xl p-3 border shadow-[inset_0_1px_0_#fff,0_0_0_1px_#8d8d8d4a,0_2px_7px_0px_#79797914] ">
                        <CircleDollarSign className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center">
                          <CardTitle className="text-sm font-medium">Promedio por Obra</CardTitle>
                          {stats && <StatBadge stat={stats.averageMoney} />}
                        </div>
                        <div className="text-2xl font-bold">
                          {stats?.averageMoney.value.toLocaleString('es-AR', {
                            style: 'currency',
                            currency: 'ARS',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="min-w-[320px]"
                >
                  <Card className="rounded-2xl">
                    <CardContent className="flex flex-row items-center justify-between space-y-0 py-6">
                      <div className="flex flex-row items-center gap-2 bg-containerBackground rounded-xl p-3 border shadow-[inset_0_1px_0_#fff,0_0_0_1px_#8d8d8d4a,0_2px_7px_0px_#79797914] ">
                        <Activity className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center">
                          <CardTitle className="text-sm font-medium">Obras Activas</CardTitle>
                          {stats && <StatBadge stat={stats.activeObras} />}
                        </div>
                        <div className="text-2xl font-bold">{stats?.activeObras.value}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>

            {/* Enhanced Charts Grid */}
            <div className="grid grid-cols-12 grid-rows-2 gap-4 max-h-[500px] rounded-2xl p-4">
              <div className="col-span-3 row-span-2 gap-4 h-full">
                <ObraTimeline obras={filteredObras} />
              </div>
              <div className="col-span-9 row-span-1 grid grid-cols-2 gap-4">
                <Card className="shadow-sm border-gray-100">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm font-medium text-gray-700">Progreso Mensual</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData.monthlyProgress}
                          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                          barSize={12}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10 }}
                            axisLine={{ stroke: "#e5e7eb" }}
                            tickLine={false}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10 }}
                            width={25}
                          />
                          <RechartsTooltip
                            contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
                            itemStyle={{ padding: 0 }}
                          />
                          <Legend
                            verticalAlign="top"
                            height={30}
                            iconSize={8}
                            wrapperStyle={{ fontSize: '10px' }}
                          />
                          <Bar
                            name="Iniciadas"
                            dataKey="iniciadas"
                            fill={COLORS.charts.primary}
                            radius={[2, 2, 0, 0]}
                          />
                          <Bar
                            name="Terminadas"
                            dataKey="terminadas"
                            fill={COLORS.charts.secondary}
                            radius={[2, 2, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Investment Timeline */}
                <Card className="shadow-sm border-gray-100">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm font-medium text-gray-700">Inversión por Año</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData.timelineData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis
                            dataKey="year"
                            tick={{ fontSize: 10 }}
                            axisLine={{ stroke: "#e5e7eb" }}
                            tickLine={false}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10 }}
                            tickFormatter={formatCurrency}
                            width={40}
                          />
                          <RechartsTooltip
                            formatter={(value: number) => [formatCurrency(value), 'Inversión']}
                            labelFormatter={(label: number) => `Año ${label}`}
                            contentStyle={{ fontSize: '11px', padding: '4px 8px' }}
                            itemStyle={{ padding: 0 }}
                          />
                          <defs>
                            <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.charts.primary} stopOpacity={0.8} />
                              <stop offset="95%" stopColor={COLORS.charts.primary} stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="investment"
                            stroke={COLORS.charts.primary}
                            fillOpacity={1}
                            fill="url(#colorInvestment)"
                            strokeWidth={1.5}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>


              {/* Recent Projects Table */}
              <div className="col-span-9 row-span-1">
                <Card className="shadow-sm border-gray-100">
                  <CardHeader className="p-3 pb-1">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium text-gray-700">Obras Recientes</CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs h-7 flex items-center gap-1 text-gray-500 hover:text-gray-800" asChild>
                        <Link href="#details">
                          Ver todas <ChevronRight size={14} />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="overflow-hidden rounded-sm border border-gray-100">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left py-2 px-3 font-medium text-gray-500">Nombre</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-500">Localidad</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-500">Estado</th>
                            <th className="text-right py-2 px-3 font-medium text-gray-500">Inversión</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredObras.slice(0, 4).map((obra, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-3 max-w-xs truncate">{obra.nombre || "Sin nombre"}</td>
                              <td className="py-2 px-3">{obra.localidad || "N/A"}</td>
                              <td className="py-2 px-3">
                                <Badge
                                  className={
                                    obra.avance === "Terminada" ? "bg-green-50 text-green-700 hover:bg-green-50 border-green-100" :
                                      obra.avance === "En Ejecución" ? "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100" :
                                        "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-100"
                                  }
                                >
                                  {obra.avance || "Sin estado"}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-right font-medium">
                                {obra.montoContrato ? obra.montoContrato : "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div >

        </TabsContent >

        <TabsContent value="estadisticas" className="bg-containerBackground h-full mt-0 -mx-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 bg-white px-8 pb-4">
              <div className="flex items-start space-x-2 w-1/4">
                <div>
                  <h1 className="font-bold text-4xl text-gray-800 flex items-center gap-4">DPO
                    <Separator className=" bg-gray-400 h-8 w-1" orientation="vertical" />
                    <span className="text-lg text-gray-500">Dirección</span>
                  </h1>
                  <p className="text-lg text-gray-500 w-2/3">Dirección de Planificación y Obras</p>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    <TabsList>
                      <TabsTrigger value="reporte">Reporte</TabsTrigger>
                      <TabsTrigger value="estadisticas">Tabla</TabsTrigger>
                      <TabsTrigger value="obras">Graficos</TabsTrigger>
                    </TabsList>
                  </motion.div>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 gap-4 mx-8 border shadow rounded-2xl overflow-hidden">
              {/* <ObraTimeline obras={filteredObras} /> */}
              <ObrasTable
                data={filteredObras}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                estados={ESTADOS}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reporte" className="mt-0 p-0">

          <ObrasReporte filteredObras={filteredObras} />
        </TabsContent>

      </Tabs >

    </div >
  );
}
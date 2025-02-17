// app/obras/[id]/ObraPage.tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, m } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ClipboardPenLineIcon, ClipboardPen, PlusIcon, Stamp, FileBadgeIcon, FileChartPieIcon, House, PanelsTopLeft, Box } from 'lucide-react';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import PresupuestosSelector from './PresupuestosSelector';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isArray } from 'lodash';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { format, addMonths, isBefore, isAfter, startOfMonth, isSameMonth, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { useMediciones } from "@/hooks/useMediciones";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import ExpandingButton from '@/components/ExpandingButton';
import useMeasure from 'react-use-measure';
import { CalendarIcon } from "lucide-react";
import CertificadoCreateClient from './create/certificado/CertificadoCreateClient';
import type { TableItem } from "@/app/presupuesto/types";
import type { Presupuesto } from "@/app/presupuesto/hooks/usePresupuestoData";

interface Obra {
  id: number;
  nombre: string;
  ubicacion: string;
  empresa: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: string | null;
  created_at: string;
  updated_at: string;
}

interface Medicion {
  id: number;
  month: string;
  measurements: Record<string, {
    monthlyProgress: number;
    cumulativePrevious: number;
    cumulativeCurrent: number;
  }>;
  obra_id: number;
}

interface MedicionInput {
  id: number;
  obra_id: number;
  periodo: string;
  data: {
    secciones: Array<{
      nombre: string;
      items: Array<{
        id: string;
        anterior: number;
        presente: number;
        acumulado: number;
      }>;
    }>;
  };
  created_at: string;
  updated_at: string;
}

interface Certificado {
  id: number;
  obra_id: number;
  medicion_id: number;
  periodo: string;
  data: {
    editedData: Record<string, any>;
    presupuestoData: Record<string, any>;
    progress: Array<{
      month: string;
      value1: number;
      value2: number;
      value3: number;
    }>;
  };
  created_at: string;
}

interface ObraPageProps {
  id: string;
  initialObra: Obra;
  initialPresupuestos: Presupuesto[];
}

export default function ObraPage({ id, initialObra, initialPresupuestos }: ObraPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current tab from URL or default to 'overview'
  const currentTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState("idle");
  const [feedback, setFeedback] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const { prefetchMediciones, prefetchPresupuesto } = usePrefetch();
  const [latestPresupuestoId, setLatestPresupuestoId] = useState<number | null>(null);
  const [isPresupuestoDialogOpen, setIsPresupuestoDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Date | null>(null);
  const [selectedPresupuestoId, setSelectedPresupuestoId] = useState<number | null>(null);
  const [isCertificadoDialogOpen, setIsCertificadoDialogOpen] = useState(false);
  const [selectedPresupuestoForCertificado, setSelectedPresupuestoForCertificado] = useState<number | null>(null);
  const [selectedMedicionForCertificado, setSelectedMedicionForCertificado] = useState<number | null>(null);
  const [selectedCertificadoId, setSelectedCertificadoId] = useState<number | null>(null);

  // Use the server-provided data
  const { data: obra } = useQuery({
    queryKey: ['obra', id],
    queryFn: () => Promise.resolve(initialObra),
    initialData: initialObra
  });

  // Use the server-provided presupuestos data
  const { data: presupuestos } = useQuery({
    queryKey: ['presupuestos', id],
    queryFn: () => Promise.resolve(initialPresupuestos),
    initialData: initialPresupuestos
  });

  const { data: mediciones } = useMediciones(Number(id));

  // Add certificados fetching
  const { data: certificados } = useQuery({
    queryKey: ['certificados', id],
    queryFn: async () => {
      const response = await fetch(`/api/certificados?obraId=${id}`);
      if (!response.ok) throw new Error('Failed to fetch certificados');
      return response.json();
    }
  });

  console.log("aca", { certificados });

  // When presupuestos data is available, update the latest presupuesto id.
  useEffect(() => {
    if (presupuestos && presupuestos.length > 0) {
      const latestPresupuesto = presupuestos[presupuestos.length - 1]
      setLatestPresupuestoId(latestPresupuesto?.id || null)
    }
  }, [presupuestos])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setFormState("idle");
        setFeedback("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCreateMedicion = () => {
    if (presupuestos.length === 0) {
      alert('No hay presupuestos disponibles. Por favor, cree un presupuesto primero.');
      return;
    }
    setIsPresupuestoDialogOpen(true);
  };

  const handleCreateCertificado = () => {
    if (presupuestos.length === 0) {
      alert('No hay presupuestos disponibles. Por favor, cree un presupuesto primero.');
      return;
    }
    setIsCertificadoDialogOpen(true);
  };

  const handleCertificadoContinue = () => {
    if (!selectedPresupuestoForCertificado) {
      alert("Por favor seleccione un presupuesto");
      return;
    }

    if (!selectedMedicionForCertificado) {
      alert("Por favor seleccione una medición");
      return;
    }

    router.push(
      `/obras/${obra.id}/create/certificado?presupuestoId=${selectedPresupuestoForCertificado}&medicionId=${selectedMedicionForCertificado}`
    );
    setIsCertificadoDialogOpen(false);
  };

  // Get all months between start and end date
  const getMonthsInRange = () => {
    console.log('obra', obra);
    console.log('obra.fecha_inicio', obra.fecha_inicio);
    console.log('obra.fecha_fin', obra.fecha_fin);
    if (!obra.fecha_inicio || !obra.fecha_fin) return [];

    const months = [];
    let currentMonth = startOfMonth(new Date(obra.fecha_inicio));
    const endDate = startOfMonth(new Date(obra.fecha_fin));

    while (isBefore(currentMonth, endDate) || isSameMonth(currentMonth, endDate)) {
      // Create a Date in UTC at midnight
      const utcMidnight = new Date(Date.UTC(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        currentMonth.getDate() + 1
      ));


      // Convert to "YYYY-MM-DDT00:00:00+00:00"
      let isoString = utcMidnight.toISOString();   // e.g. "2024-01-01T00:00:00.000Z"
      isoString = isoString.replace('.000Z', '+00:00'); // => "2024-01-01T00:00:00+00:00"

      months.push(isoString);
      currentMonth = addMonths(currentMonth, 1);
    }

    return months;
  };

  // Get the next available month for medicion
  const getNextAvailableMonth = () => {
    if (!mediciones) return obra.fecha_inicio ? new Date(obra.fecha_inicio) : null;

    const sortedMediciones = [...mediciones].sort((a, b) =>
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    if (sortedMediciones.length === 0) {
      return obra.fecha_inicio ? new Date(obra.fecha_inicio) : null;
    }

    const lastMedicionDate = sortedMediciones[sortedMediciones.length - 1].month;
    if (!lastMedicionDate) return null;

    const [lastYear, lastMonth] = lastMedicionDate.split('-').map(Number);
    if (isNaN(lastYear) || isNaN(lastMonth)) return null;

    let nextMonth = lastMonth + 1;
    let nextYear = lastYear;

    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    return new Date(nextYear, nextMonth, 1);
  };

  const handleContinue = () => {
    if (selectedPeriod && selectedPresupuestoId) {
      router.push(
        `/obras/${obra.id}/create/medicion?presupuestoId=${selectedPresupuestoId}&periodo=${format(selectedPeriod, 'yyyy-MM-dd')}`
      );
      setIsPresupuestoDialogOpen(false);
    }
  };

  if (isArray(obra)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg">Obra not found</div>
      </div>
    );
  }

  console.log('selectedperiod', selectedPeriod)

  return (
    <div className="flex flex-col bg-muted/70 min-h-screen">
      <div className="flex-1 p-6">
        <Tabs
          defaultValue={currentTab}
          onValueChange={handleTabChange}
        >
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold">{obra.nombre}</h1>
              <p className="text-sm text-input/60 font-semibold">{obra.ubicacion}</p>
            </div>

            <ScrollArea>
              <TabsList className="mb-3">
                <TabsTrigger value="overview">
                  <House
                    className="-ms-0.5 me-1.5 opacity-60"
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="presupuestos"
                  className="group"
                  onMouseEnter={() => prefetchPresupuesto(obra.id)}
                >
                  <PanelsTopLeft
                    className="-ms-0.5 me-1.5 opacity-60"
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Presupuestos
                  <Badge className="ms-1.5 bg-primary/15 px-1 transition-opacity group-data-[state=inactive]:opacity-50">
                    {presupuestos.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="mediciones"
                  className="group"
                  onMouseEnter={() => prefetchMediciones(obra.id)}
                >
                  <Box
                    className="-ms-0.5 me-1.5 opacity-60"
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Mediciones
                  <Badge className="ms-1.5 transition-opacity group-data-[state=inactive]:opacity-50">
                    New
                  </Badge>
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                  <CardDescription>Basic details about the obra</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="font-medium">ID:</label>
                    <p>{obra.id}</p>
                  </div>
                  <div>
                    <label className="font-medium">Nombre:</label>
                    <p>{obra.nombre}</p>
                  </div>
                  <div>
                    <label className="font-medium">Ubicación:</label>
                    <p>{obra.ubicacion}</p>
                  </div>
                  <div>
                    <label className="font-medium">Empresa:</label>
                    <p>{obra.empresa}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status & Dates</CardTitle>
                  <CardDescription>Current status and important dates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="font-medium">Estado:</label>
                    <p>{obra.estado || 'No establecido'}</p>
                  </div>
                  <div>
                    <label className="font-medium">Fecha de Inicio:</label>
                    <p>{obra.fecha_inicio ? new Date(obra.fecha_inicio).toLocaleDateString() : 'No establecida'}</p>
                  </div>
                  <div>
                    <label className="font-medium">Fecha de Fin:</label>
                    <p>{obra.fecha_fin ? new Date(obra.fecha_fin).toLocaleDateString() : 'No establecida'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>System tracking information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium">Created At:</label>
                      <p>{new Date(obra.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="font-medium">Last Updated:</label>
                      <p>{new Date(obra.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <ExpandingButton width={390}>
              <div className="flex gap-2 px-4">
                <Button
                  variant="box"
                  className="h-28 w-28"
                  href={`/obras/${obra.id}/create/presupuesto`}
                >
                  <FileChartPieIcon className="!size-6" />
                  Presupuesto
                </Button>
                <Button
                  variant="box"
                  className="h-28 w-28"
                  onClick={handleCreateMedicion}
                >
                  <ClipboardPenLineIcon className="!size-6" />
                  Medicion
                </Button>
                <Button
                  variant="box"
                  className="h-28 w-28"
                  onClick={handleCreateCertificado}
                >
                  <FileBadgeIcon className="!size-6" />
                  Certificado
                </Button>
              </div>
            </ExpandingButton>

            {/* Presupuesto Selection Dialog */}
            <Dialog open={isPresupuestoDialogOpen} onOpenChange={setIsPresupuestoDialogOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Seleccionar Presupuesto y Periodo</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Periodos Disponibles</label>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border max-h-48">
                      <div className="grid grid-cols-4 gap-2 p-4">
                        {getMonthsInRange().map((date) => {
                          const monthStr = format(date, 'yyyy-MM-dd');
                          const isCompleted = mediciones?.some(m => {
                            return m.month?.split('-')[0] === date.split('-')[0] && m.month?.split('-')[1] === date.split('-')[1]
                          });
                          const nextAvailable = getNextAvailableMonth();
                          const isNext = nextAvailable && isSameMonth(date, nextAvailable);
                          const isFuture = nextAvailable && isAfter(date, nextAvailable);

                          return (
                            <button
                              key={monthStr}
                              onClick={() => {
                                if (isNext) {
                                  setSelectedPeriod(new Date(date));
                                }
                              }}
                              disabled={!isNext}
                              className={`
                          flex items-center justify-between px-4 py-2 rounded-lg text-sm
                          ${isCompleted
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : isNext
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                    : isFuture
                                      ? 'bg-gray-50 text-gray-400 border border-gray-200'
                                      : 'bg-white border'
                                }
                        `}
                            >
                              <span>{format(date, 'MMMM yyyy', { locale: es })}</span>
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : isNext ? (
                                selectedPeriod && isSameMonth(date, selectedPeriod) ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Circle className="w-4 h-4 text-blue-500" />
                                )
                              ) : (
                                <Lock className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <ScrollBar orientation="vertical" />
                    </ScrollArea>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seleccionar Presupuesto</label>
                    <RadioGroup
                      value={selectedPresupuestoId?.toString()}
                      onValueChange={(value) => setSelectedPresupuestoId(Number(value))}
                      className="space-y-2"
                    >
                      {presupuestos.map((presupuesto) => (
                        <div
                          key={presupuesto.id}
                          className={`
                      flex items-center space-x-2 rounded-lg border p-4 transition-colors
                      ${selectedPresupuestoId === presupuesto.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'}
                    `}
                        >
                          <RadioGroupItem
                            value={presupuesto.id.toString()}
                            id={`presupuesto-${presupuesto.id}`}
                          // disabled={!selectedPeriod}
                          />
                          <Label
                            htmlFor={`presupuesto-${presupuesto.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <ClipboardPenLineIcon className="w-5 h-5 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span className="font-medium">{presupuesto.nombre}</span>
                                <span className="text-sm text-muted-foreground">
                                  Total: ${presupuesto.total.toLocaleString('es-AR')}
                                </span>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={handleContinue}
                      disabled={!selectedPeriod || !selectedPresupuestoId}
                      className="w-full sm:w-auto"
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Certificado Selection Dialog */}
            <Dialog open={isCertificadoDialogOpen} onOpenChange={setIsCertificadoDialogOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Seleccionar Presupuesto y Medición para Certificado</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Seleccionar Presupuesto</label>
                    <RadioGroup
                      value={selectedPresupuestoForCertificado?.toString()}
                      onValueChange={(value) => setSelectedPresupuestoForCertificado(Number(value))}
                      className="space-y-2"
                    >
                      {presupuestos.map((presupuesto) => (
                        <div
                          key={presupuesto.id}
                          className={`
                            flex items-center space-x-2 rounded-lg border p-4 transition-colors
                            ${selectedPresupuestoForCertificado === presupuesto.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'}
                          `}
                        >
                          <RadioGroupItem
                            value={presupuesto.id.toString()}
                            id={`certificado-presupuesto-${presupuesto.id}`}
                          />
                          <Label
                            htmlFor={`certificado-presupuesto-${presupuesto.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <ClipboardPenLineIcon className="w-5 h-5 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span className="font-medium">{presupuesto.nombre}</span>
                                <span className="text-sm text-muted-foreground">
                                  Total: ${presupuesto.total.toLocaleString('es-AR')}
                                </span>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {selectedPresupuestoForCertificado && mediciones && mediciones.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Seleccionar Medición</label>
                      <RadioGroup
                        value={selectedMedicionForCertificado?.toString()}
                        onValueChange={(value) => setSelectedMedicionForCertificado(Number(value))}
                        className="space-y-2"
                      >
                        {mediciones.map((medicion) => {
                          const date = medicion.month.includes('T')
                            ? parseISO(medicion.month)
                            : new Date(medicion.month);

                          return (
                            <div
                              key={medicion.id}
                              className={`
                                flex items-center space-x-2 rounded-lg border p-4 transition-colors
                                ${selectedMedicionForCertificado === medicion.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'}
                              `}
                            >
                              <RadioGroupItem
                                value={medicion.id.toString()}
                                id={`certificado-medicion-${medicion.id}`}
                              />
                              <Label
                                htmlFor={`certificado-medicion-${medicion.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {format(date, 'MMMM yyyy', { locale: es })}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {Object.keys(medicion.measurements).length} items medidos
                                    </span>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={handleCertificadoContinue}
                      disabled={!selectedPresupuestoForCertificado || !selectedMedicionForCertificado}
                      className="w-full sm:w-auto"
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="presupuestos">
            <PresupuestosSelector
              obraId={obra.id.toString()}
              initialPresupuestos={presupuestos}
            />
          </TabsContent>

          <TabsContent value="mediciones">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Certificados de Obra</h2>
                <Button onClick={handleCreateCertificado}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Nuevo Certificado
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Certificados List */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Certificados</CardTitle>
                    <CardDescription>Seleccione un certificado para ver los detalles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px] w-full pr-4">
                      <RadioGroup
                        value={selectedCertificadoId?.toString()}
                        onValueChange={(value) => setSelectedCertificadoId(Number(value))}
                        className="space-y-2"
                      >
                        {certificados?.map((certificado: Certificado) => {
                          const date = parseISO(certificado.periodo);
                          return (
                            <div
                              key={certificado.id}
                              className={`
                                flex items-center space-x-2 rounded-lg border p-4 transition-colors cursor-pointer
                                ${selectedCertificadoId === certificado.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'}
                              `}
                            >
                              <RadioGroupItem
                                value={certificado.id.toString()}
                                id={`certificado-${certificado.id}`}
                              />
                              <Label
                                htmlFor={`certificado-${certificado.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Stamp className="w-5 h-5 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {format(date, 'MMMM yyyy', { locale: es })}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      Creado el {format(parseISO(certificado.created_at), 'dd/MM/yyyy')}
                                    </span>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          );
                        })}

                        {certificados?.length === 0 && (
                          <div className="text-center py-12 text-muted-foreground">
                            No hay certificados creados aún
                          </div>
                        )}
                      </RadioGroup>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Certificado Details */}
                <Card className="md:col-span-2">
                  <CardContent className="p-6">
                    {selectedCertificadoId && certificados ? (
                      (() => {
                        const certificado = certificados.find((c: Certificado) => c.id === selectedCertificadoId);
                        if (!certificado) return null;

                        const matchingMedicion = mediciones?.find(m => m.id === certificado.medicion_id);
                        if (!matchingMedicion) return null;

                        // Transform medicion to match MedicionInput type
                        const transformedMedicion: MedicionInput = {
                          id: matchingMedicion.id,
                          obra_id: Number(id),
                          periodo: matchingMedicion.month,
                          data: {
                            secciones: Object.entries(matchingMedicion.measurements).reduce((acc, [itemId, values]) => {
                              let sectionName = '';
                              const presupuestoData = certificado.data.presupuestoData;

                              for (const section of Object.keys(presupuestoData)) {
                                const items = presupuestoData[section];
                                if (items.some((item: { id: { toString: () => string } }) => item.id.toString() === itemId)) {
                                  sectionName = section;
                                  break;
                                }
                              }

                              let section = acc.find(s => s.nombre === sectionName);
                              if (!section) {
                                section = { nombre: sectionName, items: [] };
                                acc.push(section);
                              }

                              section.items.push({
                                id: itemId,
                                anterior: values.cumulativePrevious,
                                presente: values.monthlyProgress,
                                acumulado: values.cumulativeCurrent
                              });

                              return acc;
                            }, [] as MedicionInput['data']['secciones'])
                          },
                          created_at: certificado.created_at,
                          updated_at: certificado.created_at
                        };

                        return (
                          <CertificadoCreateClient
                            obraId={id}
                            obraName={obra.nombre}
                            presupuestoData={certificado.data.presupuestoData}
                            selectedMedicion={transformedMedicion}
                            fechaInicio={obra.fecha_inicio || ''}
                            fechaFin={obra.fecha_fin || ''}
                            obraData={certificado.data.editedData}
                            display={true}
                            certificado={certificado}
                          />
                        );
                      })()
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
                        <Stamp className="w-12 h-12 mb-4 opacity-20" />
                        <p>Seleccione un certificado para ver los detalles</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
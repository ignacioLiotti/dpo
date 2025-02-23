// app/obras/[id]/ObraPage.tsx
'use client';

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useObra } from "@/app/providers/ObraProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format, parseISO, startOfMonth, addMonths, isBefore, isAfter, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, FileText, FolderOpen, Plus as PlusIcon, CheckCircle2, Circle, Lock, Stamp, House, PanelsTopLeft, Box, ClipboardPenLineIcon, FileBadgeIcon, FileChartPieIcon } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ExpandingButton from '@/components/ExpandingButton';
import CertificadoCreateClient from './create/certificado/CertificadoCreateClient';
import type { Obra, Presupuesto, Medicion, Certificado, TableItem, MedicionInput } from '@/types';
import { usePrefetch } from '@/hooks/usePrefetch';
import PresupuestosSelector from "./PresupuestosSelector";

export default function ObraPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { state } = useObra();
  const { obra, presupuestos, mediciones, certificados, loading, error } = state;
  console.log('obra', obra)

  // Get current tab from URL or default to 'overview'
  const currentTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (value: string) => {
    // const params = new URLSearchParams(searchParams.toString());
    // params.set('tab', value);
    // router.push(`${pathname}?${params.toString()}`);
  };

  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [feedback, setFeedback] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  // const { prefetchMediciones, prefetchPresupuesto } = usePrefetch();
  const [latestPresupuestoId, setLatestPresupuestoId] = useState<string | null>(null);
  const [isPresupuestoDialogOpen, setIsPresupuestoDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Date | null>(null);
  const [selectedPresupuestoId, setSelectedPresupuestoId] = useState<string | null>(null);
  const [isCertificadoDialogOpen, setIsCertificadoDialogOpen] = useState(false);
  const [selectedPresupuestoForCertificado, setSelectedPresupuestoForCertificado] = useState<string | null>(null);
  const [selectedMedicionForCertificado, setSelectedMedicionForCertificado] = useState<string | null>(null);
  const [selectedCertificadoId, setSelectedCertificadoId] = useState<string | null>(null);

  // When presupuestos data is available, update the latest presupuesto id.
  useEffect(() => {
    if (presupuestos && presupuestos.length > 0) {
      const latestPresupuesto = presupuestos[presupuestos.length - 1];
      setLatestPresupuestoId(latestPresupuesto?.id?.toString() || null);
    }
  }, [presupuestos]);

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
    if (!presupuestos || presupuestos.length === 0) {
      alert('No hay presupuestos disponibles. Por favor, cree un presupuesto primero.');
      return;
    }
    setIsPresupuestoDialogOpen(true);
  };

  const handleCreateCertificado = () => {
    if (!presupuestos || presupuestos.length === 0) {
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

    if (!obra?.id) {
      alert("No se encontró la obra");
      return;
    }

    router.push(
      `/obras/${obra.id}/create/certificado?presupuestoId=${selectedPresupuestoForCertificado}&medicionId=${selectedMedicionForCertificado}`
    );
    setIsCertificadoDialogOpen(false);
  };

  // Get all months between start and end date
  const getMonthsInRange = () => {
    if (!obra?.fechaInicio || !obra?.fechaFin) return [];

    const months = [];
    let currentMonth = startOfMonth(new Date(obra.fechaInicio));
    const endDate = startOfMonth(new Date(obra.fechaFin));

    while (isBefore(currentMonth, endDate) || isSameMonth(currentMonth, endDate)) {
      const utcMidnight = new Date(Date.UTC(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        currentMonth.getDate() + 1
      ));

      let isoString = utcMidnight.toISOString();
      isoString = isoString.replace('.000Z', '+00:00');

      months.push(isoString);
      currentMonth = addMonths(currentMonth, 1);
    }

    return months;
  };

  const handleContinue = () => {
    if (!selectedPeriod || !selectedPresupuestoId || !obra?.id) {
      return;
    }

    router.push(
      `/obras/${obra.id}/create/medicion?presupuestoId=${selectedPresupuestoId}&periodo=${format(selectedPeriod, 'yyyy-MM-dd')}`
    );
    setIsPresupuestoDialogOpen(false);
  };

  // Update the created_at and updated_at handling
  const renderSystemInfo = () => {
    if (!obra) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-medium">Created At:</label>
          {/* @ts-ignore */}
          <p>  {obra.createdAt ? new Date(obra.createdAt).toLocaleString() : 'No disponible'}</p>
        </div>
        <div>
          <label className="font-medium">Last Updated:</label>
          {/* @ts-ignore */}
          <p>{obra.updatedAt ? new Date(obra.updatedAt).toLocaleString() : 'No disponible'}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!obra) {
    return <div>No se encontró la obra</div>;
  }

  return (
    <div className="container max-w-[100vw] mx-auto py-10">
      <div className="flex flex-col gap-8">
        <Tabs
          defaultValue={currentTab}
          onValueChange={handleTabChange}
        >
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2 max-w-[50%]">
              <h1 className="text-3xl font-semibold">{obra.nombre}</h1>
              <p className="text-sm text-input/60 font-semibold">{obra.localidad}, {obra.departamento}</p>
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
                  Vista General
                </TabsTrigger>
                <TabsTrigger
                  value="presupuestos"
                  className="group"
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
                  value="certificados"
                  className="group"
                >
                  <Box
                    className="-ms-0.5 me-1.5 opacity-60"
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Certificados
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
                  <div className="flex gap-2">
                    <label className="font-normal text-muted-foreground">ID:</label>
                    <p className="font-semibold">{obra.id}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-normal text-muted-foreground">Nombre:</label>
                    <p className="font-semibold text-lg">{obra.nombre}</p>
                  </div>
                  <div className="flex gap-2">
                    <label className="font-normal text-muted-foreground">Ubicación:</label>
                    <p className="font-semibold">{obra.localidad}, {obra.departamento}</p>
                  </div>
                  <div className="flex gap-2">
                    <label className="font-normal text-muted-foreground">Empresa:</label>
                    <p className="font-semibold">{obra.empresaAdjudicada}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status & Dates</CardTitle>
                  <CardDescription>Current status and important dates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <label className="font-normal text-muted-foreground">Estado:</label>
                    {/* @ts-ignore */}
                    <p className="font-semibold">{obra.estado || 'No establecido'}</p>
                  </div>
                  <div className="flex gap-2">
                    <label className="font-normal text-muted-foreground">Fecha de Inicio:</label>
                    <p className="font-semibold">{obra.fechaInicio ? obra.fechaInicio : 'No establecida'}</p>
                  </div>
                  <div className="flex gap-2">
                    <label className="font-normal text-muted-foreground">Fecha de Fin:</label>
                    <p className="font-semibold">{obra.fechaFin ? obra.fechaFin : 'No establecida'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>System tracking information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderSystemInfo()}
                </CardContent>
              </Card>
            </div>
            <ExpandingButton width={390}>
              <div className="flex gap-2 px-4">
                <Button
                  variant="box"
                  className="h-28 w-28"
                  href={`/?obraId=${obra.id}`}
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
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border max-h-48 overflow-visible">
                      <div className="grid grid-cols-4 gap-2 p-4">
                        {getMonthsInRange().map((date) => {
                          const monthStr = format(date, 'yyyy-MM-dd');

                          console.log(mediciones)

                          // Find the last completed month from mediciones
                          const sortedMediciones = mediciones?.sort((a, b) =>
                            new Date(a.periodo).getTime() - new Date(b.periodo).getTime()
                          ) || [];

                          const lastCompletedDate = sortedMediciones.length > 0
                            ? sortedMediciones[sortedMediciones.length - 1].periodo
                            : null;

                          // Check if this month is completed
                          const isCompleted = mediciones?.some(m => {
                            const monthMatch = m.periodo?.split('-')[0] === date.split('-')[0] &&
                              m.periodo?.split('-')[1] === date.split('-')[1];
                            return monthMatch;
                          });

                          // This month is next if:
                          // 1. No completed months exist and this is the first month, OR
                          // 2. This is the month after the last completed month

                          const isNext = !lastCompletedDate
                            ? date === getMonthsInRange()[0] // First month if no completions
                            : lastCompletedDate.split('-')[0] === date.split('-')[0] &&
                            Number(lastCompletedDate.split('-')[1]) + 1 === Number(date.split('-')[1]); // Next month after last completion

                          // Future months are any months after the next available month
                          const isFuture = lastCompletedDate
                            ? isAfter(date, addMonths(lastCompletedDate, 1))
                            : isAfter(date, new Date(getMonthsInRange()[0]));

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
                      value={selectedPresupuestoId || undefined}
                      onValueChange={(value) => setSelectedPresupuestoId(value)}
                      className="space-y-2"
                    >
                      {presupuestos.map((presupuesto) => (
                        <div
                          key={presupuesto.id}
                          className={`
                      flex items-center space-x-2 rounded-lg border p-4 transition-colors
                      ${selectedPresupuestoId === presupuesto.id.toString() ? 'bg-muted border-primary' : 'hover:bg-muted/50'}
                    `}
                        >
                          <RadioGroupItem
                            value={presupuesto.id.toString()}
                            id={`presupuesto-${presupuesto.id}`}
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
                  <div className="space-y-2 overflow-y-auto max-h-[300px]">
                    <label className="text-sm font-medium">Seleccionar Presupuesto</label>
                    <RadioGroup
                      value={selectedPresupuestoForCertificado || undefined}
                      onValueChange={(value) => setSelectedPresupuestoForCertificado(value)}
                      className="space-y-2"
                    >
                      {presupuestos.map((presupuesto) => (
                        <div
                          key={presupuesto.id}
                          className={`
                            flex items-center space-x-2 rounded-lg border p-4 transition-colors
                            ${selectedPresupuestoForCertificado === presupuesto.id.toString() ? 'bg-muted border-primary' : 'hover:bg-muted/50'}
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
                    <div className="space-y-2 overflow-y-auto max-h-[300px]">
                      <label className="text-sm font-medium">Seleccionar Medición</label>
                      <RadioGroup
                        value={selectedMedicionForCertificado || undefined}
                        onValueChange={(value) => setSelectedMedicionForCertificado(value)}
                        className="space-y-2"
                      >
                        {mediciones.map((medicion) => {
                          console.log('medicion', medicion)
                          const date = medicion.periodo.includes('T')
                            ? parseISO(medicion.periodo)
                            : new Date(medicion.periodo);

                          return (
                            <div
                              key={medicion.id}
                              className={`
                                flex items-center space-x-2 rounded-lg border p-4 transition-colors
                                ${selectedMedicionForCertificado === medicion.id.toString() ? 'bg-muted border-primary' : 'hover:bg-muted/50'}
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
                                      {Object.keys(medicion.data.secciones).length} items medidos
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
            {/* <PresupuestoEditor
              obraId={obra?.id.toString()}
              presupuestoData={presupuestos.length > 0 ? presupuestos[presupuestos.length - 1].data : {}}
              allElements={[]}
              obraData={obra || undefined}
              display={false}
            /> */}
            <PresupuestosSelector
              obraId={obra?.id.toString()}
            />
          </TabsContent>

          <TabsContent value="certificados">
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
                        value={selectedCertificadoId || undefined}
                        onValueChange={(value) => setSelectedCertificadoId(value)}
                        className="space-y-2"
                      >
                        {certificados?.map((certificado: Certificado) => {
                          const date = parseISO(certificado.periodo);
                          return (
                            <div
                              key={certificado.id}
                              className={`
                                flex items-center space-x-2 rounded-lg border p-4 transition-colors cursor-pointer
                                ${selectedCertificadoId === certificado.id.toString() ? 'bg-muted border-primary' : 'hover:bg-muted/50'}
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
                        const certificado = certificados.find((c: Certificado) => c.id.toString() === selectedCertificadoId);
                        if (!certificado) return null;

                        const matchingMedicion = mediciones?.find(m => m.id === certificado.medicion_id);

                        if (!matchingMedicion) return null;

                        const obraData = typeof certificado.data.editedData === 'object' ? certificado.data.editedData : JSON.parse(certificado.data.editedData);

                        console.log('obraData', certificado)

                        return (
                          <CertificadoCreateClient
                            obraId={obra.id.toString()}
                            obraName={obra.nombre}
                            presupuestoData={certificado.data.presupuestoData}
                            selectedMedicion={matchingMedicion}
                            fechaInicio={obra.fechaInicio || ''}
                            fechaFin={obra.fechaFin || ''}
                            obraData={obraData}
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
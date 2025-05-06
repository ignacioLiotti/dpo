// app/(sidebar)/obras/[id]/ObraPage.tsx
'use client';

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
// import { useObra } from "@/app/providers/ObraProvider"; // Remove this
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format, parseISO, startOfMonth, addMonths, isBefore, isAfter, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Circle, Lock, Stamp, House, PanelsTopLeft, Box, ClipboardPenLineIcon, FileBadgeIcon, FileChartPieIcon, MapPin, FileText, Building2, DollarSign, CalendarDays, Clock, UserCog, HardHat } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ExpandingButton from '@/components/ExpandingButton';
import CertificadoCreateClient from './create/certificado/CertificadoCreateClient';
// import type { Certificado } from '@/types'; // Keep if needed, or use prop type
import PresupuestosSelector from "./PresupuestosSelector";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
// import { Skeleton } from "@/components/ui/skeleton"; // Remove if not needed
import { TooltipContent, Tooltip, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// TODO: Replace 'any' with actual imported types
interface ObraPageProps {
  obra: any;
  presupuestos: any[];
  mediciones: any[];
  certificados: any[];
}

export default function ObraPage({ obra, presupuestos, mediciones, certificados }: ObraPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // const { state } = useObra(); // Removed
  // const { obra, presupuestos, mediciones, certificados, loading, error } = state; // Removed, use props directly
  console.log('obra prop:', obra) // Log received prop

  // Get current tab from URL or default to 'overview'
  const currentTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    // Update URL without full navigation if desired, or keep as is
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [feedback, setFeedback] = useState("");
  const ref = useRef<HTMLDivElement>(null);
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
    if (certificados && certificados.length > 0) {
      setSelectedCertificadoId(certificados[certificados.length - 1]?.id?.toString())
    }
  }, [certificados])

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
    // Also check for mediciones
    if (!mediciones || mediciones.length === 0) {
      alert('No hay mediciones disponibles. Por favor, cree una medición primero.');
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

    // Use optional chaining and provide fallbacks
    const createdAt = obra.createdAt || obra.created_at;
    const updatedAt = obra.updatedAt || obra.updated_at;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-muted-foreground">
        <div>
          <label className="font-medium text-foreground">Created At:</label>
          <p>{createdAt ? new Date(createdAt).toLocaleString() : 'No disponible'}</p>
        </div>
        <div>
          <label className="font-medium text-foreground">Last Updated:</label>
          <p>{updatedAt ? new Date(updatedAt).toLocaleString() : 'No disponible'}</p>
        </div>
      </div>
    );
  };

  // Remove the loading skeleton rendering logic
  // if (loading) { ... }

  return (
    <div className="mx-auto flex flex-col gap-8 px-8 pt-6 pb-12 bg-card rounded-lg shadow-sm w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">{obra?.nombre || 'Detalles de Obra'}</h1>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin size={16} /> {obra?.localidad || 'Ubicación no disponible'}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Example Action Button - Navigate to Edit Page */}
          <Button variant="outline" onClick={() => router.push(`/obras/${obra.id}/edit`)}>
            <UserCog className="mr-2 h-4 w-4" /> Editar Obra
          </Button>
          {/* Add other actions like Print, etc. */}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <ScrollArea className="w-full whitespace-nowrap border-b">
          <TabsList className="inline-flex h-auto p-1">
            <TabsTrigger value="overview" className="flex items-center gap-1"><PanelsTopLeft size={16} /> General</TabsTrigger>
            <TabsTrigger value="presupuestos" className="flex items-center gap-1"><FileChartPieIcon size={16} /> Presupuestos ({presupuestos?.length || 0})</TabsTrigger>
            <TabsTrigger value="mediciones" className="flex items-center gap-1"><ClipboardPenLineIcon size={16} /> Mediciones ({mediciones?.length || 0})</TabsTrigger>
            <TabsTrigger value="certificados" className="flex items-center gap-1"><FileBadgeIcon size={16} /> Certificados ({certificados?.length || 0})</TabsTrigger>
            {/* Add other tabs here */}
            <TabsTrigger value="details" className="flex items-center gap-1"><FileText size={16} /> Detalles</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Tab Content */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="overview" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PanelsTopLeft /> Resumen General</CardTitle>
                    <CardDescription>Información clave y estado de la obra.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Use grid for better layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2"><strong className="w-28 inline-block">Expediente:</strong> {obra?.expte || '-'}</div>
                      <div className="flex items-center gap-2"><strong className="w-28 inline-block">Empresa:</strong> {obra?.empresaAdjudicada || '-'}</div>
                      <div className="flex items-center gap-2"><strong className="w-28 inline-block">Monto Contrato:</strong> {obra?.montoContrato ? `$${parseFloat(obra.montoContrato).toLocaleString()}` : '-'}</div>
                      <div className="flex items-center gap-2"><strong className="w-28 inline-block">Fecha Inicio:</strong> {obra?.fechaInicio ? format(parseISO(obra.fechaInicio), 'dd/MM/yyyy') : '-'}</div>
                      <div className="flex items-center gap-2"><strong className="w-28 inline-block">Fecha Fin:</strong> {obra?.fechaFin ? format(parseISO(obra.fechaFin), 'dd/MM/yyyy') : '-'}</div>
                      <div className="flex items-center gap-2"><strong className="w-28 inline-block">Plazo:</strong> {obra?.plazo || '-'} días</div>
                      {/* Add more relevant overview fields */}
                    </div>
                    <Separator className="my-4" />
                    <h4 className="font-medium text-base mb-2">Descripción</h4>
                    <p className="text-muted-foreground text-sm">{obra?.memoriaDesc || 'No hay descripción disponible.'}</p>

                    {renderSystemInfo()}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="presupuestos" className="mt-0">
                <Card>
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2"><FileChartPieIcon /> Presupuestos</CardTitle>
                      <CardDescription>Gestionar los presupuestos del proyecto.</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => router.push(`/obras/${obra.id}/create/presupuesto`)}>
                      <Box className="mr-2 h-4 w-4" /> Crear Presupuesto
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {presupuestos?.length > 0 ? (
                      <ul className="space-y-2">
                        {presupuestos.map((p: any) => (
                          <li key={p.id} className="border p-3 rounded-md flex justify-between items-center text-sm">
                            <span>{p.nombre || `Presupuesto ${p.id}`} (Versión: {p.version || 'N/A'})</span>
                            {/* Add View/Edit buttons if needed */}
                            <Button variant="outline" size="sm" onClick={() => router.push(`/obras/${obra.id}/presupuestos/${p.id}`)}>Ver</Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No se encontraron presupuestos.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mediciones" className="mt-0">
                <Card>
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2"><ClipboardPenLineIcon /> Mediciones</CardTitle>
                      <CardDescription>Registrar y seguir el avance de las mediciones.</CardDescription>
                    </div>
                    <Button size="sm" onClick={handleCreateMedicion} disabled={!presupuestos || presupuestos.length === 0}>
                      <Box className="mr-2 h-4 w-4" /> Crear Medición
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {mediciones?.length > 0 ? (
                      <ul className="space-y-2">
                        {mediciones.map((m: any) => (
                          <li key={m.id} className="border p-3 rounded-md flex justify-between items-center text-sm">
                            <span>Medición ID: {m.id} - Periodo: {m.periodo ? format(parseISO(m.periodo), 'MM/yyyy', { locale: es }) : 'N/A'}</span>
                            {/* Add View/Edit buttons if needed */}
                            <Button variant="outline" size="sm" onClick={() => router.push(`/obras/${obra.id}/mediciones/${m.id}`)}>Ver</Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No se encontraron mediciones.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certificados" className="mt-0">
                <Card>
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2"><FileBadgeIcon /> Certificados</CardTitle>
                      <CardDescription>Gestionar los certificados de avance de obra.</CardDescription>
                    </div>
                    <Button size="sm" onClick={handleCreateCertificado} disabled={!presupuestos || presupuestos.length === 0 || !mediciones || mediciones.length === 0}>
                      <Box className="mr-2 h-4 w-4" /> Crear Certificado
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {certificados?.length > 0 ? (
                      <ul className="space-y-2">
                        {certificados.map((c: any) => (
                          <li key={c.id} className="border p-3 rounded-md flex justify-between items-center text-sm">
                            <span>Certificado N°: {c.numero_certificado || c.id} - Fecha: {c.fecha_certificado ? format(parseISO(c.fecha_certificado), 'dd/MM/yyyy') : 'N/A'}</span>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/obras/${obra.id}/certificados/${c.id}`)}>Ver</Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No se encontraron certificados.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> Detalles Adicionales</CardTitle>
                    <CardDescription>Información contractual y técnica.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {/* Example: Grid layout for details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Modalidad</Label>
                        <p>{obra?.modalidad || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Clasificación</Label>
                        <p>{obra?.clasificacion || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Presupuesto Oficial</Label>
                        <p>{obra?.presupuestoOficial ? `$${parseFloat(obra.presupuestoOficial).toLocaleString()}` : '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Número Licitación</Label>
                        <p>{obra?.numeroLicitacion || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Fecha Licitación</Label>
                        <p>{obra?.fechaLicitacion ? format(parseISO(obra.fechaLicitacion), 'dd/MM/yyyy') : '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Fecha Adjudicación</Label>
                        <p>{obra?.fechaAdjudicacion ? format(parseISO(obra.fechaAdjudicacion), 'dd/MM/yyyy') : '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Fecha Contrato</Label>
                        <p>{obra?.fechaContrato ? format(parseISO(obra.fechaContrato), 'dd/MM/yyyy') : '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Inspectores</Label>
                        <p>{obra?.inspectores || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Proyectista</Label>
                        <p>{obra?.proyectista || '-'}</p>
                      </div>
                      {/* Add more fields as needed */}
                    </div>
                    <Separator className="my-6" />
                    <h4 className="font-medium text-base mb-2">Observaciones</h4>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{obra?.observaciones || 'No hay observaciones.'}</p>
                  </CardContent>
                </Card>
              </TabsContent>

            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs>

      {/* Dialog for selecting presupuesto for Medicion creation */}
      <Dialog open={isPresupuestoDialogOpen} onOpenChange={setIsPresupuestoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Medición</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <PresupuestosSelector
              presupuestos={presupuestos || []}
              selectedPresupuestoId={selectedPresupuestoId}
              onSelectPresupuesto={setSelectedPresupuestoId}
            />
            <div>
              <Label>Seleccione el Periodo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal mt-1"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedPeriod ? format(selectedPeriod, "MMMM yyyy", { locale: es }) : <span>Seleccione un mes</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  {/* Simple month selector - replace with a proper Calendar if needed */}
                  <ScrollArea className="h-72">
                    <div className="grid gap-2 p-2">
                      {getMonthsInRange().map((monthIso) => {
                        const monthDate = parseISO(monthIso);
                        return (
                          <Button
                            key={monthIso}
                            variant={selectedPeriod && isSameMonth(monthDate, selectedPeriod) ? "default" : "ghost"}
                            onClick={() => setSelectedPeriod(monthDate)}
                            className="w-full justify-start"
                          >
                            {format(monthDate, "MMMM yyyy", { locale: es })}
                          </Button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleContinue} disabled={!selectedPeriod || !selectedPresupuestoId} className="w-full">
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for selecting presupuesto/medicion for Certificado creation */}
      <Dialog open={isCertificadoDialogOpen} onOpenChange={setIsCertificadoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Certificado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <PresupuestosSelector
              presupuestos={presupuestos || []}
              selectedPresupuestoId={selectedPresupuestoForCertificado}
              onSelectPresupuesto={setSelectedPresupuestoForCertificado}
            />
            {/* Selector for Medicion (based on selected Presupuesto?) */}
            <div>
              <Label>Seleccione la Medición</Label>
              <Select
                onValueChange={setSelectedMedicionForCertificado}
                value={selectedMedicionForCertificado || undefined}
                disabled={!selectedPresupuestoForCertificado || !mediciones || mediciones.length === 0}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccione una medición" />
                </SelectTrigger>
                <SelectContent>
                  {(mediciones || [])
                    // Optionally filter mediciones based on selectedPresupuestoForCertificado if needed
                    .map((med: any) => (
                      <SelectItem key={med.id} value={med.id.toString()}>
                        Medición ID: {med.id} - Periodo: {med.periodo ? format(parseISO(med.periodo), 'MM/yyyy', { locale: es }) : 'N/A'}
                      </SelectItem>
                    ))}
                  {(!mediciones || mediciones.length === 0) && <SelectItem value="disabled" disabled>No hay mediciones disponibles</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCertificadoContinue}
              disabled={!selectedPresupuestoForCertificado || !selectedMedicionForCertificado}
              className="w-full"
            >
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
// TODO: Import Select components if used
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
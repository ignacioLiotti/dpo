'use client';

import React, { useMemo, useState, useRef } from 'react';
import { useObras } from '@/hooks/useObras';
import { DateRange } from 'react-day-picker';
import { format, subMonths, startOfToday, parse } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, Printer, SlidersHorizontal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StateStats {
  count: number;
  monto: number;
}

const ObrasReporteSimple = () => {
  const { data: obras = [], isLoading } = useObras();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Set default date range to last 6 months
  const defaultDateRange = {
    from: subMonths(startOfToday(), 48),
    to: startOfToday()
  } as const;

  const [dateRange, setDateRange] = useState<typeof defaultDateRange>(defaultDateRange);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");

  // Get unique locations and states
  const locations = useMemo(() =>
    Array.from(new Set(obras.map(obra => obra.localidad))).filter(Boolean),
    [obras]
  );

  const states = useMemo(() =>
    Array.from(new Set(obras.map(obra => obra.avance))).filter(Boolean),
    [obras]
  );

  // Parse basico date format (e.g., "OCT-24" to Date object)
  const parseBasicoDate = (basicoDate: string | null): Date | null => {
    if (!basicoDate) return null;
    try {
      // Add day 1 to make it a valid date (e.g., "OCT-24" -> "OCT-01-24")
      const dateStr = `${basicoDate.split('-')[0]}-01-${basicoDate.split('-')[1]}`;
      return parse(dateStr, 'MMM-dd-yy', new Date());
    } catch (error) {
      console.error('Error parsing basico date:', error);
      return null;
    }
  };

  // Filter obras based on selected criteria
  const filteredObras = useMemo(() => {
    const filtered = obras.filter(obra => {
      const matchesLocation = selectedLocation === "all" || obra.localidad === selectedLocation;
      const matchesState = selectedState === "all" || obra.avance === selectedState;

      // Check both fechaInicio and basico dates
      let matchesDate = false;
      if (obra.fechaInicio) {
        const obraDate = new Date(obra.fechaInicio);
        matchesDate = obraDate >= dateRange.from && obraDate <= dateRange.to;
      } else if (obra.basico) {
        const basicoDate = parseBasicoDate(obra.basico);
        matchesDate = basicoDate ? basicoDate >= dateRange.from && basicoDate <= dateRange.to : false;
      }

      return matchesLocation && matchesState && matchesDate;
    });

    // Sort obras by date (fechaInicio or basico)
    return filtered.sort((a, b) => {
      const dateA = a.fechaInicio ? new Date(a.fechaInicio) : parseBasicoDate(a.basico);
      const dateB = b.fechaInicio ? new Date(b.fechaInicio) : parseBasicoDate(b.basico);

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    });
  }, [obras, selectedLocation, selectedState, dateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalObras = filteredObras.length;
    const totalMonto = filteredObras.reduce((acc, obra) =>
      acc + parseFloat(obra.montoContrato?.replace(/[$.]/g, '').replace(',', '.') || '0'), 0
    );

    const byState = filteredObras.reduce((acc, obra) => {
      const state = obra.avance || 'Sin Estado';
      if (!acc[state]) {
        acc[state] = {
          count: 0,
          monto: 0
        };
      }
      acc[state].count++;
      acc[state].monto += parseFloat(obra.montoContrato?.replace(/[$.]/g, '').replace(',', '.') || '0');
      return acc;
    }, {} as Record<string, StateStats>);

    const filteredStates = ['En Ejecución', 'Licitacion', 'Terminada', selectedState] as const;

    const byStateFiltered = Object.entries(byState)
      .filter(([state]) => filteredStates.includes(state as typeof filteredStates[number]))
      .sort((a, b) => a[0].localeCompare(b[0]));

    console.log('byStateFiltered', byStateFiltered);

    return {
      totalObras,
      totalMonto,
      byState: byStateFiltered as [string, StateStats][]
    };
  }, [filteredObras]);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;

    setIsGeneratingPdf(true);
    try {
      // Hide the buttons during capture
      const printButton = document.querySelector('.print-button') as HTMLElement;
      const filterButton = document.querySelector('.filter-button') as HTMLElement;
      const tabs = document.querySelector('.tabs') as HTMLElement;
      if (printButton) printButton.style.display = 'none';
      if (filterButton) filterButton.style.display = 'none';
      if (tabs) tabs.style.display = 'none';

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Show the buttons again
      if (printButton) printButton.style.display = 'block';
      if (filterButton) filterButton.style.display = 'block';
      if (tabs) tabs.style.display = 'block';
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('obras-reporte.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="p-8 font-sans relative" ref={contentRef}>
      {/* Filters Button */}
      <div className="absolute top-0 right-0 filter-button">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 pb-10" align="end">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Filtros de Obras</h4>
                <p className="text-sm text-muted-foreground">
                  Ajusta los filtros para ver las obras específicas
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid gap-2">
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="date" className="text-sm font-medium leading-none">
                      Rango de Fechas
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant="outline"
                          className={cn(
                            'justify-start text-left font-normal'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          <>
                            {format(dateRange.from, 'LLL dd, y')} -{' '}
                            {format(dateRange.to, 'LLL dd, y')}
                          </>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" side="left" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange.from}
                          selected={dateRange}
                          onSelect={(newDateRange) => {
                            if (newDateRange?.from) {
                              setDateRange({
                                from: newDateRange.from,
                                to: newDateRange.to || startOfToday()
                              });
                            }
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="location" className="text-sm font-medium leading-none">
                      Ubicación
                    </label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger id="location">
                        <SelectValue placeholder="Seleccionar ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las ubicaciones</SelectItem>
                        {locations.map(location => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="state" className="text-sm font-medium leading-none">
                      Estado
                    </label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {states.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Header */}
      <motion.div
        className="flex justify-between items-start mb-8"
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center">
          {/* <img src="/api/placeholder/80/80" alt="Corrientes logo" className="mr-4" /> */}
          <div>
            <div className="text-2xl font-bold">CORRIENTES</div>
            <div className="text-sm font-bold text-gray-800">Ministerio de Obras y Servicios Públicos</div>
            <div className="text-xs text-gray-600">Secretaría de Obras y Servicios Públicos</div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="mt-4 tabs">
              <TabsList>
                <TabsTrigger value="reporte">Reporte</TabsTrigger>
                <TabsTrigger value="estadisticas">Tabla</TabsTrigger>
                <TabsTrigger value="obras">Graficos</TabsTrigger>
                <TabsTrigger value="reportesSimples">Reportes Simples</TabsTrigger>
              </TabsList>
            </motion.div>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-4xl">
            <div className="">OBRAS</div>
            <div className="">
              {selectedState !== "all" ? selectedState.toUpperCase() : 'TODAS'}
            </div>
          </div>
          <Separator className="h-20 w-1 bg-gray-800" orientation="vertical" />
          <div className="text-8xl font-bold">
            {stats.totalObras}
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        className="flex justify-end mb-8 text-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex justify-between gap-4 w-1/2">
          <div>
            <div className="font-bold">{stats.totalObras} OBRAS</div>
            <div>$ {stats.totalMonto.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</div>
          </div>
          {stats.byState.map(([state, data], index) => (
            <div key={state}>
              <div className="font-bold">{data.count} {state}</div>
              <div>$ {data.monto.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Content - Two Columns */}
      <motion.div
        className="flex gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {/* Left Column */}
        <div className="w-1/5">
          <div className="text-8xl font-bold mb-4">
            {stats.byState.find(([state]) => state === selectedState && selectedState !== "all")?.[1]?.count || stats.byState.find(([state]) => state === "En Ejecución")?.[1]?.count || 0}
          </div>

          <div className="text-3xl mb-4">{selectedState !== "all" ? selectedState.toUpperCase() : 'EN EJECUCION'}</div>
          <div className="text-xl font-bold mb-4">
            $ {(stats.byState.find(([state]) => state === selectedState && selectedState !== "all")?.[1]?.monto || stats.byState.find(([state]) => state === "En Ejecución")?.[1]?.monto || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-gray-600">
            Inversión Total
            <br />
            (por Monto de Contrato)
          </div>
        </div>

        {/* Right Column - Table */}
        <div className="w-4/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Nombre de la Obra</th>
                <th className="text-left p-2">Localidad</th>
                <th className="text-left p-2">Empresa</th>
                <th className="text-right p-2">Monto Contrato</th>
                <th className="text-right p-2">Total Autorizado</th>
                <th className="text-right p-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredObras.map(obra => (
                <motion.tr
                  key={obra.id}
                  className="border-b hover:bg-gray-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="p-2">{obra.id}</td>
                  <td className="p-2">{obra.nombre}</td>
                  <td className="p-2">{obra.localidad}</td>
                  <td className="p-2">{obra.empresaAdjudicada}</td>
                  <td className="text-right p-2">{obra.montoContrato}</td>
                  <td className="text-right p-2">$ {(Number(obra.montoContrato.replace(/[$.]/g, '').replace(',', '.')) + Number(obra.montoContrato.replace(/[$.]/g, '').replace(',', '.')) * 0.2).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                  <td className="text-right p-2">{obra.avance}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        className="mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="text-3xl font-bold mb-2">DPO</div>
        <div className="text-sm text-gray-600">
          Dirección de Planificación y Obras
          <br />
          Departamento Documentación e Información
          <br />
          Av. Las Heras N° 1550 | W3402BQJ | Corrientes - Argentina
          <br />
          www.dpo.gob.ar - doceinfdpo@gob.ar
        </div>
      </motion.div>

      <div className="fixed bottom-4 right-16 print-button">
        <Button
          variant="default"
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className="gap-2"
        >
          {isGeneratingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Printer className="h-4 w-4" />
          )}
          {isGeneratingPdf ? 'Generando PDF...' : 'Imprimir'}
        </Button>
      </div>
    </div>
  );
};

export default ObrasReporteSimple;

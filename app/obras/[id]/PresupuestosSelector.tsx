// app/obras/[id]/PresupuestosSelector.tsx
import { TabsContent } from '@/components/ui/tabs';
import { motion } from "framer-motion";
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import type { TableItem, Presupuesto, Medicion } from '@/types';
import { PresupuestoEditor } from '@/components/editores/PresupuestoEditor';
import { MedicionesEditor } from '@/components/editores/MedicionesEditor';
import { useObra } from '@/app/providers/ObraProvider';
import { FileChartPie } from 'lucide-react';

interface OldPresupuestoItem {
  id: number;
  nombre: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

interface OldPresupuestoSection {
  nombre: string;
  items: OldPresupuestoItem[];
}

interface OldPresupuestoData {
  secciones: OldPresupuestoSection[];
}

interface PresupuestosSelectorProps {
  obraId: string;
}

function PresupuestosSelector({ obraId }: PresupuestosSelectorProps) {
  const { state: { presupuestos, mediciones, loading, error } } = useObra();

  // Sort presupuestos from newest to oldest based on created_at
  const sortedPresupuestos = React.useMemo(() => {
    return [...presupuestos].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [presupuestos]);

  // Initialize state
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null);
  const [selectedMedicion, setSelectedMedicion] = useState<Medicion | null>(null);
  const [transformedPresupuestos, setTransformedPresupuestos] = useState<Record<number, Record<string, TableItem[]>>>({});
  const [isScrolled, setIsScrolled] = useState(false);

  // Reset selected medicion when presupuesto changes
  useEffect(() => {
    setSelectedMedicion(null);
  }, [selectedPresupuesto]);

  // Set default selection to the newest presupuesto if none is selected
  useEffect(() => {
    if (!selectedPresupuesto && sortedPresupuestos.length > 0) {
      setSelectedPresupuesto(sortedPresupuestos[0]);
    }
  }, [selectedPresupuesto, sortedPresupuestos]);

  // Transform all presupuestos on initial load
  useEffect(() => {
    const transformed = sortedPresupuestos.reduce((acc, presupuesto) => {
      acc[presupuesto.id] = transformPresupuestoData(presupuesto);
      return acc;
    }, {} as Record<number, Record<string, TableItem[]>>);

    setTransformedPresupuestos(transformed);
  }, [sortedPresupuestos]);

  // Use transformed data directly when selecting a presupuesto
  const selectedPresupuestoData = selectedPresupuesto
    ? transformedPresupuestos[selectedPresupuesto.id]
    : {};

  // Calculate grand total and section rubros
  const { grandTotal, sectionRubros } = React.useMemo(() => {
    if (!selectedPresupuesto) return { grandTotal: 0, sectionRubros: [] };

    const total = selectedPresupuesto.total;
    const rubros = Object.entries(selectedPresupuestoData).map(([_, items]) => {
      return (items.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / total;
    });

    return { grandTotal: total, sectionRubros: rubros };
  }, [selectedPresupuestoData, selectedPresupuesto]);

  // Calculate running total (IACUM) for each section
  const sectionIacums = React.useMemo(() => {
    let runningTotal = 0;
    return Object.entries(selectedPresupuestoData).map(([_, items]) => {
      runningTotal += items.reduce((sum, item) => sum + item.totalPrice, 0);
      return (runningTotal * 100) / grandTotal;
    });
  }, [selectedPresupuestoData, grandTotal]);

  // Update scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Transform presupuesto data to match PresupuestoEditor format
  const transformPresupuestoData = (presupuesto: Presupuesto): Record<string, TableItem[]> => {
    // If data is already in the correct format, return it directly
    if (typeof presupuesto.data === 'object' && !Array.isArray(presupuesto.data) && !('secciones' in presupuesto.data)) {
      return presupuesto.data as Record<string, TableItem[]>;
    }

    // For backwards compatibility with old format
    const oldData = presupuesto.data as unknown as OldPresupuestoData;
    if ('secciones' in presupuesto.data) {
      const result: Record<string, TableItem[]> = {};

      oldData.secciones.forEach(seccion => {
        result[seccion.nombre] = seccion.items.map(item => ({
          id: item.id.toString(),
          name: item.nombre,
          unit: item.unidad,
          quantity: item.cantidad,
          unitPrice: item.precioUnitario,
          totalPrice: item.total,
          price: item.precioUnitario,
          category: seccion.nombre,
          parcial: (item.total * 100) / presupuesto.total,
          rubro: (seccion.items.reduce((acc: number, i) => acc + i.total, 0) * 100) / presupuesto.total,
          accumulated: 0,
          element_tags: [],
          originalUnit: item.unidad,
          originalQuantity: item.cantidad,
          originalUnitPrice: item.precioUnitario,
          targetSection: seccion.nombre,
          nombre: item.nombre
        }));
      });

      return result;
    }

    // If neither format is found, return empty object
    console.warn('Presupuesto data is in an unknown format:', presupuesto.data);
    return {};
  };

  if (loading) {
    return (
      <TabsContent value="tab-2" className="h-full mt-16">
        <div className="flex items-center justify-center h-64">
          <p className="text-lg">Loading presupuestos...</p>
        </div>
      </TabsContent>
    );
  }

  if (error) {
    return (
      <TabsContent value="tab-2" className="h-full mt-16">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-lg text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </TabsContent>
    );
  }

  return (
    <div className="flex gap-4 h-full items-start mt-24">
      <div className="flex flex-col gap-5">
        {sortedPresupuestos.map((presupuesto) => (
          <div
            key={presupuesto.id}
            onClick={() => {
              setSelectedPresupuesto(presupuesto)
              setSelectedMedicion(null)
            }}
            className={cn(
              'flex flex-col justify-center items-start p-4 w-[15vw] max-w-[15vw] h-20 rounded-lg relative z-20 cursor-pointer'
            )}
          >
            <h2 className="font-semibold text-xl">Presupuesto {presupuesto.id}</h2>
            <div className='flex justify-between w-full pr-3'>
              <p className="text-sm text-muted-foreground font-bold">
                ${presupuesto.total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(presupuesto.created_at).toLocaleDateString()}
              </p>
            </div>
            <motion.span
              className={cn(
                'flex flex-col justify-center items-start p-4 w-[15vw] h-20 rounded-lg absolute left-0 -z-10 cursor-pointer transition-colors',
                selectedPresupuesto?.id === presupuesto.id
                  ? 'shadow-[-2px_4px_6px_-1px_#0000001a]'
                  : ''
              )}
              animate={{
                width: selectedPresupuesto?.id === presupuesto.id && selectedMedicion === null ? '110%' : '100%',
              }}
              exit={{ width: '275px' }}
            />
            <motion.span
              className={cn(
                'flex flex-col justify-center items-start p-4 w-[15vw] h-20 rounded-lg absolute left-0 -z-10 cursor-pointer transition-colors',
                (selectedPresupuesto?.id === presupuesto.id && selectedMedicion === null)
                  ? 'bg-containerBackground'
                  : 'bg-containerBackground/50'
              )}
              animate={{
                width: selectedPresupuesto?.id === presupuesto.id && selectedMedicion === null ? '110%' : '100%',
              }}
              exit={{ width: '275px' }}
            />
          </div>
        ))}
      </div>

      <div className="bg-containerBackground rounded-lg w-full h-full min-h-[500px] min-w-[1220px] flex-1 relative shadow-md flex justify-end">
        {selectedPresupuesto ? (
          <div className='flex flex-col gap-2 mb-16 absolute -top-20 left-14 h-full'>
            {selectedMedicion ? (
              <div className='flex flex-col gap-2 floating-scroll'>
                <MedicionesEditor
                  medicion={selectedMedicion}
                  presupuestoData={selectedPresupuesto.data}
                  display={true}
                  obraId={selectedPresupuesto.obra_id}
                />

              </div>
            ) : (
              <PresupuestoEditor
                key={selectedPresupuesto.id}
                presupuestoData={selectedPresupuestoData}
                allElements={[]}
                display={true}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center w-full bg-white justify-center text-muted-foreground rounded-2xl">
            <FileChartPie className="w-12 h-12 mb-4 opacity-20" />
            <p>No hay presupuestos creados para esta obra</p>
          </div>
        )}
        <div className='flex flex-col gap-2 mb-16 h-full'>
          {selectedPresupuesto && (
            <div className="flex flex-col gap-4 p-4">
              {mediciones.map((medicion) => (
                <div
                  key={medicion.id}
                  onClick={() => {
                    setSelectedMedicion(medicion);
                  }}
                  className={cn(
                    "bg-white h-36 w-28 rounded-lg shadow border hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-start",
                    selectedMedicion?.id === medicion.id ? "ring-2 ring-primary" : ""
                  )}
                >
                  <div className="flex flex-col gap-1 bg-gray-200/50  px-3 pt-2 pb-1 rounded-t-lg">
                    <p className="font-medium text-sm">Medición</p>
                    <p className="text-xs text-gray-500">
                      {new Date(medicion.periodo).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 px-3 pt-2 pb-4 ">
                    <div className="flex flex-col">
                      <p className="text-xs text-gray-500 flex items-center justify-between gap-1 ">Medicion
                      </p>
                      <span className="text-sm font-bold text-gray-500 ">
                        {medicion.avanceMedicion}%
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-gray-500 flex items-center justify-between gap-1 ">Acumulado
                      </p>
                      <span className="text-sm font-bold text-gray-500">
                        {medicion.avanceAcumulado}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div >
  );
}

export default PresupuestosSelector;

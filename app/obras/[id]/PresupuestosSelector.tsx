// app/obras/[id]/PresupuestosSelector.tsx
import { TabsContent } from '@/components/ui/tabs';
import { motion } from "framer-motion";
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { TableItem } from '@/app/presupuesto/types';
import { PresupuestoEditor } from '@/components/editores/PresupuestoEditor';
import { MedicionesEditor } from '@/components/editores/MedicionesEditor';
import { useMediciones } from '@/hooks/useMediciones';

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

interface Presupuesto {
  id: number;
  obra_id: number;
  nombre: string;
  total: number;
  data: Record<string, TableItem[]> | OldPresupuestoData;
  created_at: string;
  updated_at: string;
}

interface MedicionItem {
  id: string;
  anterior: number;
  presente: number;
  acumulado: number;
}

interface MedicionSeccion {
  nombre: string;
  items: MedicionItem[];
}

interface PresupuestosSelectorProps {
  obraId: string;
  initialPresupuestos: Presupuesto[];
}

function PresupuestosSelector({ obraId, initialPresupuestos }: PresupuestosSelectorProps) {
  // Sort initial presupuestos from newest to oldest based on created_at
  const sortedInitialPresupuestos = [...initialPresupuestos].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Initialize state with sorted presupuestos
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null);
  const [selectedMedicion, setSelectedMedicion] = useState<any | null>(null);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>(sortedInitialPresupuestos);
  const [transformedPresupuestos, setTransformedPresupuestos] = useState<Record<number, Record<string, TableItem[]>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Get mediciones for the selected presupuesto
  const { data: mediciones = [] } = useMediciones(selectedPresupuesto?.obra_id || 0);

  // Reset selected medicion when presupuesto changes
  useEffect(() => {
    setSelectedMedicion(null);
  }, [selectedPresupuesto]);

  // Set default selection to the newest presupuesto if none is selected
  useEffect(() => {
    if (!selectedPresupuesto && presupuestos.length > 0) {
      setSelectedPresupuesto(presupuestos[0]);
    }
  }, [selectedPresupuesto, presupuestos]);

  // Transform all presupuestos on initial load
  useEffect(() => {
    const transformed = presupuestos.reduce((acc, presupuesto) => {
      acc[presupuesto.id] = transformPresupuestoData(presupuesto);
      return acc;
    }, {} as Record<number, Record<string, TableItem[]>>);

    setTransformedPresupuestos(transformed);
  }, [presupuestos]);

  // Use transformed data directly when selecting a presupuesto
  const selectedPresupuestoData = selectedPresupuesto
    ? transformedPresupuestos[selectedPresupuesto.id]
    : {};

  // Calculate grand total and section rubros
  const { grandTotal, sectionRubros } = React.useMemo(() => {
    if (!selectedPresupuesto) return { grandTotal: 0, sectionRubros: [] };

    const total = selectedPresupuesto.total;
    console.log('selectedPresupuestoData', selectedPresupuestoData)
    Object.entries(selectedPresupuestoData).forEach(([_, items]) => {
      console.log('items', items)
    })
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
    const oldData = presupuesto.data as OldPresupuestoData;
    if (oldData.secciones) {
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
        {presupuestos.map((presupuesto) => (
          <div
            key={presupuesto.id}
            onClick={() => setSelectedPresupuesto(presupuesto)}
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
                '-z-10 w-full h-[80px] absolute',
                selectedPresupuesto?.id === presupuesto.id
                  ? 'shadow-[-20px_4px_6px_-1px_#0000001a]'
                  : ''
              )}
              animate={{
                width: selectedPresupuesto?.id === presupuesto.id ? 310 : 275,
              }}
              exit={{ width: 275 }}
            />
            <motion.span
              className={cn(
                'flex flex-col justify-center items-start p-4 w-[15vw] h-20 rounded-lg absolute left-0 -z-10 cursor-pointer transition-colors',
                selectedPresupuesto?.id === presupuesto.id
                  ? 'bg-white'
                  : 'bg-gray-200'
              )}
              animate={{
                width: selectedPresupuesto?.id === presupuesto.id ? 310 : 275,
              }}
              exit={{ width: 275 }}
            />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg w-full h-full min-h-[500px] flex-1 relative shadow-md flex justify-end">
        {selectedPresupuesto ? (
          <div className='flex flex-col gap-2 mb-16 absolute -top-20 left-20 h-full'>
            {selectedMedicion ? (
              <MedicionesEditor
                medicion={selectedMedicion}
                presupuestoData={Object.entries(selectedPresupuestoData).reduce((acc, [section, items]) => {
                  acc[section] = items.map(item => ({
                    id: String(item.id),
                    name: item.name,
                    totalPrice: item.totalPrice
                  }))
                  return acc
                }, {} as Record<string, { id: string; name: string; totalPrice: number }[]>)}
                display={true}
                obraId={selectedPresupuesto.obra_id}
              />
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
          <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
            <p>Select a presupuesto to view details</p>
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
                    "bg-white p-4 h-36 w-28 rounded-lg shadow border hover:shadow-md transition-shadow cursor-pointer",
                    selectedMedicion?.id === medicion.id ? "ring-2 ring-primary" : ""
                  )}
                >
                  <p className="font-medium text-sm">Medición #{medicion.id}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(medicion.month).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default PresupuestosSelector;

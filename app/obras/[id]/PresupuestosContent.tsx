import { TabsContent } from '@/components/ui/tabs';
import { motion } from "framer-motion";
import ExampleDocument from '@/components/testDocument/page';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface Presupuesto {
  id: number;
  obraId: number;
  data: any;
  createdAt: string;
  updatedAt: string;
  certificados?: { name: string }[];
}

function PresupuestosContent({ obraId }: { obraId: string }) {
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPresupuestos = async () => {
      if (!obraId) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log('Fetching presupuestos for obra:', obraId);
        const response = await fetch(`/api/obras/${obraId}/presupuestos`);

        console.log('Response:', response);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Presupuestos loaded:", data);

        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }

        setPresupuestos(data);

        // If there are presupuestos and none is selected, select the first one
        if (data.length > 0 && !selectedPresupuesto) {
          setSelectedPresupuesto(data[0]);
        }
      } catch (error) {
        console.error('Error fetching presupuestos:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresupuestos();
  }, [obraId]); // Remove selectedPresupuesto from dependencies to avoid infinite loop

  if (isLoading) {
    return (
      <TabsContent value="tab-2" className="h-full mt-16">
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          <p className="text-gray-500">Cargando presupuestos...</p>
        </div>
      </TabsContent>
    );
  }

  if (error) {
    return (
      <TabsContent value="tab-2" className="h-full mt-16">
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="tab-2" className="h-full mt-16">
      {presupuestos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <p className="text-gray-500">No hay presupuestos disponibles.</p>
        </div>
      ) : (
        <div className="flex gap-4 h-full items-start">
          <div className="flex flex-col gap-5">
            {presupuestos.map((presupuesto) => (
              <div
                key={presupuesto.id}
                onClick={() => setSelectedPresupuesto(presupuesto)}
                className={cn(
                  'flex flex-col justify-center items-start p-4 w-[15vw] max-w-[15vw] h-20 rounded-lg relative z-20 cursor-pointer'
                )}
              >
                <h2 className="font-semibold text-xl">Presupuesto #{presupuesto.id}</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(presupuesto.createdAt).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
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

          <div className="bg-white rounded-lg w-full h-full flex justify-end items-start relative shadow-md">
            <div className="absolute left-[10%] -top-10">
              <ExampleDocument defaultData={selectedPresupuesto?.data || null} />
            </div>
            <div className="flex flex-col gap-6 w-32 bg-gray-200 rounded-r-lg h-full justify-start items-center p-4">
              {selectedPresupuesto?.certificados?.map((certificado, index) => (
                <div
                  key={index}
                  className="flex h-36 w-24 rounded-sm bg-white shadow-sm"
                >
                  <p>{certificado.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </TabsContent>
  );
}

export default PresupuestosContent;
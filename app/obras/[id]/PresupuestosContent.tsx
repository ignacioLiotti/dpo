// app/obras/[id]/PresupuestosContent.tsx
import { TabsContent } from '@/components/ui/tabs';
import { motion } from "motion/react";
import ExampleDocument from '@/components/testDocument/page';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

function PresupuestosContent({ obraId }: { obraId: string }) {
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<{ id: string; data?: any; certificados?: { name: string }[] } | null>(null);

  const [presupuestos, setPresupuestos] = useState<{ id: string; data?: any; certificados?: { name: string }[] }[]>([]);

  useEffect(() => {
    if (obraId) {
      // Fetch the presupuestos data from the API route
      fetch(`/api/obras/${obraId}/presupuestos`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((data) => setPresupuestos(data))
        .catch((error) => console.error('Error fetching presupuestos:', error));
    }
  }, [obraId]);

  console.log(presupuestos);

  return (
    <TabsContent value="tab-2" className="h-full mt-16">
      <div className="flex gap-4 h-full items-start">
        <div className="flex flex-col gap-5">
          {presupuestos.map((presupuesto, index) => (
            <div
              key={index}
              onClick={() => setSelectedPresupuesto(presupuesto)}
              className={cn(
                'flex flex-col justify-center items-start p-4 w-[15vw] max-w-[15vw] h-20 rounded-lg relative z-20 cursor-pointer'
              )}
            >
              <h2 className="font-semibold text-xl">Presupuesto</h2>
              <p>Fecha ponele que se yo</p>
              <motion.span
                className={cn(
                  '-z-10 w-full h-[80px] absolute',
                  selectedPresupuesto?.id === presupuesto?.id
                    ? 'shadow-[-20px_4px_6px_-1px_#0000001a]'
                    : ''
                )}
                animate={{
                  width: selectedPresupuesto?.id === presupuesto?.id ? 310 : 275,
                }}
                exit={{ width: 275 }}
              />
              <motion.span
                className={cn(
                  'flex flex-col justify-center items-start p-4 w-[15vw] h-20 rounded-lg absolute left-0 -z-10 cursor-pointer transition-colors',
                  selectedPresupuesto?.id === presupuesto?.id
                    ? 'bg-white'
                    : 'bg-gray-200'
                )}
                animate={{
                  width: selectedPresupuesto?.id === presupuesto?.id ? 310 : 275,
                }}
                exit={{ width: 275 }}
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg w-full h-full flex justify-end items-start relative shadow-md">
          <div className="absolute left-[10%] -top-10">
            <ExampleDocument
              defaultData={selectedPresupuesto?.data || null}
            />
          </div>
          <div className="flex flex-col gap-6 w-32 bg-gray-200 rounded-r-lg h-full justify-start items-center p-4">
            {selectedPresupuesto?.certificados?.map((certificado: { name: string }, index: number) => (
              <div
                key={index}
                className="flex h-36 w-24 rounded-sm bg-white shadow-sm "
              >
                <p>{certificado.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TabsContent>
  );
}

export default PresupuestosContent;
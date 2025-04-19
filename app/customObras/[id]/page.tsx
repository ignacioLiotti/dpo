// app/customObras/[id]/page.tsx

import Link from "next/link";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getObra, getPresupuestos } from "../actions";
import type { PresupuestoSection, PresupuestoItem } from "@/types/presupuesto";

export default async function CustomObraPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const obra = await getObra(id);
  const presupuestos = await getPresupuestos(id);

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{obra.nombre}</h1>
          {obra.localidad && (
            <p className="text-lg text-muted-foreground mt-1">{obra.localidad}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="presupuestos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="presupuestos">Presupuestos</TabsTrigger>
          <TabsTrigger value="mediciones">Mediciones</TabsTrigger>
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
        </TabsList>

        <TabsContent value="presupuestos">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Link href={`/customObras/${id}/create-presupuesto`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Presupuesto
                </Button>
              </Link>
            </div>

            {presupuestos.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No hay presupuestos creados aún.</p>
                <Link href={`/customObras/${id}/create-presupuesto`} className="mt-4 inline-block">
                  <Button variant="secondary">Crear el primer presupuesto</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                {presupuestos.map((presupuesto) => {
                  // Calculate the total for this presupuesto
                  const total = presupuesto.sections?.reduce((acc: number, section: PresupuestoSection) => {
                    return acc + section.items.reduce((sectionTotal: number, item: PresupuestoItem) => {
                      return sectionTotal + (item.quantity * item.unit_price);
                    }, 0);
                  }, 0) || 0;

                  return (
                    <Card key={presupuesto.id} className="p-6">
                      <h3 className="text-xl font-semibold mb-4">{presupuesto.name}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Secciones:</span>
                          <span className="font-medium">{presupuesto.sections?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat('es-AR', {
                              style: 'currency',
                              currency: 'ARS'
                            }).format(total)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Creado:</span>
                          <span className="font-medium">
                            {new Date(presupuesto.created_at).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mediciones">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Próximamente: Mediciones</p>
          </Card>
        </TabsContent>

        <TabsContent value="certificados">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Próximamente: Certificados</p>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}



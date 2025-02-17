import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { PresupuestoPageClient } from "./PresupuestoPageClient"
import { getQueryClient } from '@/app/get-query-clients'
import { createClient } from "@/utils/supabase/server"
import { Presupuesto } from '../hooks/usePresupuestoData'
import { TableItem } from '../types'

async function getPresupuesto(id: string): Promise<Presupuesto> {
  const supabase = await createClient();
  const { data: rawData, error } = await supabase
    .from("presupuestos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  if (!rawData) {
    throw new Error("Presupuesto no encontrado");
  }

  // Transform old format to new format if necessary
  if ('secciones' in rawData.data) {
    const oldData = rawData.data as {
      secciones: Array<{
        nombre: string;
        items: Array<{
          id: number;
          nombre: string;
          unidad: string;
          cantidad: number;
          precioUnitario: number;
          total: number;
        }>;
      }>
    };

    const transformedData: Record<string, TableItem[]> = {};
    oldData.secciones.forEach(seccion => {
      transformedData[seccion.nombre] = seccion.items.map(item => ({
        id: String(item.id),
        name: item.nombre,
        unit: item.unidad,
        quantity: item.cantidad,
        unitPrice: item.precioUnitario,
        totalPrice: item.total,
        price: item.precioUnitario,
        category: seccion.nombre,
        parcial: (item.total * 100) / rawData.total,
        rubro: (seccion.items.reduce((acc, i) => acc + i.total, 0) * 100) / rawData.total,
        accumulated: 0,
        element_tags: [],
        originalUnit: item.unidad,
        originalQuantity: item.cantidad,
        originalUnitPrice: item.precioUnitario,
        targetSection: seccion.nombre,
        nombre: item.nombre
      }));
    });

    return {
      ...rawData,
      data: transformedData
    };
  }

  return rawData;
}

export default async function PresupuestoPage({ params }: { params: { id: string } }) {
  const queryClient = getQueryClient()
  const { id } = params

  // Fetch presupuesto data
  const presupuesto = await getPresupuesto(id)

  console.log('presupuesto', presupuesto)

  // Prefetch the data into the query client
  await queryClient.prefetchQuery({
    queryKey: ['presupuesto', id],
    queryFn: () => Promise.resolve(presupuesto)
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PresupuestoPageClient id={id} initialPresupuesto={presupuesto} />
    </HydrationBoundary>
  )
}

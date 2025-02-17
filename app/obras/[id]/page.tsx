// app/obras/[id]/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import ObraPage from './ObraPage'
import { getQueryClient } from '@/app/get-query-clients'
import { getObra } from '@/utils/hooks/useObras'

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

interface Presupuesto {
  id: number;
  obra_id: number;
  nombre: string;
  total: number;
  data: {
    secciones: {
      nombre: string;
      items: {
        id: number;
        nombre: string;
        unidad: string;
        cantidad: number;
        precioUnitario: number;
        total: number;
      }[];
    }[];
  };
  created_at: string;
  updated_at: string;
}

export default async function ObraServerPage({ params }: { params: Promise<{ id: string }> }) {
  const queryClient = getQueryClient()
  const { id } = await params

  // Fetch obra data
  const obra = await getObra(Number(id)) as unknown as Obra

  // Fetch presupuesto data
  const presupuestoResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/presupuestos?obraId=${id}`)
  if (!presupuestoResponse.ok) {
    throw new Error('Failed to fetch presupuesto')
  }
  const presupuestos = await presupuestoResponse.json() as Presupuesto[]

  // Prefetch the data into the query client
  await queryClient.prefetchQuery({
    queryKey: ['obra', id],
    queryFn: () => Promise.resolve(obra)
  })

  await queryClient.prefetchQuery({
    queryKey: ['presupuestos', id],
    queryFn: () => Promise.resolve(presupuestos)
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* @ts-ignore */}
      <ObraPage id={id} initialObra={obra} initialPresupuestos={presupuestos} />
    </HydrationBoundary>
  )
}

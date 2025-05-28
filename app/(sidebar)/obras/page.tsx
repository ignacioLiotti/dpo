// Dashboard page for viewing all obras with analytics and insights

// debe ser una visualizacion de tarjetas con las obras

// debe haber un boton para crear una obra
// ese boton debe abrir un sheet lateral derecho con el formulario para crear una obra
// el formulario debe tener los campos:
// - nombre (input)
// - descripcion (textarea)
// - fecha de inicio (fecha)
// - fecha de fin (fecha)
// - estado (select con los estados de la obra)
// - reparticion (select con las reparticiones)
// - area (select con las areas)
// - tipo de obra (select con los tipos de obra)
// - presupuesto oficial (numero formato pesos argentinos)
// - basico (fecha)
// - expediente (numero)

import type { Obra } from '@/types/obra';
import { ObrasDashboard } from '@/components/obras/obras-page-client';
import { getAllObrasAction } from '@/app/actions/obras/get-obra-action';
import { Suspense } from 'react';

// Loading component for the dashboard
function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
      
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}

// This page remains a Server Component
export default async function ObrasPage() {
  const obrasData: Obra[] | null = await getAllObrasAction();
  console.log('obrasData', obrasData);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <ObrasDashboard initialObras={obrasData || []} />
    </Suspense>
  );
}


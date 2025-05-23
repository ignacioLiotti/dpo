// pagina para ver todas las obras

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
import { ObrasPageClient } from '@/components/obras/obras-page-client'; // Import the new client component
import { getAllObrasAction } from '@/app/actions/obras/get-obra-action';
import { Suspense } from 'react';

// This page remains a Server Component
export default async function ObrasPage() {
  const obrasData: Obra[] | null = await getAllObrasAction();

  // Pass the fetched data to the client component, handle null case

  return (
    <Suspense fallback={<div>Loading...</div>}>

      <ObrasPageClient initialObras={obrasData || []} />
    </Suspense>
  );
}


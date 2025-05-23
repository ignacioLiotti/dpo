//page para ver la obra unica en base a su id

// aca debe haber un formulario para editar la obra, con los campos iniciales:
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

// y campos adicionales:

//redeterminacion (numero de redeterminacion en aumento, el primero es 1)
// expediente (numero)
// monto (numero formato pesos argentinos)
// basico (fecha)
// tipo de redeterminacion (select con los tipos de redeterminacion)

// adicionales (numero de adicionales, el primero es 1)
// monto (numero formato pesos argentinos)
// norma (numero de norma)
// trabajos (textarea)

// ampliaciones de plazo (numero de ampliaciones de plazo, el primero es 1)
// expediente (numero)
// norma (numero de norma)
// plazo (numero de dias)
// fecha final (fecha)

import type { Obra } from '@/types/obra';
import { notFound } from 'next/navigation';
import { ObraEditForm } from '@/components/obras/obra-edit-form';
import { getObraActionByID } from '@/app/actions/obras/get-obra-action';

interface ObraDetailsPageProps {
  params: { id: string };
}

export default async function ObraDetailsPage({ params }: ObraDetailsPageProps) {
  const { id } = params;
  console.log('Fetching obra with id:', id);

  const obra = await getObraActionByID(id);

  if (!obra) {
    notFound(); // This will show the closest not-found page
  }

  return (
    <div className="container mx-auto py-10">
      <ObraEditForm obra={obra} />
    </div>
  );
}

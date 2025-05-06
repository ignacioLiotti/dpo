import { getObra } from "../../actions";
import { CreatePresupuestoForm } from "./CreatePresupuestoForm";

interface CreatePresupuestoPageProps {
  params: {
    id: string;
  };
}

export default async function CreatePresupuestoPage({ params: { id } }: CreatePresupuestoPageProps) {
  const obra = await getObra(id);

  return (
    <main className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Crear Presupuesto</h1>
      <CreatePresupuestoForm obra={obra} />
    </main>
  );
}



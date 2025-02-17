import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import MedicionCreateClient from "./MedicionCreateClient";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    presupuestoId?: string;
  }>;
}

export default async function CreateMedicionPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { presupuestoId } = await searchParams;
  const supabase = await createClient();

  if (!presupuestoId) {
    redirect(`/obras/${id}?error=no-presupuesto-selected`);
  }

  // Verify obra exists
  const { data: obra, error: obraError } = await supabase
    .from("obras")
    .select("*")
    .eq("id", id)
    .single();

  if (obraError || !obra) {
    redirect("/obras");
  }

  // Get the specific presupuesto
  const { data: presupuesto, error: presupuestoError } = await supabase
    .from("presupuestos")
    .select("*")
    .eq("id", presupuestoId)
    .single();

  if (presupuestoError || !presupuesto) {
    redirect(`/obras/${id}?error=invalid-presupuesto`);
  }

  // Verify the presupuesto belongs to this obra
  if (presupuesto.obra_id !== Number(id)) {
    redirect(`/obras/${id}?error=presupuesto-mismatch`);
  }

  const presupuestoData = presupuesto.data;

  // Validate presupuesto data structure
  if (!presupuestoData || typeof presupuestoData !== 'object') {
    redirect(`/obras/${id}?error=invalid-presupuesto-data`);
  }

  // Validate obra dates
  if (!obra.fecha_inicio || !obra.fecha_fin) {
    redirect(`/obras/${id}?error=invalid-obra-dates`);
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Crear Medición para {obra.nombre}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Presupuesto: {presupuesto.nombre} - Total: ${presupuesto.total.toLocaleString('es-AR')}
      </p>
      <MedicionCreateClient
        obraId={id}
        obraName={obra.nombre}
        presupuestoData={presupuestoData}
        fechaInicio={obra.fecha_inicio}
        fechaFin={obra.fecha_fin}
      />
    </div>
  );
} 
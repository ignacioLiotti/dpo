import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CertificadoCreateClient from "./CertificadoCreateClient";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    presupuestoId?: string;
    medicionId?: string;
  }>;
}

export default async function CreateCertificadoPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { presupuestoId, medicionId } = await searchParams;
  const supabase = await createClient();

  if (!presupuestoId) {
    redirect(`/obras/${id}?error=no-presupuesto-selected`);
  }

  if (!medicionId) {
    redirect(`/obras/${id}?error=no-medicion-selected`);
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

  // Get the specific medicion
  const { data: medicion, error: medicionError } = await supabase
    .from("mediciones")
    .select("*")
    .eq("id", medicionId)
    .single();

  if (medicionError || !medicion) {
    redirect(`/obras/${id}?error=invalid-medicion`);
  }

  // Verify the medicion belongs to this obra
  if (medicion.obra_id !== Number(id)) {
    redirect(`/obras/${id}?error=medicion-mismatch`);
  }

  // Parse the obra data
  const obraData = obra.data ?
    typeof obra.data === 'string' ? JSON.parse(obra.data) : obra.data
    : {};

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Crear Certificado para {obra.nombre}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Presupuesto: {presupuesto.nombre} - Total: ${presupuesto.total.toLocaleString('es-AR')}
      </p>
      <CertificadoCreateClient
        obraId={id}
        obraName={obra.nombre}
        presupuestoData={presupuesto.data}
        selectedMedicion={medicion}
        fechaInicio={obra.fecha_inicio}
        fechaFin={obra.fecha_fin}
        obraData={obraData}
      />
    </div>
  );
} 
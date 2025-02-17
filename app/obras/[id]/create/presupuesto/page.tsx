import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PresupuestoCreateClient from "./PresupuestoCreateClient";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    step?: string;
  }>;
}

export default async function CreatePresupuestoPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { step = "1" } = await searchParams;
  const supabase = await createClient();

  // Verify obra exists
  const { data: obra, error: obraError } = await supabase
    .from("obras")
    .select("*")
    .eq("id", id)
    .single();

  if (obraError || !obra) {
    redirect("/obras");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Crear Presupuesto para {obra.nombre}</h1>
      <PresupuestoCreateClient
        obraId={id}
        obraData={obra}
        currentStep={parseInt(step)}
      />
    </div>
  );
} 
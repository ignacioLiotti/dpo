import { redirect } from "next/navigation";
import MedicionCreateWrapper from "./MedicionCreateWrapper";

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

  if (!presupuestoId) {
    redirect(`/obras/${id}?error=no-presupuesto-selected`);
  }

  return (
    <MedicionCreateWrapper
      obraId={id}
      presupuestoId={presupuestoId}
    />
  );
} 
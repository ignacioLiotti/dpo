import { redirect } from "next/navigation";
import { ObraProvider } from "@/app/providers/ObraProvider";
import CertificadoCreateWrapper from "./CertificadoCreateWrapper";

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

  if (!presupuestoId) {
    redirect(`/obras/${id}?error=no-presupuesto-selected`);
  }

  if (!medicionId) {
    redirect(`/obras/${id}?error=no-medicion-selected`);
  }

  return (
    <ObraProvider obraId={id}>
      <CertificadoCreateWrapper
        obraId={id}
        presupuestoId={presupuestoId}
        medicionId={medicionId}
      />
    </ObraProvider>
  );
} 
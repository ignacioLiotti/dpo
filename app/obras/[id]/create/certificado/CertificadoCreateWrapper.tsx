'use client';

import { redirect } from "next/navigation";
import { useObra } from "@/app/providers/ObraProvider";
import CertificadoCreateClient from "./CertificadoCreateClient";
import type { Presupuesto, Medicion, Certificado } from "@/types";

interface CertificadoCreateWrapperProps {
  obraId: string;
  presupuestoId: string;
  medicionId: string;
}

export default function CertificadoCreateWrapper({
  obraId,
  presupuestoId,
  medicionId,
}: CertificadoCreateWrapperProps) {
  const { state } = useObra();
  const { obra, presupuestos, mediciones, certificados } = state;

  if (!obra || !presupuestos || !mediciones) {
    return <div>Loading...</div>;
  }

  const presupuesto = presupuestos.find((p: Presupuesto) => p.id.toString() === presupuestoId);
  const medicion = mediciones.find((m: Medicion) => m.id.toString() === medicionId);

  // Get the latest certificado for this obra
  const latestCertificado = certificados
    .filter((c: Certificado) => c.obra_id === Number(obraId))
    .sort((a: Certificado, b: Certificado) => b.id - a.id)[0];

  if (!presupuesto) {
    redirect(`/obras/${obraId}?error=invalid-presupuesto`);
  }

  if (!medicion) {
    redirect(`/obras/${obraId}?error=invalid-medicion`);
  }

  // Verify the presupuesto belongs to this obra
  if (presupuesto.obra_id !== Number(obraId)) {
    redirect(`/obras/${obraId}?error=presupuesto-mismatch`);
  }

  // Verify the medicion belongs to this obra
  if (medicion.obra_id !== Number(obraId)) {
    redirect(`/obras/${obraId}?error=medicion-mismatch`);
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Crear Certificado para {obra.nombre}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Presupuesto: {presupuesto.nombre} - Total: ${presupuesto.total.toLocaleString('es-AR')}
      </p>
      <CertificadoCreateClient
        obraId={obraId}
        obraName={obra.nombre}
        presupuestoData={presupuesto.data}
        selectedMedicion={medicion}
        fechaInicio={obra.fechaInicio}
        fechaFin={obra.fechaFin}
        certificado={latestCertificado}
        // @ts-ignore
        obraData={obra.data ? JSON.parse(obra.data) : {}}
      />
    </div>
  );
}
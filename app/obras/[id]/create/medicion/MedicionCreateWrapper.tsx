'use client';

import { useObra } from "@/app/providers/ObraProvider";
import { redirect } from "next/navigation";
import MedicionCreateClient from "./MedicionCreateClient";
import type { TableItem } from "@/types";

interface MedicionCreateWrapperProps {
  obraId: string;
  presupuestoId: string;
}

export default function MedicionCreateWrapper({ obraId, presupuestoId }: MedicionCreateWrapperProps) {
  const { state } = useObra();
  const { obra, presupuestos, loading, error } = state;

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!obra) {
    redirect("/obras");
  }

  const presupuesto = presupuestos.find(p => p.id.toString() === presupuestoId);

  if (!presupuesto) {
    redirect(`/obras/${obraId}?error=invalid-presupuesto`);
  }

  // Verify the presupuesto belongs to this obra
  if (presupuesto.obra_id !== Number(obraId)) {
    redirect(`/obras/${obraId}?error=presupuesto-mismatch`);
  }

  // Transform presupuesto data to match expected format
  const presupuestoData: Record<string, TableItem[]> = Object.entries(presupuesto.data).reduce(
    (acc, [sectionName, items]) => {
      acc[sectionName] = items.map(item => ({
        id: String(item.id),
        name: item.name,
        unit: item.unit,
        quantity: item.quantity || 1,
        unitPrice: item.price,
        price: item.price,
        totalPrice: item.price * (item.quantity || 1),
        category: item.rubro?.toString() || '',
        parcial: 0,
        rubro: item.rubro || 0,
        accumulated: 0,
        element_tags: []
      }));
      return acc;
    },
    {} as Record<string, TableItem[]>
  );

  // Validate presupuesto data structure
  if (!presupuestoData || typeof presupuestoData !== 'object') {
    redirect(`/obras/${obraId}?error=invalid-presupuesto-data`);
  }

  // Validate obra dates
  if (!obra.fecha_inicio || !obra.fecha_fin) {
    redirect(`/obras/${obraId}?error=invalid-obra-dates`);
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Crear Medición para {obra.nombre}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Presupuesto: {presupuesto.nombre} - Total: ${presupuesto.total.toLocaleString('es-AR')}
      </p>
      <MedicionCreateClient
        obraId={obraId}
        obraName={obra.nombre}
        presupuestoData={presupuestoData}
        fechaInicio={obra.fecha_inicio}
        fechaFin={obra.fecha_fin}
      />
    </div>
  );
} 
// app/(sidebar)/obras/[id]/PresupuestosSelector.tsx
'use client'; // Make it a client component

import React from 'react';
// import { useObra } from '@/app/providers/ObraProvider'; // Remove this
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Assuming used for selection
import { Label } from "@/components/ui/label"; // Assuming used for selection
import { ClipboardPenLineIcon } from 'lucide-react'; // Example icon

// TODO: Define proper Presupuesto type
type Presupuesto = any;

// Define props needed from ObraPage dialogs
interface PresupuestosSelectorProps {
  presupuestos: Presupuesto[];
  selectedPresupuestoId: string | null;
  onSelectPresupuesto: (id: string | null) => void;
}

// Simplify the component to just render the selection based on props
export default function PresupuestosSelector({
  presupuestos,
  selectedPresupuestoId,
  onSelectPresupuesto
}: PresupuestosSelectorProps) {

  // Handle case where there are no presupuestos
  if (!presupuestos || presupuestos.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay presupuestos disponibles.</p>;
  }

  // Render a RadioGroup for selection
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Seleccionar Presupuesto</Label>
      <RadioGroup
        value={selectedPresupuestoId || undefined}
        onValueChange={(value) => onSelectPresupuesto(value)}
        className="space-y-2 max-h-60 overflow-y-auto" // Added scroll for long lists
      >
        {presupuestos.map((presupuesto) => (
          <div
            key={presupuesto.id}
            className={`
               flex items-center space-x-3 rounded-lg border p-4 transition-colors cursor-pointer
               ${selectedPresupuestoId === presupuesto.id.toString() ? 'bg-muted border-primary ring-1 ring-primary' : 'hover:bg-muted/50'}
             `}
            // Add onClick to Label container as well for better UX
            onClick={() => onSelectPresupuesto(presupuesto.id.toString())}
          >
            <RadioGroupItem
              value={presupuesto.id.toString()}
              id={`presupuesto-${presupuesto.id}`}
              checked={selectedPresupuestoId === presupuesto.id.toString()}
            />
            <Label
              htmlFor={`presupuesto-${presupuesto.id}`}
              className="flex-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {/* Example Icon */}
                <ClipboardPenLineIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium">{presupuesto.nombre || `Presupuesto ${presupuesto.id}`}</span>
                  <span className="text-sm text-muted-foreground">
                    {/* Display version or total - adapt as needed */}
                    {presupuesto.version ? `Versión: ${presupuesto.version}` :
                      presupuesto.total ? `Total: $${presupuesto.total.toLocaleString('es-AR')}` : ''}
                  </span>
                </div>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

// NOTE: This is a simplified version focusing on the selection functionality
// needed by the dialogs in ObraPage.tsx.
// The original component's logic for displaying editors (PresupuestoEditor, etc.)
// has been removed as it seemed out of place for a simple selector role
// and relied on the removed useObra hook.

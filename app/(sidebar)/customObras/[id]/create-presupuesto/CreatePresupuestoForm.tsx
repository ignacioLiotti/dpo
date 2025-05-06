"use client";

import type { Obra } from "@/utils/types/presupuesto";
import { createPresupuesto } from "../../actions";
import { PresupuestoEditor } from "../../components/PresupuestoEditor";

interface CreatePresupuestoFormProps {
  obra: Obra;
}

export function CreatePresupuestoForm({ obra }: CreatePresupuestoFormProps) {
  return (
    <PresupuestoEditor
      obra={obra}
      onSubmit={async (values) => {
        console.log(values);
        await createPresupuesto({
          obra_id: obra.id,
          ...values
        });
      }}
    />
  );
} 
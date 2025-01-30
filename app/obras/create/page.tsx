"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Field = {
  name: string;
  label: string;
  type: string; // e.g. 'text', 'number', 'date'...
};

type FieldSection = {
  sectionName: string;
  fields: Field[];
};

// Example: only a small subset of your actual fields.
const obraFieldSections: FieldSection[] = [
  {
    sectionName: "General Info",
    fields: [
      { name: "NombreObra", label: "Nombre de la Obra", type: "text" },
      { name: "Norma_Legal", label: "Norma Legal", type: "text" },
      { name: "Norma_Legal2", label: "Norma Legal 2", type: "text" },
      { name: "IdEmpresa", label: "IdEmpresa (Int)", type: "number" },
    ],
  },
  {
    sectionName: "Montos & Contratos",
    fields: [
      { name: "Monto_Contrato", label: "Monto Contrato (Float)", type: "number" },
      { name: "Plazo", label: "Plazo (Int)", type: "number" },
      { name: "Monto_Adicional_1", label: "Monto Adicional 1 (Float)", type: "number" },
      { name: "Monto_Adicional_2", label: "Monto Adicional 2 (Float)", type: "number" },
    ],
  },
  {
    sectionName: "Fechas",
    fields: [
      { name: "Fecha_de_Contrato", label: "Fecha de Contrato", type: "date" },
      { name: "Fecha_de_Inicio", label: "Fecha de Inicio", type: "date" },
      { name: "Fecha_de_Finalizaci_n", label: "Fecha de Finalización", type: "date" },
    ],
  },
  {
    sectionName: "Observaciones & Memorias",
    fields: [
      { name: "Observaciones", label: "Observaciones", type: "text" },
      { name: "Memoria_Desc", label: "Memoria Desc", type: "text" },
    ],
  },
  // ... Create as many sections as you like and add the rest of your fields
];

export default function CreateObraPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Handle changes from any input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Example: parse numeric or date fields if needed
    // if (formData["IdEmpresa"]) {
    //   formData["IdEmpresa"] = parseInt(formData["IdEmpresa"], 10);
    // }
    // if (formData["Monto_Contrato"]) {
    //   formData["Monto_Contrato"] = parseFloat(formData["Monto_Contrato"]);
    // }

    try {
      const res = await fetch("/api/obras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push("/db/obras");
      } else {
        console.error("Error creating obra:", await res.text());
      }
    } catch (error) {
      console.error("Error creating obra:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Obra</h1>

      <form onSubmit={handleSubmit}>
        {obraFieldSections.map((section) => (
          <div key={section.sectionName} className="mb-10">
            <h2 className="text-xl font-semibold mb-4">{section.sectionName}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                  // You can add required if needed:
                  // required
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex gap-4 pt-4">
          <Button type="submit">Create Obra</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/db/obras")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// app/customObras/create-obra/page.tsx

"use client";

import { useForm } from "@tanstack/react-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createObra } from "../actions";

export default function CreateObraPage() {
  const form = useForm({
    defaultValues: {
      nombre: "",
      localidad: ""
    },
    onSubmit: async ({ value }) => {
      await createObra(value);
    }
  });

  return (
    <main className="container max-w-lg py-8">
      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-2xl font-bold mb-6">Nueva Obra</h1>
          </div>

          <form.Field name="nombre">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  required
                  placeholder="ej: Construcción Edificio Central"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="localidad">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="localidad">Localidad</Label>
                <Input
                  id="localidad"
                  placeholder="ej: Buenos Aires"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <div className="pt-4">
            <Button type="submit" className="w-full">
              Crear Obra
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}



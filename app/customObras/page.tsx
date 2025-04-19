// app/customObras/page.tsx

import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Obra } from "@/types/presupuesto";

export default async function CustomObrasPage() {
  const supabase = await createClient();
  const { data: obras, error } = await supabase
    .from("obras")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Obras</h1>
        <Link href="/customObras/create-obra">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Obra
          </Button>
        </Link>
      </div>

      {obras?.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No hay obras creadas aún.</p>
          <Link href="/customObras/create-obra" className="mt-4 inline-block">
            <Button variant="secondary">Crear la primera obra</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {obras?.map((obra: Obra) => (
            <Link key={obra.id} href={`/customObras/${obra.id}`}>
              <Card className="p-6 hover:shadow-lg transition-shadow h-full">
                <h2 className="text-xl font-semibold mb-2">{obra.nombre}</h2>
                {obra.localidad && (
                  <p className="text-muted-foreground">{obra.localidad}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}





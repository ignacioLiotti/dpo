"use client";

import { useDataCollection } from "@/lib/hooks/useDataCollection";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { LoadingPage } from "@/components/loading";

export default function ObrasPage() {
  const { data: obras, loading, error } = useDataCollection("obra");

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Obras</h1>
        <Link href="/obras/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Obra
          </Button>
        </Link>
      </div>
      <DataTable columns={columns} data={obras} />
    </div>
  );
}
import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export type Obra = {
  id: number;
  NombreObra: string;
  Monto_Contrato: number;
  Fecha_de_Inicio: string;
  Fecha_de_Finalizaci_n: string;
  data: {
    estado: string;
    avance: number;
    ubicacion: string;
    departamento: string;
    empresa: string;
    memoria: string;
  };
};

export const columns: ColumnDef<Obra>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "NombreObra",
    header: "Nombre",
    cell: ({ row }) => {
      const obra = row.original;
      return (
        <div>
          <div className="font-medium">{obra.NombreObra}</div>
          {obra.data.memoria && (
            <div className="text-sm text-gray-500 truncate max-w-[300px]">
              {obra.data.memoria}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "Monto_Contrato",
    header: "Monto Contrato",
    cell: ({ row }) => formatCurrency(row.original.Monto_Contrato),
  },
  {
    accessorKey: "data.empresa",
    header: "Empresa",
  },
  {
    accessorKey: "data.estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.original.data.estado;
      return (
        <Badge
          variant={
            estado === "Certificado"
              ? "outline"
              : estado === "En Ejecución"
                ? "default"
                : "secondary"
          }
        >
          {estado}
        </Badge>
      );
    },
  },
  {
    accessorKey: "Fecha_de_Inicio",
    header: "Fecha Inicio",
    cell: ({ row }) => formatDate(row.original.Fecha_de_Inicio),
  },
  {
    accessorKey: "Fecha_de_Finalizaci_n",
    header: "Fecha Fin",
    cell: ({ row }) => formatDate(row.original.Fecha_de_Finalizaci_n),
  },
  {
    accessorKey: "data.ubicacion",
    header: "Ubicación",
  },
  {
    accessorKey: "data.departamento",
    header: "Departamento",
  },
  {
    accessorKey: "data.avance",
    header: "Avance",
    cell: ({ row }) => {
      const avance = row.original.data.avance;
      return (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${avance || 0}%` }}
          />
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const obra = row.original;
      return (
        <Link href={`/obras/${obra.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      );
    },
  },
]; 
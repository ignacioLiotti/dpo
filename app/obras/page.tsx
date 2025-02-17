"use client";

import { Key, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useObras } from "@/utils/hooks/useObras";
interface Obra {
  id: number;
  nombre: string;
  montoContrato: number;
  ubicacion: string;
  idEmpresa: string;
  idReparticion: string;
  idAvance: string;
  idInspectores: string;
  idProyectista: string;
  responsableProyecto: string;
  idLocalidad: string;
  departamento: string;
  plazo: string;
  fecha_contrato: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  Fechalicit: string;
  Edificio: string;
  prioridad: string;
  Proyecto: string;
  inaugurada: string;
  fechaInauguracion: string;
  data: any;
  created_at: string;
  updated_at: string;
}

export default function ObrasPage() {

  const [obras, setObras] = useState<Obra[]>([]);
  useEffect(() => {
    useObras().then((data) => {
      // @ts-ignore
      setObras(data);
    });
  }, []);

  console.log("obras", obras);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Obras</h1>
        <Link href="/obras/create">
          <Button>Create New</Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Fecha Inicio</TableHead>
            <TableHead>Fecha Fin</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {obras.map((obra) => (
            <TableRow key={obra.id}>
              <TableCell>{obra.id}</TableCell>
              <TableCell>{obra.nombre}</TableCell>
              <TableCell>{obra.ubicacion}</TableCell>
              <TableCell>{obra.idEmpresa}</TableCell>
              <TableCell>{new Date(obra.fecha_inicio).toLocaleDateString()}</TableCell>
              <TableCell>{obra.fecha_fin ? new Date(obra.fecha_fin).toLocaleDateString() : '-'}</TableCell>
              <TableCell>{obra.estado}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Link href={`/obras/${obra.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  <Link href={`/obras/${obra.id}/edit`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
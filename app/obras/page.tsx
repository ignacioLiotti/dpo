"use client";

import { Key, ReactNode, useEffect, useState } from "react";
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

interface Obra {
  IdObras: Key | null | undefined;
  NombreObra: ReactNode;
  Norma_Legal: ReactNode;
  Monto_Contrato: ReactNode;
  IdEmpresa: ReactNode;
  IdInspectores: ReactNode;
  IdReparticion: ReactNode;
  IdAvance: ReactNode;
  Plazo: ReactNode;
  IdModalidad: ReactNode;
  IdLocalidad: ReactNode;
  IdAreas: ReactNode;
  Fecha_de_Contrato: ReactNode;
  Fecha_de_Inicio: ReactNode;
  Fecha_de_Finalizaci__n: ReactNode;
  Memoria_Desc: ReactNode;
  Codigo_Meta: ReactNode;
  Departamento: ReactNode;
  Monto_Adicional_1: ReactNode;
  Plazo_Adicional1: ReactNode;
  Final_adicional1: ReactNode;
  Monto_Adicional_2: ReactNode;
  Plazo_Adicional2: ReactNode;
  Final_adicional2: ReactNode;
  Plazo_Adicional3: ReactNode;
  Final_adicional3: ReactNode;
  IdProyectista: ReactNode;
  Norma1: ReactNode;
  Norma2: ReactNode;
  Norma3: ReactNode;
  Amp_Cont1: ReactNode;
  Amp_Cont2: ReactNode;
  Observaciones: ReactNode;
  Monto_Adicional_3: ReactNode;
  Amp_Cont3: ReactNode;
  Redet_monto_1: ReactNode;
  Redet_monto_2: ReactNode;
  Redet_monto_3: ReactNode;
  Redet_norma_1: ReactNode;
  Redet_norma_2: ReactNode;
  Redet_norma_3: ReactNode;
  Proyecto: ReactNode;
  A__oTerminada: ReactNode;
  Expte: ReactNode;
  pliego: ReactNode;
  basico: ReactNode;
  prioridad: ReactNode;
  fuenteO: ReactNode;
  Edificio: ReactNode;
  pptoof: ReactNode;
  p: ReactNode;
  Fechalicit: ReactNode;
  ResponsableProy: ReactNode;
  Fechapliego: ReactNode;
  Fechaelevado: ReactNode;
  NormaARP: ReactNode;
  NormaARD: ReactNode;
  fechaARP: ReactNode;
  fechaARD: ReactNode;
  inaugurada: ReactNode;
  ainaugurar: ReactNode;
  fechainaugur: ReactNode;
  noinaugur: ReactNode;
  observinaugur: ReactNode;
  id: number;
  nombre: string;
  ubicacion: string;
  estado: string;
  fechaInicio: Date;
}

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);

  useEffect(() => {
    fetch("/api/obras")
      .then((res) => res.json())
      .then((data) => {
        setObras(data);
      });
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Obras</h1>
        <Link href="/db/obras/create">
          <Button>Create New</Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Norma Legal</TableHead>
            <TableHead>Monto Contrato</TableHead>
            <TableHead>Id Empresa</TableHead>
            <TableHead>Id Inspectores</TableHead>
            <TableHead>Id Reparticion</TableHead>
            <TableHead>Id Avance</TableHead>
            <TableHead>Plazo</TableHead>
            <TableHead>Id Modalidad</TableHead>
            <TableHead>Id Localidad</TableHead>
            <TableHead>Id Areas</TableHead>
            <TableHead>Fecha de Contrato</TableHead>
            <TableHead>Fecha de Inicio</TableHead>
            <TableHead>Fecha de Finalización</TableHead>
            <TableHead>Memoria Desc</TableHead>
            <TableHead>Codigo Meta</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Monto Adicional 1</TableHead>
            <TableHead>Plazo Adicional 1</TableHead>
            <TableHead>Final Adicional 1</TableHead>
            <TableHead>Monto Adicional 2</TableHead>
            <TableHead>Plazo Adicional 2</TableHead>
            <TableHead>Final Adicional 2</TableHead>
            <TableHead>Plazo Adicional 3</TableHead>
            <TableHead>Final Adicional 3</TableHead>
            <TableHead>Id Proyectista</TableHead>
            <TableHead>Norma 1</TableHead>
            <TableHead>Norma 2</TableHead>
            <TableHead>Norma 3</TableHead>
            <TableHead>Amp Cont 1</TableHead>
            <TableHead>Amp Cont 2</TableHead>
            <TableHead>Observaciones</TableHead>
            <TableHead>Monto Adicional 3</TableHead>
            <TableHead>Amp Cont 3</TableHead>
            <TableHead>Redet Monto 1</TableHead>
            <TableHead>Redet Monto 2</TableHead>
            <TableHead>Redet Monto 3</TableHead>
            <TableHead>Redet Norma 1</TableHead>
            <TableHead>Redet Norma 2</TableHead>
            <TableHead>Redet Norma 3</TableHead>
            <TableHead>Proyecto</TableHead>
            <TableHead>Año Terminada</TableHead>
            <TableHead>Expte</TableHead>
            <TableHead>Pliego</TableHead>
            <TableHead>Basico</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Fuente O</TableHead>
            <TableHead>Edificio</TableHead>
            <TableHead>Pptoof</TableHead>
            <TableHead>P</TableHead>
            <TableHead>Fecha Licit</TableHead>
            <TableHead>Responsable Proy</TableHead>
            <TableHead>Fecha Pliego</TableHead>
            <TableHead>Fecha Elevado</TableHead>
            <TableHead>Norma ARP</TableHead>
            <TableHead>Norma ARD</TableHead>
            <TableHead>Fecha ARP</TableHead>
            <TableHead>Fecha ARD</TableHead>
            <TableHead>Inaugurada</TableHead>
            <TableHead>Ainaugurar</TableHead>
            <TableHead>Fecha Inaugur</TableHead>
            <TableHead>Noinaugur</TableHead>
            <TableHead>Observ Inaugur</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {obras.map((obra) => (
            <TableRow key={obra.IdObras}>
              <TableCell>{obra.IdObras}</TableCell>
              <TableCell>{obra.NombreObra}</TableCell>
              <TableCell>{obra.Norma_Legal}</TableCell>
              <TableCell>{obra.Monto_Contrato}</TableCell>
              <TableCell>{obra.IdEmpresa}</TableCell>
              <TableCell>{obra.IdInspectores}</TableCell>
              <TableCell>{obra.IdReparticion}</TableCell>
              <TableCell>{obra.IdAvance}</TableCell>
              <TableCell>{obra.Plazo}</TableCell>
              <TableCell>{obra.IdModalidad}</TableCell>
              <TableCell>{obra.IdLocalidad}</TableCell>
              <TableCell>{obra.IdAreas}</TableCell>
              <TableCell>{obra.Fecha_de_Contrato}</TableCell>
              <TableCell>{obra.Fecha_de_Inicio}</TableCell>
              <TableCell>{obra.Fecha_de_Finalizaci__n}</TableCell>
              <TableCell>{obra.Memoria_Desc}</TableCell>
              <TableCell>{obra.Codigo_Meta}</TableCell>
              <TableCell>{obra.Departamento}</TableCell>
              <TableCell>{obra.Monto_Adicional_1}</TableCell>
              <TableCell>{obra.Plazo_Adicional1}</TableCell>
              <TableCell>{obra.Final_adicional1}</TableCell>
              <TableCell>{obra.Monto_Adicional_2}</TableCell>
              <TableCell>{obra.Plazo_Adicional2}</TableCell>
              <TableCell>{obra.Final_adicional2}</TableCell>
              <TableCell>{obra.Plazo_Adicional3}</TableCell>
              <TableCell>{obra.Final_adicional3}</TableCell>
              <TableCell>{obra.IdProyectista}</TableCell>
              <TableCell>{obra.Norma1}</TableCell>
              <TableCell>{obra.Norma2}</TableCell>
              <TableCell>{obra.Norma3}</TableCell>
              <TableCell>{obra.Amp_Cont1}</TableCell>
              <TableCell>{obra.Amp_Cont2}</TableCell>
              <TableCell>{obra.Observaciones}</TableCell>
              <TableCell>{obra.Monto_Adicional_3}</TableCell>
              <TableCell>{obra.Amp_Cont3}</TableCell>
              <TableCell>{obra.Redet_monto_1}</TableCell>
              <TableCell>{obra.Redet_monto_2}</TableCell>
              <TableCell>{obra.Redet_monto_3}</TableCell>
              <TableCell>{obra.Redet_norma_1}</TableCell>
              <TableCell>{obra.Redet_norma_2}</TableCell>
              <TableCell>{obra.Redet_norma_3}</TableCell>
              <TableCell>{obra.Proyecto}</TableCell>
              <TableCell>{obra.A__oTerminada}</TableCell>
              <TableCell>{obra.Expte}</TableCell>
              <TableCell>{obra.pliego}</TableCell>
              <TableCell>{obra.basico}</TableCell>
              <TableCell>{obra.prioridad}</TableCell>
              <TableCell>{obra.fuenteO}</TableCell>
              <TableCell>{obra.Edificio}</TableCell>
              <TableCell>{obra.pptoof}</TableCell>
              <TableCell>{obra.p}</TableCell>
              <TableCell>{obra.Fechalicit}</TableCell>
              <TableCell>{obra.ResponsableProy}</TableCell>
              <TableCell>{obra.Fechapliego}</TableCell>
              <TableCell>{obra.Fechaelevado}</TableCell>
              <TableCell>{obra.NormaARP}</TableCell>
              <TableCell>{obra.NormaARD}</TableCell>
              <TableCell>{obra.fechaARP}</TableCell>
              <TableCell>{obra.fechaARD}</TableCell>
              <TableCell>{obra.inaugurada}</TableCell>
              <TableCell>{obra.ainaugurar}</TableCell>
              <TableCell>{obra.fechainaugur}</TableCell>
              <TableCell>{obra.noinaugur}</TableCell>
              <TableCell>{obra.observinaugur}</TableCell>
              <TableCell>
                {/* Add your action buttons here */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
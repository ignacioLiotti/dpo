"use client";

import { useEffect, useState } from "react";

interface Obra {
  IdObras: number;
  NombreObra: string | null;
  Norma_Legal: string | null;
  Monto_Contrato: number | null;
  IdEmpresa: number | null;
  IdInspectores: number | null;
  IdReparticion: number | null;
  IdAvance: number | null;
  Plazo: number | null;
  IdModalidad: number | null;
  IdLocalidad: number | null;
  IdAreas: number | null;
  Fecha_de_Contrato: Date | null;
  Fecha_de_Inicio: Date | null;
  Fecha_de_Finalización: Date | null;
  Memoria_Desc: string | null;
  Codigo_Meta: string | null;
  Departamento: number | null;
  Monto_Adicional_1: number | null;
  Plazo_Adicional1: number | null;
  Final_adicional1: Date | null;
  Monto_Adicional_2: number | null;
  Plazo_Adicional2: number | null;
  Final_adicional2: Date | null;
  Plazo_Adicional3: number | null;
  Final_adicional3: Date | null;
  IdProyectista: number | null;
  Norma1: string | null;
  Norma2: string | null;
  Norma3: string | null;
  Amp_Cont1: string | null;
  Amp_Cont2: string | null;
  Observaciones: string | null;
  Monto_Adicional_3: number | null;
  Amp_Cont3: string | null;
  Redet_monto_1: number | null;
  Redet_monto_2: number | null;
  Redet_monto_3: number | null;
  Redet_norma_1: string | null;
  Redet_norma_2: string | null;
  Redet_norma_3: string | null;
  Proyecto: number | null;
  AñoTerminada: number | null;
  Expte: string | null;
  pliego: number | null;
  basico: string | null;
  prioridad: number | null;
  fuenteO: number | null;
  Edificio: number | null;
  pptoof: number | null;
  '3p': number | null;
  Fechalicit: Date | null;
  ResponsableProy: string | null;
  Fechapliego: Date | null;
  Fechaelevado: Date | null;
  NormaARP: string | null;
  NormaARD: string | null;
  fechaARP: Date | null;
  fechaARD: Date | null;
  inaugurada: number | null;
  ainaugurar: number | null;
  fechainaugur: Date | null;
  noinaugur: number | null;
  observinaugur: string | null;
}

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);

  useEffect(() => {
    // Call our local route
    fetch("/api/obras")
      .then((res) => res.json())
      .then((data) => {
        const formattedData = data.map((obra: Obra) => ({
          ...obra,
          Fecha_de_Contrato: obra.Fecha_de_Contrato ? new Date(obra.Fecha_de_Contrato) : null,
          Fecha_de_Inicio: obra.Fecha_de_Inicio ? new Date(obra.Fecha_de_Inicio) : null,
          Fecha_de_Finalización: obra.Fecha_de_Finalización ? new Date(obra.Fecha_de_Finalización) : null,
          Final_adicional1: obra.Final_adicional1 ? new Date(obra.Final_adicional1) : null,
          Final_adicional2: obra.Final_adicional2 ? new Date(obra.Final_adicional2) : null,
          Final_adicional3: obra.Final_adicional3 ? new Date(obra.Final_adicional3) : null,
          Fechalicit: obra.Fechalicit ? new Date(obra.Fechalicit) : null,
          Fechapliego: obra.Fechapliego ? new Date(obra.Fechapliego) : null,
          Fechaelevado: obra.Fechaelevado ? new Date(obra.Fechaelevado) : null,
          fechaARP: obra.fechaARP ? new Date(obra.fechaARP) : null,
          fechaARD: obra.fechaARD ? new Date(obra.fechaARD) : null,
          fechainaugur: obra.fechainaugur ? new Date(obra.fechainaugur) : null,
        }));
        setObras(formattedData);
      });
  }, []);

  console.log(obras);

  if (obras.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="font-bold text-xl mb-4">Obras</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Nombre Obra</th>
            <th className="border px-2 py-1">Norma Legal</th>
            <th className="border px-2 py-1">Monto Contrato</th>
            <th className="border px-2 py-1">Fecha de Contrato</th>
            <th className="border px-2 py-1">Fecha de Inicio</th>
            <th className="border px-2 py-1">Fecha de Finalización</th>
          </tr>
        </thead>
        <tbody>
          {obras.map((obra) => (
            <tr key={obra.IdObras}>
              <td className="border px-2 py-1 text-center">{obra.IdObras}</td>
              <td className="border px-2 py-1">{obra.NombreObra}</td>
              <td className="border px-2 py-1">{obra.Norma_Legal}</td>
              <td className="border px-2 py-1">{obra.Monto_Contrato}</td>
              <td className="border px-2 py-1">{obra.Fecha_de_Contrato?.toLocaleDateString()}</td>
              <td className="border px-2 py-1">{obra.Fecha_de_Inicio?.toLocaleDateString()}</td>
              <td className="border px-2 py-1">{obra.Fecha_de_Finalización?.toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

interface Certificacion {
  IdCertificado: number;
  NumCertificado: string | null;
  Monto: number | null;
  MesCertificado: Date | null;
  IdObras: number | null;
  IdTipos: number | null;
  IdInspectores: number | null;
  IdEmpresa: number | null;
  MesBasico: Date | null;
  FechaLiq: Date | null;
  FechaIng: Date | null;
  pagado: number | null;
  netoapagar: number | null;
  fuente: number | null;
  numexpte: string | null;
  provisorio: number | null;
}

export default function CertificacionesPage() {
  const [certificaciones, setCertificaciones] = useState<Certificacion[]>([]);

  useEffect(() => {
    // Call our local route
    fetch("/api/certificaciones")
      .then((res) => res.json())
      .then((data) => {
        const formattedData = data.map((certificado: Certificacion) => ({
          ...certificado,
          MesCertificado: certificado.MesCertificado ? new Date(certificado.MesCertificado) : null,
          MesBasico: certificado.MesBasico ? new Date(certificado.MesBasico) : null,
          FechaLiq: certificado.FechaLiq ? new Date(certificado.FechaLiq) : null,
          FechaIng: certificado.FechaIng ? new Date(certificado.FechaIng) : null,
        }));
        setCertificaciones(formattedData);
      });
  }, []);

  console.log(certificaciones);

  if (certificaciones.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="font-bold text-xl mb-4">Certificaciones</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">NumCertificado</th>
            <th className="border px-2 py-1">Monto</th>
            <th className="border px-2 py-1">MesCertificado</th>
            <th className="border px-2 py-1">IdObras</th>
            <th className="border px-2 py-1">IdTipos</th>
            <th className="border px-2 py-1">IdInspectores</th>
            <th className="border px-2 py-1">IdEmpresa</th>
            <th className="border px-2 py-1">MesBasico</th>
            <th className="border px-2 py-1">FechaLiq</th>
            <th className="border px-2 py-1">FechaIng</th>
            <th className="border px-2 py-1">Pagado</th>
            <th className="border px-2 py-1">Neto a Pagar</th>
            <th className="border px-2 py-1">Fuente</th>
            <th className="border px-2 py-1">NumExpte</th>
            <th className="border px-2 py-1">Provisorio</th>
          </tr>
        </thead>
        <tbody>
          {certificaciones.map((certificado) => (
            <tr key={certificado.IdCertificado}>
              <td className="border px-2 py-1 text-center">{certificado.IdCertificado}</td>
              <td className="border px-2 py-1">{certificado.NumCertificado}</td>
              <td className="border px-2 py-1">{certificado.Monto}</td>
              <td className="border px-2 py-1">{certificado.MesCertificado?.toLocaleDateString()}</td>
              <td className="border px-2 py-1">{certificado.IdObras}</td>
              <td className="border px-2 py-1">{certificado.IdTipos}</td>
              <td className="border px-2 py-1">{certificado.IdInspectores}</td>
              <td className="border px-2 py-1">{certificado.IdEmpresa}</td>
              <td className="border px-2 py-1">{certificado.MesBasico?.toLocaleDateString()}</td>
              <td className="border px-2 py-1">{certificado.FechaLiq?.toLocaleDateString()}</td>
              <td className="border px-2 py-1">{certificado.FechaIng?.toLocaleDateString()}</td>
              <td className="border px-2 py-1">{certificado.pagado}</td>
              <td className="border px-2 py-1">{certificado.netoapagar}</td>
              <td className="border px-2 py-1">{certificado.fuente}</td>
              <td className="border px-2 py-1">{certificado.numexpte}</td>
              <td className="border px-2 py-1">{certificado.provisorio}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

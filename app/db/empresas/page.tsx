"use client";

import { useEffect, useState } from "react";

interface Empresa {
  IdEmpresa: number;
  Nombreempresa: string | null;
  Responsable: string | null;
  Dirección: string | null;
  Telefono: string | null;
  Cuit: string | null;
  Observaciones: string | null;
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  useEffect(() => {
    // Call our local route
    fetch("/api/empresas")
      .then((res) => res.json())
      .then((data) => {
        setEmpresas(data);
      });
  }, []);

  return (
    <div className="p-4">
      <h1 className="font-bold text-xl mb-4">Empresas</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Nombre</th>
            <th className="border px-2 py-1">Responsable</th>
            <th className="border px-2 py-1">Dirección</th>
            <th className="border px-2 py-1">Teléfono</th>
            <th className="border px-2 py-1">Cuit</th>
            <th className="border px-2 py-1">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {empresas.map((empresa) => (
            <tr key={empresa.IdEmpresa}>
              <td className="border px-2 py-1 text-center">{empresa.IdEmpresa}</td>
              <td className="border px-2 py-1">{empresa.Nombreempresa}</td>
              <td className="border px-2 py-1">{empresa.Responsable}</td>
              <td className="border px-2 py-1">{empresa.Dirección}</td>
              <td className="border px-2 py-1">{empresa.Telefono}</td>
              <td className="border px-2 py-1">{empresa.Cuit}</td>
              <td className="border px-2 py-1">{empresa.Observaciones}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
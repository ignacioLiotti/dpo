"use client";

import { useEffect, useState } from "react";

interface Inspector {
  IdInspectores: number;
  Tratamiento: string | null;
  Apellido: string | null;
  Nombres: string | null;
  Campo1: string | null;
  Dirección: string | null;
  Teléfono: string | null;
  Inspector: number | null;
}

export default function InspectoresPage() {
  const [inspectores, setInspectores] = useState<Inspector[]>([]);

  useEffect(() => {
    // Call our local route
    fetch("/api/inspectores")
      .then((res) => res.json())
      .then((data) => {
        setInspectores(data);
      });
  }, []);

  if (inspectores.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="font-bold text-xl mb-4">Inspectores</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Tratamiento</th>
            <th className="border px-2 py-1">Apellido</th>
            <th className="border px-2 py-1">Nombres</th>
            <th className="border px-2 py-1">Campo1</th>
            <th className="border px-2 py-1">Dirección</th>
            <th className="border px-2 py-1">Teléfono</th>
            <th className="border px-2 py-1">Inspector</th>
          </tr>
        </thead>
        <tbody>
          {inspectores.map((inspector) => (
            <tr key={inspector.IdInspectores}>
              <td className="border px-2 py-1 text-center">{inspector.IdInspectores}</td>
              <td className="border px-2 py-1">{inspector.Tratamiento}</td>
              <td className="border px-2 py-1">{inspector.Apellido}</td>
              <td className="border px-2 py-1">{inspector.Nombres}</td>
              <td className="border px-2 py-1">{inspector.Campo1}</td>
              <td className="border px-2 py-1">{inspector.Dirección}</td>
              <td className="border px-2 py-1">{inspector.Teléfono}</td>
              <td className="border px-2 py-1">{inspector.Inspector}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

interface Proyectista {
  IdProyectista: number;
  Tratamiento: string | null;
  Apellido: string | null;
  Nombres: string | null;
  Campo1: string | null;
  Dirección: string | null;
  Teléfono: string | null;
  Inspector: number | null;
}

export default function ProyectistasPage() {
  const [proyectistas, setProyectistas] = useState<Proyectista[]>([]);

  useEffect(() => {
    // Call our local route
    fetch("/api/proyectistas")
      .then((res) => res.json())
      .then((data) => {
        setProyectistas(data);
      });
  }, []);

  console.log(proyectistas);

  if (proyectistas.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="font-bold text-xl mb-4">Proyectistas</h1>
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
          {proyectistas.map((proyectista) => (
            <tr key={proyectista.IdProyectista}>
              <td className="border px-2 py-1 text-center">{proyectista.IdProyectista}</td>
              <td className="border px-2 py-1">{proyectista.Tratamiento}</td>
              <td className="border px-2 py-1">{proyectista.Apellido}</td>
              <td className="border px-2 py-1">{proyectista.Nombres}</td>
              <td className="border px-2 py-1">{proyectista.Campo1}</td>
              <td className="border px-2 py-1">{proyectista.Dirección}</td>
              <td className="border px-2 py-1">{proyectista.Teléfono}</td>
              <td className="border px-2 py-1">{proyectista.Inspector}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
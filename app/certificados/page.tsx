'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Certificado {
  id: number;
  presupuestoId: number;
  documentoJson: any;
  fechaCreacion: string;
  certificadoAnteriorId: number | null;
  presupuesto: any;
}

export default function CertificadosPage() {
  const [certificados, setCertificados] = useState<Certificado[]>([]);

  useEffect(() => {
    fetch('/api/certificados')
      .then(res => res.json())
      .then(data => setCertificados(data))
      .catch(error => console.error('Error fetching certificados:', error));
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Certificados Mensuales</h1>
        <Link href="/certificados/new">
          <Button>Crear Nuevo Certificado</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificados.map((certificado) => (
          <Link href={`/certificados/${certificado.id}`} key={certificado.id}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Certificado #{certificado.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Presupuesto: {certificado.presupuesto?.id}
                </p>
                <p className="text-sm text-gray-500">
                  Fecha: {new Date(certificado.fechaCreacion).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Certificado Anterior: {certificado.certificadoAnteriorId || 'Primero'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 
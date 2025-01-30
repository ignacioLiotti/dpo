'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface Certificado {
  id: number;
  presupuestoId: number;
  documentoJson: any;
  fechaCreacion: string;
  certificadoAnteriorId: number | null;
  presupuesto: any;
  certificadoAnterior: any;
  certificadoSiguiente: any;
}

export default function CertificadoPage() {
  const pathname = usePathname();
  const router = useRouter();
  const id = pathname.split('/').pop();
  const [certificado, setCertificado] = useState<Certificado | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/certificados/${id}`)
        .then(res => res.json())
        .then(data => setCertificado(data))
        .catch(error => console.error('Error fetching certificado:', error));
    }
  }, [id]);

  const handleDelete = async () => {
    if (confirm('¿Está seguro que desea eliminar este certificado?')) {
      try {
        const response = await fetch(`/api/certificados/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          router.push('/certificados');
        }
      } catch (error) {
        console.error('Error deleting certificado:', error);
      }
    }
  };

  if (!certificado) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Certificado #{certificado.id}</h1>
        <div className="space-x-4">
          <Link href="/certificados">
            <Button variant="outline">Volver</Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Certificado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                <strong>Presupuesto:</strong> {certificado.presupuesto?.id}
              </p>
              <p>
                <strong>Fecha de Creación:</strong>{" "}
                {new Date(certificado.fechaCreacion).toLocaleDateString()}
              </p>
              <p>
                <strong>Certificado Anterior:</strong>{" "}
                {certificado.certificadoAnterior
                  ? `#${certificado.certificadoAnterior.id}`
                  : "Primero"}
              </p>
              <p>
                <strong>Certificado Siguiente:</strong>{" "}
                {certificado.certificadoSiguiente
                  ? `#${certificado.certificadoSiguiente.id}`
                  : "Ninguno"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documento JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(certificado.documentoJson, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
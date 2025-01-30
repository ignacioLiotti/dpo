'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function NewCertificadoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    presupuestoId: '',
    documentoJson: '',
    certificadoAnteriorId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const jsonData = JSON.parse(formData.documentoJson);
      const response = await fetch('/api/certificados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presupuestoId: parseInt(formData.presupuestoId),
          documentoJson: jsonData,
          certificadoAnteriorId: formData.certificadoAnteriorId ? parseInt(formData.certificadoAnteriorId) : null,
        }),
      });

      if (response.ok) {
        router.push('/certificados');
      } else {
        alert('Error al crear el certificado');
      }
    } catch (error) {
      console.error('Error creating certificado:', error);
      alert('Error: El JSON ingresado no es válido');
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Nuevo Certificado</h1>
        <Link href="/certificados">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Certificado</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="presupuestoId">ID del Presupuesto</Label>
              <Input
                id="presupuestoId"
                type="number"
                required
                value={formData.presupuestoId}
                onChange={(e) =>
                  setFormData({ ...formData, presupuestoId: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificadoAnteriorId">
                ID del Certificado Anterior (opcional)
              </Label>
              <Input
                id="certificadoAnteriorId"
                type="number"
                value={formData.certificadoAnteriorId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    certificadoAnteriorId: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentoJson">Documento JSON</Label>
              <Textarea
                id="documentoJson"
                required
                className="min-h-[200px] font-mono"
                value={formData.documentoJson}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, documentoJson: e.target.value })
                }
                placeholder="{\n  // Ingrese el JSON del documento aquí\n}"
              />
            </div>

            <Button type="submit">Crear Certificado</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
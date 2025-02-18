'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useObra } from '@/app/providers/ObraProvider';
import type { Certificado, Medicion, TableItem } from '@/types';

interface CertificadoEditorProps {
  certificado: Certificado;
  medicion: Medicion;
  presupuestoData: Record<string, TableItem[]>;
  display?: boolean;
  onUpdate?: (certificado: Certificado) => void;
}

export function CertificadoEditor({
  certificado,
  medicion,
  presupuestoData,
  display = false,
  onUpdate
}: CertificadoEditorProps) {
  const { dispatch } = useObra();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (display) return;

    try {
      const response = await fetch('/api/certificados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          obraId: certificado.obra_id,
          medicionId: medicion.id,
          periodo: certificado.periodo,
          data: {
            presupuestoData,
            editedData: certificado.data.editedData
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el certificado');
      }

      const newCertificado = await response.json();
      dispatch({
        type: 'ADD_CERTIFICADO',
        payload: newCertificado
      });

      onUpdate?.(newCertificado);
      alert('Certificado guardado exitosamente!');
    } catch (error) {
      console.error('Error saving certificado:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar el certificado');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Certificado de Obra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium">Periodo:</p>
              <p>{format(new Date(certificado.periodo), 'MMMM yyyy', { locale: es })}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Fecha de Creación:</p>
              <p>{format(new Date(certificado.created_at), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio Unitario</TableHead>
                <TableHead>Anterior</TableHead>
                <TableHead>Presente</TableHead>
                <TableHead>Acumulado</TableHead>
                <TableHead>Importe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(presupuestoData).map(([section, items]) => (
                <React.Fragment key={section}>
                  <TableRow>
                    <TableCell colSpan={8} className="font-medium bg-muted">
                      {section}
                    </TableCell>
                  </TableRow>
                  {items.map((item) => {
                    const medicionSection = medicion.data.secciones.find(s => s.nombre === section);
                    const medicionItem = medicionSection?.items.find(i => i.id === item.id);
                    const totalAmount = item.unitPrice * (medicionItem?.acumulado || 0) / 100;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.unitPrice.toLocaleString('es-AR')}</TableCell>
                        <TableCell>{medicionItem?.anterior || 0}%</TableCell>
                        <TableCell>{medicionItem?.presente || 0}%</TableCell>
                        <TableCell>{medicionItem?.acumulado || 0}%</TableCell>
                        <TableCell>${totalAmount.toLocaleString('es-AR')}</TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>

          {!display && (
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Guardar Certificado
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
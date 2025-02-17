"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Medicion {
  id: number;
  month: string;
  measurements: Record<string, number>;
}

interface MedicionSelectorProps {
  obraId: string;
  onSelect: (medicionId: number) => void;
}

export default function MedicionSelector({ obraId, onSelect }: MedicionSelectorProps) {
  const [mediciones, setMediciones] = useState<Medicion[]>([]);
  const [selectedMedicion, setSelectedMedicion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMediciones = async () => {
      try {
        const response = await fetch(`/api/obras/${obraId}/mediciones`);
        if (!response.ok) {
          throw new Error("Error al cargar las mediciones");
        }
        const data = await response.json();
        setMediciones(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchMediciones();
  }, [obraId]);

  const handleMedicionSelect = (medicionId: number) => {
    setSelectedMedicion(medicionId);
    onSelect(medicionId);
  };

  if (loading) {
    return <div>Cargando mediciones...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (mediciones.length === 0) {
    return <div>No hay mediciones disponibles</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Seleccione una medición</h3>
      <RadioGroup
        value={selectedMedicion?.toString()}
        onValueChange={(value) => handleMedicionSelect(parseInt(value))}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Items Medidos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mediciones.map((medicion) => (
              <TableRow key={medicion.id}>
                <TableCell className="w-[50px]">
                  <RadioGroupItem
                    value={medicion.id.toString()}
                    id={`medicion-${medicion.id}`}
                  />
                </TableCell>
                <TableCell>
                  <Label htmlFor={`medicion-${medicion.id}`}>
                    {new Date(medicion.month).toLocaleDateString('es-AR', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Label>
                </TableCell>
                <TableCell>
                  {Object.keys(medicion.measurements).length} items
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RadioGroup>
    </Card>
  );
} 
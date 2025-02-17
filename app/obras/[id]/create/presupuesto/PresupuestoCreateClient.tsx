"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import MedicionSelector from "./MedicionSelector";

interface PresupuestoCreateClientProps {
  obraId: string;
  obraData: any;
  currentStep: number;
}

export default function PresupuestoCreateClient({
  obraId,
  obraData,
  currentStep,
}: PresupuestoCreateClientProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<{ month: string; value: number }[]>([]);
  const [selectedMedicionId, setSelectedMedicionId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Generate months between fechaInicio and fechaFin
    const startDate = new Date(obraData.fecha_inicio);
    const endDate = new Date(obraData.fecha_fin);
    const months: { month: string; value: number }[] = [];

    let currentDate = startDate;
    while (currentDate <= endDate) {
      months.push({
        month: currentDate.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
        value: 0
      });
      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    }

    setProgress(months);
  }, [obraData.fecha_inicio, obraData.fecha_fin]);

  const handleProgressChange = (index: number, value: string) => {
    const newProgress = [...progress];
    newProgress[index] = {
      ...newProgress[index],
      value: Number(value) || 0
    };
    setProgress(newProgress);
  };

  const handleMedicionSelect = (medicionId: number) => {
    setSelectedMedicionId(medicionId);
  };

  const handleSave = async () => {
    if (!selectedMedicionId) {
      alert("Por favor seleccione una medición");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/presupuestos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          obraId: Number(obraId),
          medicionId: selectedMedicionId,
          progress: progress,
          data: obraData.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar el presupuesto");
      }

      router.push(`/obras/${obraId}`);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Información General</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(obraData.data || {}).map(([key, value]) => {
                if (typeof value === 'string' || typeof value === 'number') {
                  return (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-medium">{key}</label>
                      <p className="text-gray-600">{value}</p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </Card>
        );

      case 2:
        return (
          <MedicionSelector
            obraId={obraId}
            onSelect={handleMedicionSelect}
          />
        );

      case 3:
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Progreso de la Obra</h2>
            <div className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead>Progreso (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progress.map((item, index) => (
                    <TableRow key={item.month}>
                      <TableCell>{item.month}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.value}
                          onChange={(e) => handleProgressChange(index, e.target.value)}
                          className="w-24"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="w-full overflow-x-auto">
                <LineChart
                  width={800}
                  height={400}
                  data={progress}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    name="Progreso (%)"
                  />
                </LineChart>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentStep === 2 && !selectedMedicionId) {
      alert("Por favor seleccione una medición antes de continuar");
      return;
    }

    if (currentStep < 3) {
      router.push(`/obras/${obraId}/create/presupuesto?step=${currentStep + 1}`);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      router.push(`/obras/${obraId}/create/presupuesto?step=${currentStep - 1}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full ${step === currentStep ? "bg-primary" : "bg-gray-300"
                }`}
            />
          ))}
        </div>
        <div className="space-x-4">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              Anterior
            </Button>
          )}
          {currentStep < 3 && (
            <Button onClick={handleNext}>
              Siguiente
            </Button>
          )}
          {currentStep === 3 && (
            <Button
              variant="default"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          )}
        </div>
      </div>

      {renderStep()}
    </div>
  );
} 
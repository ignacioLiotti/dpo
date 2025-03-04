"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { MedicionesEditor } from "@/components/editores/MedicionesEditor";
import type { Medicion, TableItem, CertificadoProgress, Certificado } from '@/types';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHead } from "@/components/ui/table";
import { EditableInput } from "@/components/Table/EditableInput";
import { useObra } from "@/app/providers/ObraProvider";

interface CertificadoCreateClientProps {
  obraId: string;
  obraName: string;
  presupuestoData: Record<string, TableItem[]>;
  selectedMedicion: Medicion;
  fechaInicio: string;
  fechaFin: string;
  obraData: Record<string, any>;
  display?: boolean;
  certificado?: Certificado;
}

interface ProrrogaItem {
  nroProrroga: string;
  disposicion: string;
  plazo: string;
  fechaDeFinalizacion: string;
}

interface AmpliacionItem {
  nroAmpliacion: string;
  nroResolucion: string;
  nroExpediente: string;
  Monto: string;
}

interface GarantiaItem {
  nroPoliza: string;
  sumaPoliza: string;
  nombrePoliza: string;
}

const InfoRow = ({ label, value, path, onChange, editable }: {
  label: string;
  value: string | number;
  path: string;
  onChange: (path: string, value: any) => void;
  editable: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleChange = (newValue: string) => {
    setEditValue(newValue);
    onChange(path, newValue);
  };

  return (
    <div className="flex justify-between group relative">
      <span className="text-gray-600">{label}</span>
      {editable ? (
        <Input
          icon={false}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="font-medium border-none bg-transparent rounded-none shadow-none outline outline-2 outline-transparent hover:underline decoration-gray-300 hover:outline-gray-300 focus:outline-gray-300 focus-visible:outline-gray-300 focus-visible:ring-0 focus:border-none transition-all"
        />
      ) : (
        <span className="block p-2 hover:bg-gray-50 rounded transition-colors">
          {value}
        </span>
      )}
    </div>
  );
};

export default function CertificadoCreateClient({
  obraId,
  obraName,
  presupuestoData,
  selectedMedicion,
  fechaInicio,
  fechaFin,
  obraData,
  display = false,
  certificado
}: CertificadoCreateClientProps) {
  const router = useRouter();
  const { refetchAll } = useObra();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('aca obraData', obraData);
  console.log('aca certificado', certificado);

  // Generate progress array based on date range
  const generateProgressArray = () => {
    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);
    const months: CertificadoProgress[] = [];

    let currentDate = startDate;
    while (currentDate <= endDate) {
      months.push({
        month: format(currentDate, 'MMMM', { locale: es }),
        value1: 0,
        value2: 0,
        value3: 0
      });
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    return months;
  };

  const [editedData, setEditedData] = useState<Record<string, any>>(
    obraData || certificado?.data.editedData || {
      localidad: '',
      contratista: '',
      numeroLicitacion: '',
      nroResolucion: '',
      imputacion: '',
      fechaContrato: '',
      fechaInicio: '',
      plazo: '',
      prorroga: [],
      Ampliacion: [],
      Balance: {},
      Certificacion: {},
      garantias: [],
      autores: [],
      links: []
    }
  );
  const [progress, setProgress] = useState<CertificadoProgress[]>(
    certificado?.data.progress || generateProgressArray()
  );

  if (!selectedMedicion.periodo) {
    return <div>No hay período seleccionado</div>;
  }

  const handleDataChange = (path: string, value: any) => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = { ...editedData };

    for (const key of keys) {
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
    setEditedData({ ...editedData });
  };

  const handleProgressChange = (index: number, field: 'value1' | 'value2' | 'value3', value: string) => {
    const newProgress = [...progress];
    newProgress[index] = {
      ...newProgress[index],
      [field]: Number(value) || 0
    };
    setProgress(newProgress);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/certificados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          obra_id: Number(obraId),
          medicion_id: selectedMedicion.id,
          periodo: selectedMedicion.periodo,
          data: {
            editedData,
            presupuestoData,
            progress,
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Error al crear el certificado");
      }

      await refetchAll();
      router.push(`/obras/${obraId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  const totalItems = selectedMedicion.data.secciones.reduce((acc, seccion) => acc + seccion.items.length, 0);
  const totalAcumulado = selectedMedicion.data.secciones.reduce((acc, seccion) =>
    acc + seccion.items.reduce((itemAcc, item) => itemAcc + item.acumulado, 0), 0);
  const promedioAcumulado = totalItems > 0 ? (totalAcumulado / totalItems).toFixed(2) : "0";

  return (
    <div className="space-y-8">
      {!display && (
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Generar Certificado"}
          </Button>
        </div>
      )}

      <div className="space-y-8">
        <Card className="max-w-[1000px] mx-auto p-8 bg-white shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-start mb-12 bg-gray-50 -m-8 p-8 rounded-2xl">
            <div>
              <div className="w-16 h-16 bg-gray-200 mb-4"></div>
              <h1 className="text-xl font-bold text-gray-800">Gobierno Provincial</h1>
              <div className="text-gray-600">
                <p>Ministerio de Obras y Servicios Públicos</p>
                <p>DPO</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">CERTIFICADO DE OBRA</h2>
              <div className="text-gray-600">
                <p>N° Expediente: {editedData.nroExpediente || '-'}</p>
                <p>Fecha: {format(parseISO(selectedMedicion.periodo), 'dd/MM/yyyy')}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Basic Info Section */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-[14px] font-bold bg-input/20 rounded-lg p-2 pl-4 flex items-center justify-between gap-2">Información Básica</h3>
                <div className="space-y-2 px-4">
                  <InfoRow label="UBICACIÓN" value={editedData.localidad || ''} path="localidad" onChange={handleDataChange} editable={!display} />
                  <InfoRow label="CONTRATISTA" value={editedData.contratista || ''} path="contratista" onChange={handleDataChange} editable={!display} />
                  <InfoRow label="N° LICITACIÓN" value={editedData.numeroLicitacion || ''} path="numeroLicitacion" onChange={handleDataChange} editable={!display} />
                  <InfoRow label="N° RESOLUCIÓN" value={editedData.nroResolucion || ''} path="nroResolucion" onChange={handleDataChange} editable={!display} />
                  <InfoRow label="IMPUTACIÓN" value={editedData.imputacion || ''} path="imputacion" onChange={handleDataChange} editable={!display} />
                </div>
              </div>
              <div>
                <h3 className="text-[14px] font-bold bg-input/20 rounded-lg p-2 pl-4 flex items-center justify-between gap-2">Fechas y Plazos</h3>
                <div className="space-y-2 px-4">
                  <InfoRow label="FECHA DE CONTRATO" value={editedData.fechaContrato || ''} path="fechaContrato" onChange={handleDataChange} editable={!display} />
                  <InfoRow label="FECHA DE INICIO" value={editedData.fechaInicio || ''} path="fechaInicio" onChange={handleDataChange} editable={!display} />
                  <InfoRow label="PLAZO (DÍAS)" value={editedData.plazo || ''} path="plazo" onChange={handleDataChange} editable={!display} />
                </div>
              </div>
            </div>

            {/* Table Sections */}
            <div className="space-y-6">
              <div>
                <h3 className="text-[14px] font-bold bg-input/20 rounded-lg p-2 pl-4 flex items-center justify-between gap-2">Prórrogas</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="text-left py-2 text-gray-600 bg-white">N° Prórroga</TableHead>
                      <TableHead className="text-left py-2 text-gray-600 bg-white">Disposición</TableHead>
                      <TableHead className="text-left py-2 text-gray-600 bg-white">Plazo</TableHead>
                      <TableHead className="text-left py-2 text-gray-600 bg-white">Fecha Finalización</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(editedData.prorroga || []).map((item: ProrrogaItem, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="py-2 border-r hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] cursor-text">
                          <EditableInput
                            editable={!display}
                            value={item.nroProrroga || ''}
                            onChange={(val) => handleDataChange(`prorroga.${index}.nroProrroga`, val)}
                          />
                        </TableCell>
                        <TableCell className="py-2 border-r hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] cursor-text">
                          <EditableInput
                            editable={!display}
                            value={item.disposicion || ''}
                            onChange={(val) => handleDataChange(`prorroga.${index}.disposicion`, val)}
                          />
                        </TableCell>
                        <TableCell className="py-2 border-r hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] cursor-text">
                          <EditableInput
                            editable={!display}
                            value={item.plazo || ''}
                            onChange={(val) => handleDataChange(`prorroga.${index}.plazo`, val)}
                          />
                        </TableCell>
                        <TableCell className="py-2 hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] cursor-text">
                          <EditableInput
                            editable={!display}
                            value={item.fechaDeFinalizacion || ''}
                            onChange={(val) => handleDataChange(`prorroga.${index}.fechaDeFinalizacion`, val)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="text-[14px] font-bold bg-input/20 rounded-lg p-2 pl-4 flex items-center justify-between gap-2">Ampliaciones</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="text-left py-2 text-gray-600 bg-white">N° Ampliación</TableHead>
                      <TableHead className="text-left py-2 text-gray-600 bg-white">N° Resolución</TableHead>
                      <TableHead className="text-left py-2 text-gray-600 bg-white">N° Expediente</TableHead>
                      <TableHead className="text-right py-2 text-gray-600 bg-white">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(editedData.Ampliacion || []).map((item: AmpliacionItem, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="py-2 border-r hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] cursor-text">
                          <EditableInput
                            editable={!display}
                            value={item.nroAmpliacion || ''}
                            onChange={(val) => handleDataChange(`Ampliacion.${index}.nroAmpliacion`, val)}
                          />
                        </TableCell>
                        <TableCell className="py-2 border-r hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] cursor-text">
                          <EditableInput
                            editable={!display}
                            value={item.nroResolucion || ''}
                            onChange={(val) => handleDataChange(`Ampliacion.${index}.nroResolucion`, val)}
                          />
                        </TableCell>
                        <TableCell className="py-2 border-r hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] cursor-text">
                          <EditableInput
                            editable={!display}
                            value={item.nroExpediente || ''}
                            onChange={(val) => handleDataChange(`Ampliacion.${index}.nroExpediente`, val)}
                          />
                        </TableCell>
                        <TableCell className="py-2 text-right hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] cursor-text">
                          <EditableInput
                            editable={!display}
                            value={item.Monto || ''}
                            onChange={(val) => handleDataChange(`Ampliacion.${index}.Monto`, val)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Financial Information */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-[14px] font-bold bg-input/20 rounded-lg p-2 pl-4 flex items-center justify-between gap-2">Balance</h3>
                <div className="space-y-2 px-4">
                  {Object.entries(editedData.Balance || {}).map(([key, value]) => (
                    <InfoRow
                      key={key}
                      label={key.toUpperCase()}
                      value={value as string}
                      path={`Balance.${key}`}
                      onChange={handleDataChange}
                      editable={!display}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[14px] font-bold bg-input/20 rounded-lg p-2 pl-4 flex items-center justify-between gap-2">Certificación</h3>
                <div className="space-y-2 px-4">
                  {Object.entries(editedData.Certificacion || {}).map(([key, value]) => (
                    <InfoRow
                      key={key}
                      label={key.toUpperCase()}
                      value={value as string}
                      path={`Certificacion.${key}`}
                      onChange={handleDataChange}
                      editable={!display}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Guarantees */}
            <div>
              <h3 className="text-[14px] font-bold bg-input/20 rounded-lg p-2 pl-4 flex items-center justify-between gap-2">Garantías</h3>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="text-left py-2 text-gray-600 bg-white">N° Póliza</TableHead>
                    <TableHead className="text-left py-2 text-gray-600 bg-white">Suma Asegurada</TableHead>
                    <TableHead className="text-left py-2 text-gray-600 bg-white">Nombre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(editedData.garantias || []).map((item: GarantiaItem, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="py-2 border-r hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] cursor-text">
                        <EditableInput
                          editable={!display}
                          value={item.nroPoliza || ''}
                          onChange={(val) => handleDataChange(`garantias.${index}.nroPoliza`, val)}
                        />
                      </TableCell>
                      <TableCell className="py-2 border-r hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] cursor-text">
                        <EditableInput
                          editable={!display}
                          value={item.sumaPoliza || ''}
                          onChange={(val) => handleDataChange(`garantias.${index}.sumaPoliza`, val)}
                        />
                      </TableCell>
                      <TableCell className="py-2 hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] cursor-text ">
                        <EditableInput
                          editable={!display}
                          value={item.nombrePoliza || ''}
                          onChange={(val) => handleDataChange(`garantias.${index}.nombrePoliza`, val)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-[14px] font-bold bg-input/20 rounded-lg p-2 pl-4 flex items-center justify-between gap-2">Información Adicional</h3>
              <div className="grid grid-cols-2 gap-8 px-4">
                <div>
                  <h4 className="text-gray-600 text-sm mb-1">AUTORES</h4>
                  {(editedData.autores || []).map((autor: string, index: number) => (
                    <EditableInput
                      editable={!display}
                      key={index}
                      value={autor}
                      onChange={(val) => handleDataChange(`autores.${index}`, val)}
                    />
                  ))}
                </div>
                <div>
                  <h4 className="text-gray-600 text-sm mb-1">LINKS</h4>
                  {(editedData.links || []).map((link: string, index: number) => (
                    <EditableInput
                      editable={!display}
                      key={index}
                      value={link}
                      onChange={(val) => handleDataChange(`links.${index}`, val)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Page 2: Medicion Details */}
        <MedicionesEditor
          medicion={selectedMedicion}
          presupuestoData={certificado?.data.presupuestoData || presupuestoData}
          display={true}
          obraId={Number(obraId)}
        />

        {/* Page 3: Summary */}
        <Card className="p-6 max-w-[1000px] mx-auto shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Resumen del Certificado</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Obra</Label>
                <p className="text-muted-foreground">{obraName}</p>
              </div>
              <div className="space-y-2">
                <Label>Período</Label>
                <p className="text-muted-foreground">
                  {format(parseISO(selectedMedicion.periodo), 'MMMM yyyy', { locale: es })}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Items Medidos</Label>
                <p className="text-muted-foreground">
                  {totalItems} items
                </p>
              </div>
              <div className="space-y-2">
                <Label>Progreso Promedio</Label>
                <p className="text-muted-foreground">
                  {promedioAcumulado}%
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Progreso Mensual</h3>
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Línea 1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">Línea 2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-gray-600">Línea 3</span>
                  </div>
                </div>
              </div>

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
                    dataKey="value1"
                    stroke="#3b82f6"
                    name="Línea 1"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="value2"
                    stroke="#22c55e"
                    name="Línea 2"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="value3"
                    stroke="#a855f7"
                    name="Línea 3"
                    strokeWidth={2}
                  />
                </LineChart>
              </div>

              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead>Valor 1</TableHead>
                      <TableHead>Valor 2</TableHead>
                      <TableHead>Valor 3</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progress.map((item: CertificadoProgress, index: number) => (
                      <TableRow key={item.month}>
                        <TableCell>{item.month}</TableCell>
                        <TableCell>
                          <EditableInput
                            editable={!display}
                            value={item.value1}
                            onChange={(val) => handleProgressChange(index, 'value1', val)}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableInput
                            editable={!display}
                            value={item.value2}
                            onChange={(val) => handleProgressChange(index, 'value2', val)}
                          />
                        </TableCell>
                        <TableCell>
                          <EditableInput
                            editable={!display}
                            value={item.value3}
                            onChange={(val) => handleProgressChange(index, 'value3', val)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {!display && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Guardando..." : "Guardar Certificado"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  toggleFolderExtraction,
  getFolderFieldDefinitions,
  applyExtractionTemplate,
  createFolderFieldDefinition,
  getFolderExtractedData
} from '../actions/folder-extraction-actions';
import { deleteFolderAction } from '../actions/document-actions';
import type { Folder, FolderFieldDefinition } from '../types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FolderSettingsDialogProps {
  folder: Folder | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function FolderSettingsDialog({
  folder,
  isOpen,
  onClose,
  onUpdate
}: FolderSettingsDialogProps) {
  const [extractionEnabled, setExtractionEnabled] = useState(false);
  const [fieldDefinitions, setFieldDefinitions] = useState<FolderFieldDefinition[]>([]);
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const router = useRouter();

  useEffect(() => {
    if (folder && isOpen) {
      setExtractionEnabled(folder.extract_data || false);
      loadFieldDefinitions();
      if (folder.extract_data) {
        loadExtractedData();
      }
    }
  }, [folder, isOpen]);

  const loadFieldDefinitions = async () => {
    if (!folder) return;

    setLoading(true);
    try {
      const { fields, error } = await getFolderFieldDefinitions(folder.id);
      if (error) {
        console.error('Error loading fields:', error);
        toast.error('Error al cargar definiciones de campos');
      } else {
        setFieldDefinitions(fields);
      }
    } catch (error) {
      console.error('Error loading field definitions:', error);
      toast.error('Error al cargar definiciones de campos');
    } finally {
      setLoading(false);
    }
  };

  const loadExtractedData = async () => {
    if (!folder) return;

    console.log('folder', folder.id);

    try {
      const { data, error } = await getFolderExtractedData(folder.id);
      if (error) {
        console.error('Error loading extracted data:', error);
        toast.error('Error al cargar datos extraídos');
      } else {
        setExtractedData(data);
      }
    } catch (error) {
      console.error('Error loading extracted data:', error);
      toast.error('Error al cargar datos extraídos');
    }
  };

  const handleToggleExtraction = async (enabled: boolean) => {
    if (!folder) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('folder_id', folder.id);
      formData.append('enable_extraction', enabled.toString());

      await toggleFolderExtraction(formData);

      setExtractionEnabled(enabled);
      toast.success(
        enabled
          ? 'Extracción de datos habilitada'
          : 'Extracción de datos deshabilitada'
      );
      if (enabled) {
        await loadExtractedData();
      } else {
        setExtractedData([]);
      }
      onUpdate?.();
      router.refresh();
    } catch (error) {
      console.error('Error toggling extraction:', error);
      toast.error('Error al cambiar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (templateName: string) => {
    if (!folder) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('folder_id', folder.id);
      formData.append('template_name', templateName);

      await applyExtractionTemplate(formData);

      toast.success('Plantilla aplicada correctamente');
      setExtractionEnabled(true);
      await loadFieldDefinitions();
      await loadExtractedData();
      onUpdate?.();
      router.refresh();
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Error al aplicar plantilla');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folder) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar la carpeta "${folder.name}"?\n\n` +
      `Esta acción:\n` +
      `• Eliminará la carpeta permanentemente\n` +
      `• Desvinculará todos los documentos de la carpeta (los documentos no se eliminarán)\n` +
      `• Eliminará todas las definiciones de campos y datos extraídos\n` +
      `• No se puede deshacer\n\n` +
      `¿Continuar?`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      const formData = new FormData();
      formData.append('id', folder.id);

      await deleteFolderAction(formData);

      toast.success('Carpeta eliminada correctamente');
      onUpdate?.();
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar carpeta');
    } finally {
      setDeleting(false);
    }
  };

  if (!folder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{folder.icon || '📁'}</span>
            Configuración de "{folder.name}"
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="settings">Configuración</TabsTrigger>
            <TabsTrigger value="fields">Campos</TabsTrigger>
            <TabsTrigger value="templates">Plantillas</TabsTrigger>
            <TabsTrigger value="data" disabled={!extractionEnabled}>Datos Extraídos</TabsTrigger>
            <TabsTrigger value="danger" className="text-red-600">⚠️ Eliminar</TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto mt-4">
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🤖 Extracción Automática de Datos
                  </CardTitle>
                  <CardDescription>
                    Habilita la extracción automática de datos estructurados de los documentos
                    subidos a esta carpeta usando OCR e IA.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Extracción de Datos</p>
                      <p className="text-sm text-muted-foreground">
                        {extractionEnabled
                          ? 'Los documentos se procesarán automáticamente'
                          : 'Los documentos se almacenarán sin procesar'
                        }
                      </p>
                    </div>
                    <Switch
                      checked={extractionEnabled}
                      onCheckedChange={handleToggleExtraction}
                      disabled={loading}
                    />
                  </div>

                  {extractionEnabled && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-600">ℹ️</span>
                        <p className="font-medium text-blue-800">Funcionalidades Habilitadas</p>
                      </div>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• OCR automático en imágenes y PDFs</li>
                        <li>• Extracción de campos personalizados</li>
                        <li>• Búsqueda en contenido de documentos</li>
                        <li>• Generación de tablas de datos</li>
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Campos Definidos</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {fieldDefinitions.length}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Estado</p>
                      <Badge variant={extractionEnabled ? "default" : "secondary"}>
                        {extractionEnabled ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fields" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p>Cargando campos...</p>
                </div>
              ) : fieldDefinitions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-lg font-medium mb-1">No hay campos definidos</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Aplica una plantilla o define campos personalizados para comenzar
                    </p>
                    <Button
                      onClick={() => setActiveTab('templates')}
                      variant="outline"
                    >
                      Ver Plantillas
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {fieldDefinitions.map((field) => (
                    <FieldDefinitionCard key={field.id} field={field} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid gap-4">
                <TemplateCard
                  title="📄 Facturas"
                  description="Extrae número de factura, monto total, fecha y proveedor"
                  fields={['Número de Factura', 'Monto Total', 'Fecha', 'Proveedor']}
                  onApply={() => handleApplyTemplate('invoice')}
                  disabled={loading}
                />
                <TemplateCard
                  title="📋 Contratos"
                  description="Extrae número de contrato, monto, fechas y contratista"
                  fields={['Número de Contrato', 'Monto', 'Fecha Inicio', 'Fecha Fin', 'Contratista']}
                  onApply={() => handleApplyTemplate('contract')}
                  disabled={loading}
                />
                <TemplateCard
                  title="🏛️ Permisos"
                  description="Extrae número de permiso, fechas y autoridad emisora"
                  fields={['Número de Permiso', 'Fecha Emisión', 'Fecha Vencimiento', 'Autoridad']}
                  onApply={() => handleApplyTemplate('permit')}
                  disabled={loading}
                />
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p>Cargando datos extraídos...</p>
                </div>
              ) : extractedData.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-lg font-medium mb-1">No hay datos extraídos</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Los documentos subidos a esta carpeta aparecerán aquí con sus datos extraídos
                    </p>
                    {!extractionEnabled && (
                      <Button
                        onClick={() => setActiveTab('settings')}
                        variant="outline"
                      >
                        Habilitar Extracción
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <ExtractedDataTable data={extractedData} fieldDefinitions={fieldDefinitions} />
              )}
            </TabsContent>

            <TabsContent value="danger" className="space-y-6">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    ⚠️ Zona de Peligro
                  </CardTitle>
                  <CardDescription>
                    Acciones irreversibles. Procede con precaución.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="text-red-600 text-xl">🗑️</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-red-800 mb-1">
                          Eliminar Carpeta
                        </h4>
                        <p className="text-sm text-red-700 mb-3">
                          Elimina permanentemente esta carpeta y toda su configuración. 
                          Los documentos no se eliminarán, pero se desvincularan de la carpeta.
                        </p>
                        <ul className="text-xs text-red-600 mb-4 space-y-1">
                          <li>• Se eliminará la carpeta permanentemente</li>
                          <li>• Se desvincularan todos los documentos (no se eliminan)</li>
                          <li>• Se eliminaran todas las definiciones de campos</li>
                          <li>• Se eliminaran todos los datos extraídos</li>
                          <li>• Esta acción no se puede deshacer</li>
                        </ul>
                        <Button
                          onClick={handleDeleteFolder}
                          disabled={deleting || loading}
                          variant="destructive"
                          size="sm"
                        >
                          {deleting ? 'Eliminando...' : 'Eliminar Carpeta'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldDefinitionCard({ field }: { field: FolderFieldDefinition }) {
  const getTypeIcon = (type: string) => {
    const icons = {
      text: '📝',
      number: '🔢',
      date: '📅',
      currency: '💰',
      boolean: '☑️',
      email: '📧',
      phone: '📞',
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  const getMethodBadge = (method: string) => {
    const variants = {
      regex: 'secondary',
      ai: 'default',
      hybrid: 'outline',
    } as const;
    return variants[method as keyof typeof variants] || 'secondary';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getTypeIcon(field.field_type)}</span>
            <div>
              <h4 className="font-semibold">{field.field_label}</h4>
              <p className="text-sm text-muted-foreground">
                {field.field_name} • {field.field_type}
                {field.is_required && <span className="text-red-500"> *</span>}
              </p>
            </div>
          </div>
          <Badge variant={getMethodBadge(field.extraction_method)}>
            {field.extraction_method}
          </Badge>
        </div>

        {field.field_description && (
          <p className="text-sm text-muted-foreground mt-2">{field.field_description}</p>
        )}

        <div className="mt-3 p-2 bg-muted rounded text-sm font-mono">
          {field.extraction_pattern}
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateCard({
  title,
  description,
  fields,
  onApply,
  disabled
}: {
  title: string;
  description: string;
  fields: string[];
  onApply: () => void;
  disabled: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Campos incluidos:</p>
            <div className="flex flex-wrap gap-1">
              {fields.map((field) => (
                <Badge key={field} variant="outline" className="text-xs">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
          <Button
            onClick={onApply}
            disabled={disabled}
            className="w-full"
            variant="outline"
          >
            {disabled ? 'Aplicando...' : 'Aplicar Plantilla'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Component to display extracted data in a table
function ExtractedDataTable({
  data,
  fieldDefinitions
}: {
  data: any[];
  fieldDefinitions: any[]
}) {
  if (data.length === 0) {
    return null;
  }

  // Get all unique field names from extracted data
  const allFieldNames = new Set<string>();
  data.forEach(item => {
    if (item.extracted_data) {
      Object.keys(item.extracted_data).forEach(key => allFieldNames.add(key));
    }
  });

  // Map field names to their definitions for better display
  const fieldLabels = fieldDefinitions.reduce((acc, field) => {
    acc[field.field_name] = field.field_label;
    return acc;
  }, {} as Record<string, string>);

  const formatValue = (value: any, fieldName: string) => {
    if (value === null || value === undefined) {
      return '-';
    }

    // Find field definition to determine type
    const field = fieldDefinitions.find(f => f.field_name === fieldName);

    if (field?.field_type === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
      }).format(value);
    }

    if (field?.field_type === 'date' && typeof value === 'string') {
      try {
        const date = new Date(value);
        return date.toLocaleDateString('es-AR');
      } catch {
        return value;
      }
    }

    return String(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Datos Extraídos ({data.length} documentos)</h3>
        <Badge variant="secondary">
          {Array.from(allFieldNames).length} campos únicos
        </Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Documento</TableHead>
              <TableHead className="w-[120px]">Fecha</TableHead>
              <TableHead className="w-[100px]">Confianza</TableHead>
              {Array.from(allFieldNames).map(fieldName => (
                <TableHead key={fieldName}>
                  {fieldLabels[fieldName] || fieldName}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="space-y-1">
                    <div className="truncate max-w-[180px]" title={item.obra_documents?.name}>
                      {item.obra_documents?.name || 'Sin nombre'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.field_count || 0} campos
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(item.updated_at).toLocaleDateString('es-AR')}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.extraction_confidence > 0.8 ? 'default' :
                        item.extraction_confidence > 0.5 ? 'secondary' :
                          'destructive'
                    }
                  >
                    {Math.round((item.extraction_confidence || 0) * 100)}%
                  </Badge>
                </TableCell>
                {Array.from(allFieldNames).map(fieldName => (
                  <TableCell key={fieldName}>
                    {formatValue(
                      item.extracted_data?.[fieldName],
                      fieldName
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
        <div className="flex items-center gap-2 mb-1">
          <span>ℹ️</span>
          <span className="font-medium">Información de la tabla</span>
        </div>
        <ul className="space-y-1 ml-6">
          <li>• Los datos se extraen automáticamente cuando se suben documentos a esta carpeta</li>
          <li>• La confianza indica qué tan precisa fue la extracción (Verde: Alta, Gris: Media, Rojo: Baja)</li>
          <li>• Los campos vacíos aparecen con "-" cuando no se pudo extraer información</li>
        </ul>
      </div>
    </div>
  );
}
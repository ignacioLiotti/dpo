'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bug, RefreshCw, Database, FileText, Settings, AlertTriangle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Folder, ObraDocument } from '../types';

interface ExtractionDebugPanelProps {
  folder: Folder;
  documents: ObraDocument[];
  className?: string;
}

interface DebugInfo {
  folderInfo: any;
  fieldDefinitions: any[];
  extractedDataRecords: any[];
  documentsWithData: any[];
  dbQuery: any;
}

export function ExtractionDebugPanel({ folder, documents, className }: ExtractionDebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const runDebugAnalysis = async () => {
    setLoading(true);
    
    try {
      // Call our debug API
      const response = await fetch(`/api/debug/folder-extraction/${folder.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setDebugInfo(data);
        console.log('🔍 DEBUG ANALYSIS RESULTS:', data);
      } else {
        console.error('Debug API error:', data);
      }
    } catch (error) {
      console.error('Error running debug analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !debugInfo) {
      runDebugAnalysis();
    }
  }, [isOpen]);

  const documentsWithExtractedData = documents.filter(doc => 
    doc.extracted_data && Object.keys(doc.extracted_data).length > 0
  );

  const processingStatusSummary = documents.reduce((acc, doc) => {
    const status = doc.processing_status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-red-500" />
                Debug: Extracción de Datos
              </div>
              <div className="flex items-center gap-2">
                {documentsWithExtractedData.length > 0 ? (
                  <Badge variant="default" className="text-xs">
                    ✓ {documentsWithExtractedData.length} con datos
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    ⚠ Sin datos extraídos
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {isOpen ? '▲' : '▼'}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Quick Status Overview */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="font-medium">Estado de Carpeta:</div>
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>{folder.extract_data ? '✅ Extracción habilitada' : '❌ Extracción deshabilitada'}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="font-medium">Documentos:</div>
                <div className="flex flex-col gap-1">
                  <div>📄 Total: {documents.length}</div>
                  <div>✅ Con datos: {documentsWithExtractedData.length}</div>
                </div>
              </div>
            </div>

            {/* Processing Status */}
            <div className="space-y-2">
              <div className="font-medium text-sm">Estados de Procesamiento:</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(processingStatusSummary).map(([status, count]) => (
                  <Badge 
                    key={status} 
                    variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Debug Analysis Button */}
            <div className="flex gap-2">
              <Button
                onClick={runDebugAnalysis}
                disabled={loading}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {loading ? 'Analizando...' : 'Ejecutar Análisis Completo'}
              </Button>
            </div>

            {/* Debug Results */}
            {debugInfo && (
              <div className="space-y-3 border-t pt-3">
                <div className="font-medium text-sm">Resultados del Análisis:</div>
                
                {/* Field Definitions */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Definiciones de Campos:</div>
                  {debugInfo.fieldDefinitions.length > 0 ? (
                    <div className="space-y-1">
                      {debugInfo.fieldDefinitions.map((field: any, index: number) => (
                        <div key={index} className="text-xs bg-muted p-2 rounded">
                          <div className="font-medium">{field.field_label} ({field.field_name})</div>
                          <div className="text-muted-foreground">
                            Tipo: {field.field_type} | Activo: {field.is_active ? '✅' : '❌'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      ❌ No se encontraron definiciones de campos
                    </div>
                  )}
                </div>

                {/* Extracted Data Records */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Registros de Datos Extraídos (DB):</div>
                  {debugInfo.extractedDataRecords.length > 0 ? (
                    <div className="space-y-1">
                      {debugInfo.extractedDataRecords.map((record: any, index: number) => (
                        <div key={index} className="text-xs bg-green-50 p-2 rounded border border-green-200">
                          <div className="font-medium">Documento ID: {record.document_id}</div>
                          <div className="text-muted-foreground">
                            Campos: {record.field_count} | Confianza: {record.extraction_confidence}
                          </div>
                          <div className="mt-1 text-xs">
                            Datos: {JSON.stringify(record.extracted_data).substring(0, 100)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      ❌ No hay registros de datos extraídos en la base de datos
                    </div>
                  )}
                </div>

                {/* Documents with Data in UI */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Documentos con Datos en la UI:</div>
                  {documentsWithExtractedData.length > 0 ? (
                    <div className="space-y-1">
                      {documentsWithExtractedData.map((doc: any, index: number) => (
                        <div key={index} className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-muted-foreground">
                            Estado: {doc.processing_status} | Campos: {Object.keys(doc.extracted_data).length}
                          </div>
                          <div className="mt-1 text-xs">
                            {Object.keys(doc.extracted_data).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      ❌ Ningún documento tiene datos extraídos visibles en la UI
                    </div>
                  )}
                </div>

                {/* Console Log Reminder */}
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                  💡 <strong>Tip:</strong> Los resultados completos están disponibles en la consola del navegador
                </div>
              </div>
            )}

            {/* Action Items */}
            <div className="space-y-2 border-t pt-3">
              <div className="text-sm font-medium">Acciones Recomendadas:</div>
              <div className="space-y-1 text-xs">
                {!folder.extract_data && (
                  <div className="text-red-600">• Habilitar extracción de datos en configuración de carpeta</div>
                )}
                {debugInfo && debugInfo.fieldDefinitions.length === 0 && (
                  <div className="text-red-600">• Crear definiciones de campos para la carpeta</div>
                )}
                {debugInfo && debugInfo.extractedDataRecords.length === 0 && (
                  <div className="text-red-600">• Procesar documentos para extraer datos</div>
                )}
                {debugInfo && debugInfo.extractedDataRecords.length > 0 && documentsWithExtractedData.length === 0 && (
                  <div className="text-red-600">• Problema en la carga de datos extraídos en la UI</div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
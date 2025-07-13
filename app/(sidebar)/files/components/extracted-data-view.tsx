'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Download, Filter, RefreshCw } from 'lucide-react';
import type { ObraDocument, Folder } from '../types';

interface ExtractedDataViewProps {
  documents: ObraDocument[];
  currentFolder: Folder | null;
  extractedData?: any[];
}

interface ExtractedField {
  field_name: string;
  field_label: string;
  field_type: string;
  value: any;
  document_id: string;
  document_name: string;
}

export function ExtractedDataView({ documents, currentFolder, extractedData = [] }: ExtractedDataViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = () => {
    setLoading(true);
    window.location.reload();
  };

  // Transform the extracted data for display
  const transformedData = extractedData.flatMap(record => {
    let extractedFields = {};
    let documentName = 'Unknown Document';
    let documentId = '';

    // Handle different data structures
    if (record.extracted_data) {
      // This is the fallback format from file_analysis
      extractedFields = record.extracted_data;
      documentName = record.files?.name || record.obra_documents?.name || 'Unknown Document';
      documentId = record.document_id || record.files?.id || '';
    } else if (record.extracted_value) {
      // This is the new format from extracted_data table
      try {
        extractedFields = JSON.parse(record.extracted_value);
        documentId = record.file_id;
        // Find the document name from the documents prop
        const matchingDoc = documents.find(doc => doc.id === record.file_id);
        documentName = matchingDoc?.name || `File ${record.file_id.substring(0, 8)}...`;
      } catch (error) {
        console.error('Error parsing extracted_value:', error);
        return [];
      }
    } else {
      // Skip records without extractable data
      return [];
    }

    // Convert the fields to the expected format
    return Object.entries(extractedFields).map(([fieldName, value]) => ({
      field_name: fieldName,
      field_label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      field_type: typeof value === 'number' ? 'number' :
        typeof value === 'boolean' ? 'boolean' :
          value && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? 'date' : 'text',
      value,
      document_id: documentId,
      document_name: documentName
    }));
  });

  const exportData = () => {
    if (!transformedData.length) return;

    // Group data by document
    const groupedData = transformedData.reduce((acc, field) => {
      if (!acc[field.document_id]) {
        acc[field.document_id] = {
          document_name: field.document_name,
          data: {}
        };
      }
      acc[field.document_id].data[field.field_name] = field.value;
      return acc;
    }, {} as Record<string, { document_name: string; data: Record<string, any> }>);

    // Convert to CSV
    const headers = ['Document', ...Array.from(new Set(transformedData.map(f => f.field_label)))];
    const rows = Object.values(groupedData).map(doc => [
      doc.document_name,
      ...headers.slice(1).map(header => {
        const fieldName = header.toLowerCase().replace(/ /g, '_');
        return doc.data[fieldName] || '';
      })
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFolder?.name || 'extracted-data'}-data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get unique field names for summary
  const uniqueFields = Array.from(new Set(transformedData.map(f => f.field_name)));
  const fieldSummary = uniqueFields.map(fieldName => {
    const fields = transformedData.filter(f => f.field_name === fieldName);
    const nonEmptyValues = fields.filter(f => f.value !== null && f.value !== '').length;
    return {
      name: fieldName,
      label: fields[0]?.field_label || fieldName,
      type: fields[0]?.field_type || 'text',
      totalDocuments: fields.length,
      filledDocuments: nonEmptyValues,
      completionRate: fields.length > 0 ? Math.round((nonEmptyValues / fields.length) * 100) : 0
    };
  });

  // Group extracted data by document for table display
  const documentsWithExtractedData = extractedData.filter(record => {
    if (record.extracted_data && Object.keys(record.extracted_data).length > 0) {
      return true;
    }
    if (record.extracted_value) {
      try {
        const parsed = JSON.parse(record.extracted_value);
        return Object.keys(parsed).length > 0;
      } catch {
        return false;
      }
    }
    return false;
  });

  // Helper function to get extracted fields from a record
  const getExtractedFields = (record: any) => {
    if (record.extracted_data) {
      return record.extracted_data;
    }
    if (record.extracted_value) {
      try {
        return JSON.parse(record.extracted_value);
      } catch {
        return {};
      }
    }
    return {};
  };

  // Helper function to get document name from a record
  const getDocumentName = (record: any) => {
    if (record.files?.name) return record.files.name;
    if (record.obra_documents?.name) return record.obra_documents.name;
    if (record.file_id) {
      const matchingDoc = documents.find(doc => doc.id === record.file_id);
      return matchingDoc?.name || `File ${record.file_id.substring(0, 8)}...`;
    }
    return 'Unknown Document';
  };

  if (!currentFolder) {
    return (
      <div className="text-center py-12">
        <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Selecciona una carpeta</h3>
        <p className="text-muted-foreground">
          Los datos extraídos solo están disponibles cuando estás dentro de una carpeta con extracción habilitada.
        </p>
      </div>
    );
  }

  if (!currentFolder.extract_data) {
    return (
      <div className="text-center py-12">
        <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Extracción no habilitada</h3>
        <p className="text-muted-foreground">
          Esta carpeta no tiene la extracción de datos habilitada.
          Configura la extracción en la configuración de la carpeta.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="mx-auto h-8 w-8 text-muted-foreground animate-spin mb-4" />
        <p className="text-muted-foreground">Cargando datos extraídos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">⚠️</div>
        <h3 className="text-lg font-medium mb-2">Error</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={refreshData} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Reintentar
        </Button>
      </div>
    );
  }

  if (!documentsWithExtractedData.length) {
    return (
      <div className="text-center py-12">
        <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No hay datos extraídos</h3>
        <p className="text-muted-foreground">
          Los documentos en esta carpeta aún no han sido procesados o no contienen datos extraídos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}


      {/* Field Summary */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen de Campos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fieldSummary.map((field) => (
              <div key={field.name} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{field.label}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {field.type}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {field.filledDocuments}/{field.totalDocuments} documentos
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${field.completionRate}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {field.completionRate}% completado
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card> */}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos por Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  {uniqueFields.map(fieldName => (
                    <TableHead key={fieldName}>
                      {fieldName?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentsWithExtractedData.map(record => (
                  <TableRow key={record.document_id || record.file_id || record.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-[200px] truncate" title={getDocumentName(record)}>
                        {getDocumentName(record)}
                      </div>
                    </TableCell>
                    {uniqueFields.map(fieldName => {
                      const extractedFields = getExtractedFields(record);
                      const value = extractedFields[fieldName];
                      return (
                        <TableCell key={fieldName}>
                          {value !== null && value !== undefined && value !== '' ? (
                            <span className="text-sm">
                              {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Download, Filter, RefreshCw, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { ObraDocument, Folder, FolderFieldDefinition } from '../types';
import { getFolderExtractedData } from '../actions/folder-extraction-actions';

interface ExtractedDataViewProps {
  documents: ObraDocument[];
  currentFolder: Folder | null;
  extractedData?: any[];
  processingCount?: number; // Add this prop
}

interface GroupedExtractedData {
  [file_id: string]: {
    document_name: string;
    file_id: string;
    fields: {
      id: string;
      value: any;
      field_definition_id: string;
      order: number;
    }[];
  };
}

export function ExtractedDataView({
  documents,
  currentFolder,
  extractedData = [],
  processingCount = 0
}: ExtractedDataViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldDefinitions, setFieldDefinitions] = useState<FolderFieldDefinition[]>([]);
  const [realtimeExtractedData, setRealtimeExtractedData] = useState<any[]>(extractedData);
  const [lastProcessingCount, setLastProcessingCount] = useState(processingCount);
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  // Auto-refresh when processing completes
  useEffect(() => {
    // If processing count decreased (documents finished processing)
    if (processingCount < lastProcessingCount && lastProcessingCount > 0) {
      console.log('Processing completed, auto-refreshing extracted data...');
      setAutoRefreshing(true);
      refreshData();
    }
    setLastProcessingCount(processingCount);
  }, [processingCount, lastProcessingCount]);

  // Also refresh when documents prop changes (especially processing_status)
  useEffect(() => {
    const hasNewlyCompleted = documents.some(doc => {
      // Check if any document just completed processing
      return doc.processing_status === 'completed' &&
        doc.folder_id === currentFolder?.id &&
        !realtimeExtractedData.some(data => data.file_id === doc.id);
    });

    if (hasNewlyCompleted) {
      console.log('Newly completed documents detected, refreshing...');
      refreshData();
    }
  }, [documents, currentFolder, realtimeExtractedData]);

  const refreshData = async () => {
    if (!currentFolder) return;

    try {
      const extractedResult = await getFolderExtractedData(currentFolder.id);
      setRealtimeExtractedData(extractedResult.data || []);
      console.log('Extracted data refreshed:', extractedResult.data?.length || 0, 'records');
      setError(null);
    } catch (error) {
      console.error('Error fetching extracted data:', error);
      setError('Failed to load extracted data');
    } finally {
      setLoading(false);
      setAutoRefreshing(false);
    }
  };

  const manualRefresh = async () => {
    setLoading(true);
    await refreshData();
  };

  // Fetch field definitions when currentFolder changes
  useEffect(() => {
    if (currentFolder?.extract_data) {
      fetchFieldDefinitions();
    } else {
      setFieldDefinitions([]);
    }
  }, [currentFolder]);

  const fetchFieldDefinitions = async () => {
    if (!currentFolder) return;

    try {
      const { getFolderFieldDefinitions } = await import('../actions/folder-extraction-actions');
      const result = await getFolderFieldDefinitions(currentFolder.id);
      if (result.fields) {
        const sortedFields = result.fields.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        setFieldDefinitions(sortedFields);
      }
    } catch (error) {
      console.error('Error fetching field definitions:', error);
      setFieldDefinitions([]);
    }
  };

  // Group extracted data by file_id
  const groupedData: GroupedExtractedData = realtimeExtractedData.reduce((acc, record) => {
    if (!record.file_id || !record.extracted_value) return acc;

    let parsedValue;
    try {
      parsedValue = JSON.parse(record.extracted_value);
    } catch (error) {
      console.error('Error parsing extracted_value:', error);
      parsedValue = record.extracted_value;
    }

    if (!acc[record.file_id]) {
      const matchingDoc = documents.find(doc => doc.id === record.file_id);
      acc[record.file_id] = {
        document_name: matchingDoc?.name || `File ${record.file_id.substring(0, 8)}...`,
        file_id: record.file_id,
        fields: []
      };
    }

    acc[record.file_id].fields.push({
      id: record.id,
      value: parsedValue,
      field_definition_id: record.field_definition_id,
      order: acc[record.file_id].fields.length
    });

    return acc;
  }, {} as GroupedExtractedData);

  // Include ALL documents in the folder
  const documentsWithExtractedData = documents
    .filter(doc => doc.folder_id === currentFolder?.id)
    .map(doc => {
      const extractedDoc = groupedData[doc.id];
      return {
        document_name: doc.name,
        file_id: doc.id,
        processing_status: doc.processing_status || 'unknown',
        fields: extractedDoc?.fields || []
      };
    });

  // Get sorted field headers based on field definitions
  const fieldHeaders = fieldDefinitions.map(field => ({
    id: field.id,
    label: field.field_label,
    type: field.field_type
  }));

  const exportData = () => {
    if (!documentsWithExtractedData.length) return;

    const headers = ['Documento', ...fieldHeaders.map(header => header.label)];
    const rows = documentsWithExtractedData.map(doc => [
      doc.document_name,
      ...fieldHeaders.map(header => {
        const field = doc.fields.find(f => f.field_definition_id === header.id);
        return field ? String(field.value) : '';
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

  // Calculate statistics
  const processingDocsCount = documentsWithExtractedData.filter(
    doc => doc.processing_status === 'pending' || doc.processing_status === 'processing'
  ).length;

  const completedDocsCount = documentsWithExtractedData.filter(
    doc => doc.fields.length > 0
  ).length;

  if (!currentFolder) {
    return (
      <div className="text-center py-12">
        <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Select a folder</h3>
        <p className="text-muted-foreground">
          Extracted data is only available when viewing a folder with extraction enabled.
        </p>
      </div>
    );
  }

  if (!currentFolder.extract_data) {
    return (
      <div className="text-center py-12">
        <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Extraction not enabled</h3>
        <p className="text-muted-foreground">
          This folder does not have data extraction enabled.
          Configure extraction in the folder settings.
        </p>
      </div>
    );
  }

  if (loading && !autoRefreshing) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="mx-auto h-8 w-8 text-muted-foreground animate-spin mb-4" />
        <p className="text-muted-foreground">Loading extracted data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">⚠️</div>
        <h3 className="text-lg font-medium mb-2">Error</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={manualRefresh} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Retry
        </Button>
      </div>
    );
  }

  if (!documentsWithExtractedData.length) {
    return (
      <div className="text-center py-12">
        <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No extracted data</h3>
        <p className="text-muted-foreground">
          No documents in this folder yet. Upload documents to see extracted data here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      {/* {(processingDocsCount > 0 || autoRefreshing) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-800">
              {autoRefreshing
                ? 'Updating extracted data...'
                : `${processingDocsCount} document${processingDocsCount !== 1 ? 's' : ''} still processing`
              }
            </span>
          </div>
          {!autoRefreshing && (
            <Badge variant="outline" className="text-xs">
              Auto-refresh enabled
            </Badge>
          )}
        </div>
      )} */}

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  {/* <TableHead>Status</TableHead> */}
                  {fieldHeaders.map((header) => (
                    <TableHead key={header.id}>
                      {header.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentsWithExtractedData.map((document, index) => (
                  <TableRow key={document.file_id}>
                    <TableCell className="font-medium">
                      <div className="max-w-[200px] truncate" title={document.document_name}>
                        {document.document_name}
                      </div>
                    </TableCell>
                    {/* <TableCell>
                      <ProcessingStatusIndicator status={document.processing_status} />
                    </TableCell> */}
                    {fieldHeaders.map((header) => {
                      const field = document.fields.find(f => f.field_definition_id === header.id);

                      // Show loading indicator if document is being processed
                      if (document.processing_status === 'pending' || document.processing_status === 'processing') {
                        return (
                          <TableCell key={header.id} className='overflow-hidden max-w-[200px] py-0'>
                            <div className='relative max-w-[180px] overflow-hidden h-[25px] rounded-md'>
                              <div className="w-[800px] h-full ml-[-150px] bg-[repeating-linear-gradient(-60deg,#dbdbdb,#f9f9f9_90px,#dbdbdb_180px)] text-transparent animate-bg-pulse animate-bg-slide "> text</div>
                            </div>
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell key={header.id}>
                          {field && field.value !== null && field.value !== undefined && field.value !== '' ? (
                            <span className="text-sm">
                              {typeof field.value === 'boolean' ? (field.value ? 'Yes' : 'No') : String(field.value)}
                            </span>
                          ) : document.processing_status === 'failed' ? (
                            <span className="text-red-500 text-sm">Error</span>
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

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={manualRefresh}
            variant="outline"
            size="sm"
            disabled={loading || autoRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading || autoRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {completedDocsCount} of {documentsWithExtractedData.length} document{documentsWithExtractedData.length !== 1 ? 's' : ''} with extracted data
        </div>
      </div>
    </div>
  );
}

function ProcessingStatusIndicator({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-yellow-500" />
          <span className="text-xs text-yellow-600">Queued</span>
        </div>
      );
    case 'processing':
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          <span className="text-xs text-blue-600">Processing</span>
        </div>
      );
    case 'completed':
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span className="text-xs text-green-600">Complete</span>
        </div>
      );
    case 'failed':
      return (
        <div className="flex items-center gap-2">
          <XCircle className="h-3 w-3 text-red-500" />
          <span className="text-xs text-red-600">Failed</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-400" />
          <span className="text-xs text-gray-600">Unknown</span>
        </div>
      );
  }
}
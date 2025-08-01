'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Database, Download, Filter, RefreshCw, Loader2, Clock, CheckCircle, XCircle, ChevronDown, ChevronRight, Rows3 } from 'lucide-react';
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

interface TabularRow {
  row_index: number;
  fields: {
    id: string;
    value: any;
    field_definition_id: string;
  }[];
}

interface TabularData {
  [file_id: string]: {
    document_name: string;
    file_id: string;
    rows: TabularRow[];
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
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());

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
  }, [documents, currentFolder]);

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

  // Determine if this is tabular extraction
  const isTabularFolder = currentFolder?.extraction_type === 'tabular';

  // Group extracted data by file_id - handle both single and tabular data
  const groupedData: GroupedExtractedData = {};
  const tabularData: TabularData = {};

  realtimeExtractedData.forEach(record => {
    if (!record.file_id || !record.extracted_value) return;

    let parsedValue;
    try {
      parsedValue = JSON.parse(record.extracted_value);
    } catch (error) {
      console.error('Error parsing extracted_value:', error);
      parsedValue = record.extracted_value;
    }

    const matchingDoc = documents.find(doc => doc.id === record.file_id);
    const documentName = matchingDoc?.name || `File ${record.file_id.substring(0, 8)}...`;

    if (record.is_tabular && isTabularFolder) {
      // Handle tabular data
      if (!tabularData[record.file_id]) {
        tabularData[record.file_id] = {
          document_name: documentName,
          file_id: record.file_id,
          rows: []
        };
      }

      // Find or create row
      let targetRow = tabularData[record.file_id].rows.find(row => row.row_index === (record.row_index || 0));
      if (!targetRow) {
        targetRow = {
          row_index: record.row_index || 0,
          fields: []
        };
        tabularData[record.file_id].rows.push(targetRow);
      }

      targetRow.fields.push({
        id: record.id,
        value: parsedValue,
        field_definition_id: record.field_definition_id
      });
    } else {
      // Handle single extraction data
      if (!groupedData[record.file_id]) {
        groupedData[record.file_id] = {
          document_name: documentName,
          file_id: record.file_id,
          fields: []
        };
      }

      groupedData[record.file_id].fields.push({
        id: record.id,
        value: parsedValue,
        field_definition_id: record.field_definition_id,
        order: groupedData[record.file_id].fields.length
      });
    }
  });

  // Sort tabular rows by row_index
  Object.values(tabularData).forEach(doc => {
    doc.rows.sort((a, b) => a.row_index - b.row_index);
  });

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

  const toggleDocumentExpansion = (fileId: string) => {
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedDocuments(newExpanded);
  };

  const expandAllDocuments = () => {
    setExpandedDocuments(new Set(Object.keys(tabularData)));
  };

  const collapseAllDocuments = () => {
    setExpandedDocuments(new Set());
  };

  const exportData = () => {
    if (isTabularFolder) {
      exportTabularData();
    } else {
      exportSingleData();
    }
  };

  const exportSingleData = () => {
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

  const exportTabularData = () => {
    if (!Object.keys(tabularData).length) return;

    const headers = ['Documento', 'Fila', ...fieldHeaders.map(header => header.label)];
    const rows: string[][] = [];

    Object.values(tabularData).forEach(doc => {
      doc.rows.forEach(row => {
        const csvRow = [
          doc.document_name,
          String(row.row_index + 1), // 1-based for user display
          ...fieldHeaders.map(header => {
            const field = row.fields.find(f => f.field_definition_id === header.id);
            return field ? String(field.value) : '';
          })
        ];
        rows.push(csvRow);
      });
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFolder?.name || 'extracted-data'}-tabular.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const processingDocsCount = documentsWithExtractedData.filter(
    doc => doc.processing_status === 'pending' || doc.processing_status === 'processing'
  ).length;

  const completedDocsCount = isTabularFolder 
    ? Object.keys(tabularData).length
    : documentsWithExtractedData.filter(doc => doc.fields.length > 0).length;

  const totalRowsCount = isTabularFolder 
    ? Object.values(tabularData).reduce((sum, doc) => sum + doc.rows.length, 0)
    : completedDocsCount;

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

  if (!documentsWithExtractedData.length && (!isTabularFolder || !Object.keys(tabularData).length)) {
    return (
      <div className="text-center py-12">
        <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No extracted data</h3>
        <p className="text-muted-foreground">
          {isTabularFolder 
            ? 'No tabular data extracted yet. Upload documents with table data to see extracted rows here.'
            : 'No documents in this folder yet. Upload documents to see extracted data here.'
          }
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

      {/* Data Display - Different views for single vs tabular */}
      {isTabularFolder ? (
        <div className="space-y-4">
          {/* Tabular Data View */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rows3 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Tabular Data ({totalRowsCount} rows)</CardTitle>
                </div>
                {Object.keys(tabularData).length > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={expandAllDocuments}
                      className="text-xs h-7"
                    >
                      Expand All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={collapseAllDocuments}
                      className="text-xs h-7"
                    >
                      Collapse All
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {Object.keys(tabularData).length === 0 && processingDocsCount === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Rows3 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No tabular data extracted yet</p>
                  </div>
                ) : (
                  <>
                    {Object.values(tabularData).map((document) => {
                      const isExpanded = expandedDocuments.has(document.file_id);
                      return (
                    <Collapsible key={document.file_id} open={isExpanded} onOpenChange={() => toggleDocumentExpansion(document.file_id)}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer border-b">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div>
                              <div className="font-medium text-sm">{document.document_name}</div>
                              <div className="text-xs text-muted-foreground">{document.rows.length} rows extracted</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {document.rows.length} rows
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-b">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30">
                                  <TableHead className="w-16">#</TableHead>
                                  {fieldHeaders.map((header) => (
                                    <TableHead key={header.id}>
                                      {header.label}
                                    </TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {document.rows.map((row) => (
                                  <TableRow key={`${document.file_id}-${row.row_index}`} className="border-b-0">
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                      {row.row_index + 1}
                                    </TableCell>
                                    {fieldHeaders.map((header) => {
                                      const field = row.fields.find(f => f.field_definition_id === header.id);
                                      return (
                                        <TableCell key={header.id}>
                                          {field && field.value !== null && field.value !== undefined && field.value !== '' ? (
                                            <span className="text-sm">
                                              {typeof field.value === 'boolean' ? (field.value ? 'Yes' : 'No') : String(field.value)}
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
                        </div>
                      </CollapsibleContent>
                        </Collapsible>
                      );
                    })}

                    {/* Show processing documents in tabular view */}
                    {documentsWithExtractedData
                      .filter(doc => 
                        !tabularData[doc.file_id] && 
                        (doc.processing_status === 'pending' || doc.processing_status === 'processing')
                      )
                      .map((document) => (
                        <div key={document.file_id} className="flex items-center justify-between p-4 border-b bg-muted/20">
                          <div className="flex items-center gap-3">
                            <div className="h-4 w-4" /> {/* Spacer for collapsed icon */}
                            <div>
                              <div className="font-medium text-sm">{document.document_name}</div>
                              <div className="text-xs text-muted-foreground">Processing...</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                            <Badge variant="secondary" className="text-xs">Processing</Badge>
                          </div>
                        </div>
                      ))
                    }
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Single Extraction Data View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
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
      )}

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
          {isTabularFolder ? (
            `${completedDocsCount} document${completedDocsCount !== 1 ? 's' : ''} with ${totalRowsCount} rows extracted`
          ) : (
            `${completedDocsCount} of ${documentsWithExtractedData.length} document${documentsWithExtractedData.length !== 1 ? 's' : ''} with extracted data`
          )}
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
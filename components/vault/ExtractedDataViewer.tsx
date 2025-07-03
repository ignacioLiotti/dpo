'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  getExtractedDataAction,
  extractDocumentDataAction 
} from '../../lib/actions/data-extraction-actions';

interface ExtractedDataRecord {
  id: string;
  extracted_value: string | null;
  confidence_score: number;
  extraction_method_used: string;
  raw_extracted_text: string;
  is_verified: boolean;
  folder_field_definitions: {
    field_label: string;
    field_type: string;
    field_name: string;
  };
}

interface ExtractedDataViewerProps {
  documentId?: string;
  obraId?: string;
  folderName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExtractedDataViewer: React.FC<ExtractedDataViewerProps> = ({
  documentId,
  obraId,
  folderName,
  isOpen,
  onClose
}) => {
  const [data, setData] = useState<ExtractedDataRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, documentId, obraId, folderName]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getExtractedDataAction({
        document_id: documentId,
        obra_id: obraId,
        folder_name: folderName,
      });

      if (result?.data?.success) {
        setData(result.data.data || []);
      }
    } catch (error) {
      console.error('Error loading extracted data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractData = async () => {
    if (!documentId) return;

    setExtracting(true);
    try {
      const result = await extractDocumentDataAction({
        document_id: documentId,
        force_reextraction: true,
      });

      if (result?.data?.success) {
        await loadData(); // Reload data after extraction
      }
    } catch (error) {
      console.error('Error extracting data:', error);
    } finally {
      setExtracting(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  const formatValue = (value: string | null, fieldType: string) => {
    if (!value) return 'N/A';
    
    switch (fieldType) {
      case 'currency':
        return `$${value}`;
      case 'boolean':
        return value === 'true' ? '✅ Yes' : '❌ No';
      default:
        return value;
    }
  };

  const groupedData = data.reduce((acc, record) => {
    const fieldName = record.folder_field_definitions.field_name;
    if (!acc[fieldName]) {
      acc[fieldName] = [];
    }
    acc[fieldName].push(record);
    return acc;
  }, {} as Record<string, ExtractedDataRecord[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>📊</span>
            Extracted Data
            {documentId && (
              <Button
                onClick={handleExtractData}
                disabled={extracting}
                size="sm"
                className="ml-auto"
              >
                {extracting ? 'Extracting...' : '🔄 Re-extract'}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading extracted data...</p>
            </div>
          ) : Object.keys(groupedData).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-lg mb-2">No extracted data found</p>
              {documentId && (
                <div className="space-y-2">
                  <p className="text-sm">This document hasn't been processed yet</p>
                  <Button onClick={handleExtractData} disabled={extracting}>
                    {extracting ? 'Extracting...' : '🚀 Extract Data Now'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedData).map(([fieldName, records]) => {
                const record = records[0]; // Take the first record for this field
                return (
                  <ExtractedDataCard
                    key={fieldName}
                    record={record}
                    formatValue={formatValue}
                    getConfidenceColor={getConfidenceColor}
                    getConfidenceLabel={getConfidenceLabel}
                  />
                );
              })}
            </div>
          )}

          {/* Summary Statistics */}
          {data.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Extraction Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{data.length}</div>
                  <div className="text-sm text-blue-800">Total Fields</div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {data.filter(d => d.confidence_score >= 0.8).length}
                  </div>
                  <div className="text-sm text-green-800">High Confidence</div>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {data.filter(d => d.confidence_score >= 0.5 && d.confidence_score < 0.8).length}
                  </div>
                  <div className="text-sm text-yellow-800">Medium Confidence</div>
                </div>
                
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {data.filter(d => d.confidence_score < 0.5).length}
                  </div>
                  <div className="text-sm text-red-800">Low Confidence</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ExtractedDataCard: React.FC<{
  record: ExtractedDataRecord;
  formatValue: (value: string | null, fieldType: string) => string;
  getConfidenceColor: (confidence: number) => string;
  getConfidenceLabel: (confidence: number) => string;
}> = ({ record, formatValue, getConfidenceColor, getConfidenceLabel }) => {
  const [showRaw, setShowRaw] = useState(false);

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'date': return '📅';
      case 'currency': return '💰';
      case 'boolean': return '☑️';
      case 'email': return '📧';
      case 'phone': return '📞';
      default: return '📄';
    }
  };

  const getMethodBadge = (method: string) => {
    const styles = {
      regex: 'bg-blue-100 text-blue-800',
      ai: 'bg-purple-100 text-purple-800',
      hybrid: 'bg-green-100 text-green-800',
    };
    return styles[method as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {getFieldTypeIcon(record.folder_field_definitions.field_type)}
          </span>
          <div>
            <h4 className="font-semibold">{record.folder_field_definitions.field_label}</h4>
            <p className="text-sm text-gray-500">
              {record.folder_field_definitions.field_name} • {record.folder_field_definitions.field_type}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded ${getMethodBadge(record.extraction_method_used)}`}>
            {record.extraction_method_used}
          </span>
          <span className={`px-2 py-1 text-xs rounded ${getConfidenceColor(record.confidence_score)}`}>
            {getConfidenceLabel(record.confidence_score)} ({Math.round(record.confidence_score * 100)}%)
          </span>
          {record.is_verified && (
            <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
              ✓ Verified
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-sm font-medium text-gray-700">Extracted Value:</label>
          <div className="text-lg font-semibold">
            {formatValue(record.extracted_value, record.folder_field_definitions.field_type)}
          </div>
        </div>

        {record.raw_extracted_text && (
          <div>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showRaw ? 'Hide' : 'Show'} raw extracted text
            </button>
            {showRaw && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-sm font-mono">
                {record.raw_extracted_text}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
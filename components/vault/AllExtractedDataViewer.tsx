'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { getExtractedDataAction } from '../../lib/actions/data-extraction-actions';

interface ExtractedDataRecord {
  id: string;
  extracted_value: string | null;
  confidence_score: number;
  extraction_method_used: string;
  raw_extracted_text: string;
  is_verified: boolean;
  created_at: string;
  folder_field_definitions: {
    field_label: string;
    field_type: string;
    field_name: string;
  };
  obra_documents: {
    id: string;
    name: string;
    folder: string;
    type: string;
    created_at: string;
  };
}

interface AllExtractedDataViewerProps {
  obraId: string;
  folderName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AllExtractedDataViewer: React.FC<AllExtractedDataViewerProps> = ({
  obraId,
  folderName,
  isOpen,
  onClose
}) => {
  const [data, setData] = useState<ExtractedDataRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>(folderName || '');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, obraId, selectedFolder]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getExtractedDataAction({
        obra_id: obraId,
        folder_name: selectedFolder || undefined,
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

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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

  // Group data by folder for better organization
  const groupedData = data.reduce((acc, record) => {
    const folder = record.obra_documents?.folder || 'Sin Clasificar';
    if (!acc[folder]) {
      acc[folder] = [];
    }
    acc[folder].push(record);
    return acc;
  }, {} as Record<string, ExtractedDataRecord[]>);

  // Get unique folders for filter
  const folders = Array.from(new Set(data.map(d => d.obra_documents?.folder || 'Sin Clasificar')));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>📊</span>
            All Extracted Data
            <div className="ml-auto flex items-center gap-2">
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">All Folders</option>
                {folders.map(folder => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
              <Button onClick={loadData} variant="outline" size="sm">
                🔄 Refresh
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading extracted data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-lg mb-2">No extracted data found</p>
              <p className="text-sm">Extract data from documents to see results here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{data.length}</div>
                  <div className="text-sm text-blue-800">Total Extractions</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {data.filter(d => d.confidence_score >= 0.8).length}
                  </div>
                  <div className="text-sm text-green-800">High Confidence</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.filter(d => d.is_verified).length}
                  </div>
                  <div className="text-sm text-purple-800">Verified</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {new Set(data.map(d => d.obra_documents?.id).filter(Boolean)).size}
                  </div>
                  <div className="text-sm text-gray-800">Unique Documents</div>
                </div>
              </div>

              {/* Data Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Document</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Folder</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Field</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Value</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Confidence</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Method</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.map((record) => (
                      <ExtractedDataTableRow key={record.id} record={record} />
                    ))}
                  </tbody>
                </table>
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

const ExtractedDataTableRow: React.FC<{ record: ExtractedDataRecord }> = ({ record }) => {
  const [showRawText, setShowRawText] = useState(false);

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

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="max-w-xs">
            <div className="font-medium text-gray-900 truncate">{record.obra_documents?.name || 'Unknown'}</div>
            <div className="text-xs text-gray-500">{record.obra_documents?.type || 'Unknown'}</div>
          </div>
        </td>
        
        <td className="px-4 py-3">
          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
            {record.obra_documents?.folder || 'Sin Clasificar'}
          </span>
        </td>
        
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getFieldTypeIcon(record.folder_field_definitions?.field_type || 'text')}</span>
            <div>
              <div className="font-medium text-gray-900">{record.folder_field_definitions?.field_label || 'Unknown Field'}</div>
              <div className="text-xs text-gray-500">{record.folder_field_definitions?.field_name || 'unknown'}</div>
            </div>
          </div>
        </td>
        
        <td className="px-4 py-3">
          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
            {record.folder_field_definitions?.field_type || 'text'}
          </span>
        </td>
        
        <td className="px-4 py-3">
          <div className="max-w-xs">
            <div className={`text-sm ${record.extracted_value ? 'text-gray-900' : 'text-gray-400'}`}>
              {formatValue(record.extracted_value, record.folder_field_definitions?.field_type || 'text')}
            </div>
            {record.is_verified && (
              <div className="text-xs text-green-600 mt-1">✓ Verified</div>
            )}
          </div>
        </td>
        
        <td className="px-4 py-3">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
            record.confidence_score >= 0.8 ? 'bg-green-100 text-green-800' :
            record.confidence_score >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {Math.round(record.confidence_score * 100)}%
          </span>
        </td>
        
        <td className="px-4 py-3">
          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            {record.extraction_method_used}
          </span>
        </td>
        
        <td className="px-4 py-3">
          <div className="text-sm text-gray-500">
            {new Date(record.created_at).toLocaleDateString()}
          </div>
          {record.raw_extracted_text && (
            <Button
              onClick={() => setShowRawText(!showRawText)}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs mt-1"
            >
              👁️
            </Button>
          )}
        </td>
      </tr>
      
      {showRawText && record.raw_extracted_text && (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-4 py-2">
            <div className="text-sm">
              <div className="font-medium text-gray-700 mb-1">Raw Extracted Text:</div>
              <div className="bg-white p-2 rounded border font-mono text-xs max-h-24 overflow-y-auto">
                {record.raw_extracted_text}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
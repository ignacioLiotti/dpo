'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  getFieldDefinitionsAction,
  extractDocumentDataAction,
  previewDataExtractionAction,
  saveEditedExtractionDataAction
} from '../../lib/actions/data-extraction-actions';

interface ExtractedField {
  field_name: string;
  field_label: string;
  field_type: string;
  extracted_value: string | null;
  confidence_score: number;
  extraction_method_used: string;
  raw_extracted_text: string;
  error?: string;
}

interface FieldDefinition {
  id: string;
  field_name: string;
  field_type: string;
  field_label: string;
  extraction_method: string;
  extraction_pattern: string;
  is_required: boolean;
  default_value?: string;
}

interface DataExtractionPreviewProps {
  documentId: string;
  obraId: string;
  folderName: string;
  ocrText: string;
  fileName: string;
  fileType: string;
  isOpen: boolean;
  onClose: () => void;
  onDataSaved?: () => void;
}

export const DataExtractionPreview: React.FC<DataExtractionPreviewProps> = ({
  documentId,
  obraId,
  folderName,
  ocrText,
  fileName,
  fileType,
  isOpen,
  onClose,
  onDataSaved
}) => {
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedField[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load field definitions when dialog opens
  useEffect(() => {
    const loadFieldDefinitions = async () => {
      if (!isOpen) return;
      
      try {
        const result = await getFieldDefinitionsAction({
          obra_id: obraId,
          folder_name: folderName,
        });

        if (result?.data?.success) {
          setFieldDefinitions(result.data.data || []);
        }
      } catch (error) {
        console.error('Error loading field definitions:', error);
        setError('Failed to load field definitions');
      }
    };

    loadFieldDefinitions();
  }, [isOpen, obraId, folderName]);

  const handleExtractData = async () => {
    if (!ocrText || fieldDefinitions.length === 0) {
      setError('No OCR text or field definitions available');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      // Run the preview extraction
      const result = await previewDataExtractionAction({
        obra_id: obraId,
        folder_name: folderName,
        ocr_text: ocrText,
        file_name: fileName,
        file_type: fileType,
      });

      if (result?.data?.success) {
        const results = result.data.results || [];
        
        // Convert results to our preview format
        const previewData: ExtractedField[] = results.map(result => ({
          field_name: result.field_name,
          field_label: fieldDefinitions.find(f => f.field_name === result.field_name)?.field_label || result.field_name,
          field_type: fieldDefinitions.find(f => f.field_name === result.field_name)?.field_type || 'text',
          extracted_value: result.extracted_value,
          confidence_score: result.confidence_score,
          extraction_method_used: result.extraction_method_used,
          raw_extracted_text: result.raw_extracted_text,
          error: result.error,
        }));

        setExtractedData(previewData);
        setHasExtracted(true);
      } else {
        setError(`Failed to extract data: ${result?.data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error extracting data:', error);
      setError(`Failed to extract data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFieldValueChange = (fieldName: string, newValue: string) => {
    setExtractedData(prev => 
      prev.map(field => 
        field.field_name === fieldName 
          ? { ...field, extracted_value: newValue }
          : field
      )
    );
  };

  const handleSaveData = async () => {
    if (!hasExtracted || extractedData.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      // Use the new action to save the edited extraction data
      const result = await saveEditedExtractionDataAction({
        document_id: documentId,
        extracted_data: extractedData.map(field => ({
          field_name: field.field_name,
          extracted_value: field.extracted_value,
          confidence_score: field.confidence_score,
          extraction_method_used: field.extraction_method_used,
          raw_extracted_text: field.raw_extracted_text,
        })),
      });

      if (result?.data?.success) {
        onDataSaved?.();
        onClose();
      } else {
        setError(`Failed to save data: ${result?.data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setError(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>🔍</span>
            Extract Data from OCR Text
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* OCR Text Preview */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">OCR Text</h3>
            <div className="border rounded-lg p-4 bg-gray-50 max-h-32 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{ocrText}</p>
            </div>
          </div>

          {/* Field Definitions Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Available Fields ({fieldDefinitions.length})
            </h3>
            {fieldDefinitions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No field definitions found for this folder.</p>
                <p className="text-sm">Add field definitions first using "Manage Fields".</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {fieldDefinitions.map((field) => (
                  <div key={field.id} className="text-sm bg-blue-50 p-2 rounded">
                    <span className="font-medium">{field.field_label}</span>
                    <span className="text-gray-500 ml-1">({field.field_type})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extract Button */}
          {!hasExtracted && fieldDefinitions.length > 0 && (
            <div className="text-center">
              <Button
                onClick={handleExtractData}
                disabled={isExtracting || !ocrText}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isExtracting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Extracting Data...
                  </>
                ) : (
                  <>
                    🚀 Extract Data from OCR Text
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Extracted Data Preview & Editor */}
          {hasExtracted && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Extracted Data Preview
                </h3>
                <div className="flex gap-2">
                  <Button
                    onClick={handleExtractData}
                    variant="outline"
                    size="sm"
                  >
                    🔄 Re-extract
                  </Button>
                  <Button
                    onClick={handleSaveData}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSaving ? 'Saving...' : '💾 Save to Database'}
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Field</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Extracted Value</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Confidence</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Method</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {extractedData.map((field) => (
                      <ExtractedFieldTableRow
                        key={field.field_name}
                        field={field}
                        onValueChange={(newValue) => 
                          handleFieldValueChange(field.field_name, newValue)
                        }
                        getFieldTypeIcon={getFieldTypeIcon}
                        getConfidenceColor={getConfidenceColor}
                        formatConfidence={formatConfidence}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t gap-2">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ExtractedFieldTableRow: React.FC<{
  field: ExtractedField;
  onValueChange: (value: string) => void;
  getFieldTypeIcon: (type: string) => string;
  getConfidenceColor: (confidence: number) => string;
  formatConfidence: (confidence: number) => string;
}> = ({ field, onValueChange, getFieldTypeIcon, getConfidenceColor, formatConfidence }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.extracted_value || '');
  const [showRawText, setShowRawText] = useState(false);

  const handleSaveEdit = () => {
    onValueChange(editValue);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(field.extracted_value || '');
    setIsEditing(false);
  };

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getFieldTypeIcon(field.field_type)}</span>
            <div>
              <div className="font-medium text-gray-900">{field.field_label}</div>
              <div className="text-sm text-gray-500">{field.field_name}</div>
            </div>
          </div>
        </td>
        
        <td className="px-4 py-3">
          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
            {field.field_type}
          </span>
        </td>
        
        <td className="px-4 py-3">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter value..."
                autoFocus
              />
              <div className="flex gap-1">
                <Button onClick={handleSaveEdit} size="sm" className="h-7 px-2 text-xs">
                  ✓
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="sm" className="h-7 px-2 text-xs">
                  ✗
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-xs">
              <div className={`text-sm ${field.extracted_value ? 'text-gray-900' : 'text-gray-400'}`}>
                {field.extracted_value || 'No value extracted'}
              </div>
              {field.error && (
                <div className="text-xs text-red-600 mt-1">
                  Error: {field.error}
                </div>
              )}
            </div>
          )}
        </td>
        
        <td className="px-4 py-3">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
            field.confidence_score >= 0.8 ? 'bg-green-100 text-green-800' :
            field.confidence_score >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {formatConfidence(field.confidence_score)}
          </span>
        </td>
        
        <td className="px-4 py-3">
          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            {field.extraction_method_used}
          </span>
        </td>
        
        <td className="px-4 py-3">
          <div className="flex gap-1">
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                ✏️
              </Button>
            )}
            {field.raw_extracted_text && (
              <Button
                onClick={() => setShowRawText(!showRawText)}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                👁️
              </Button>
            )}
          </div>
        </td>
      </tr>
      
      {showRawText && field.raw_extracted_text && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-4 py-2">
            <div className="text-sm">
              <div className="font-medium text-gray-700 mb-1">Raw Extracted Text:</div>
              <div className="bg-white p-2 rounded border font-mono text-xs">
                {field.raw_extracted_text}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
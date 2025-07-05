'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Eye, FileText, Edit, Bot, Cpu, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

import { uploadDocumentsAction } from '../actions/document-actions';
import { DOCUMENT_CATEGORIES } from '../types';
import type { Folder } from '../types';

interface UploadFormClientProps {
  obraId: string;
  currentFolder: Folder | null;
  folders: Folder[];
}

export function UploadFormClient({ obraId, currentFolder, folders }: UploadFormClientProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState<string>('otros');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [processingResults, setProcessingResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [editableResults, setEditableResults] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleProcess = async () => {
    if (files.length === 0) {
      toast.error('Selecciona al menos un archivo');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Procesando archivos con OCR e IA...');

    try {
      const processResults = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingStatus(`Procesando ${file.name} (${i + 1}/${files.length})...`);
        
        // Process file with OCR and AI
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('fileType', file.type);
        
        // Add folder info for extraction
        const folderId = currentFolder ? currentFolder.id : (selectedFolderId || '');
        if (folderId) {
          formData.append('folder_id', folderId);
        }
        
        const response = await fetch('/api/process-document', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          processResults.push({
            file,
            fileName: file.name,
            ocrText: result.ocrText || '',
            aiDescription: result.aiDescription || `Documento: ${file.name}`,
            aiTags: result.aiTags || [],
            extractedData: result.extractedData || null,
            confidence: result.confidence || 0,
            metadata: result.metadata || {}
          });
        } else {
          // Add failed result
          processResults.push({
            file,
            fileName: file.name,
            ocrText: '',
            aiDescription: `Documento: ${file.name}`,
            aiTags: [getDocumentType(file.name), 'documento'],
            extractedData: null,
            confidence: 0,
            error: result.error || 'Error procesando archivo',
            metadata: {}
          });
        }
      }
      
      setProcessingResults(processResults);
      setEditableResults(JSON.parse(JSON.stringify(processResults))); // Deep copy for editing
      setIsProcessed(true);
      setShowResults(true);
      setProcessingStatus('');
      
      toast.success('Procesamiento completado. Revisa y edita los resultados antes de subir.');
      
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Error durante el procesamiento');
      setProcessingStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isProcessed || editableResults.length === 0) {
      toast.error('Primero procesa los archivos');
      return;
    }

    setIsUploading(true);
    setProcessingStatus('Subiendo archivos...');

    try {
      const formData = new FormData();
      formData.append('obra_id', obraId);
      formData.append('category', uploadCategory);
      formData.append('description', uploadDescription);
      
      // Add folder_id if selected
      const folderId = currentFolder ? currentFolder.id : (selectedFolderId || '');
      if (folderId) {
        formData.append('folder_id', folderId);
      }

      // Add files with processed data
      editableResults.forEach((result, index) => {
        formData.append(`file_${index}`, result.file);
        formData.append(`processed_data_${index}`, JSON.stringify({
          ocrText: result.ocrText,
          aiDescription: result.aiDescription,
          aiTags: result.aiTags,
          extractedData: result.extractedData,
          confidence: result.confidence,
          metadata: result.metadata
        }));
      });

      const result = await uploadDocumentsAction(formData);
      
      // Show success message
      toast.success(`${files.length} documento${files.length !== 1 ? 's' : ''} subido${files.length !== 1 ? 's' : ''} y procesado${files.length !== 1 ? 's' : ''} correctamente`);
      
      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, {
            duration: 5000, // Show warnings for 5 seconds
          });
        });
      }
      
      // Reset form after successful upload
      setFiles([]);
      setUploadDescription('');
      setProcessingStatus('');
      setProcessingResults([]);
      setEditableResults([]);
      setIsProcessed(false);
      setShowResults(false);
      router.refresh(); // Refresh to show new documents
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir documentos');
      setProcessingStatus('');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getDocumentType = (fileName: string): string => {
    const name = fileName.toLowerCase();
    if (name.includes('factura') || name.includes('invoice')) return 'factura';
    if (name.includes('contrato') || name.includes('contract')) return 'contrato';
    if (name.includes('plano') || name.includes('blueprint') || name.includes('dwg')) return 'plano';
    if (name.includes('foto') || name.includes('photo') || name.includes('imagen')) return 'foto';
    if (name.includes('permiso') || name.includes('permit')) return 'permiso';
    if (name.includes('informe') || name.includes('report')) return 'informe';
    if (name.includes('certificado') || name.includes('certificate')) return 'certificado';
    if (name.includes('material')) return 'material';
    if (name.includes('correspondencia') || name.includes('carta') || name.includes('email')) return 'correspondencia';
    return 'otros';
  };

  return (
    <div className="space-y-4">
      {/* File Selection Section - Hidden when processed */}
      {!isProcessed && (
        <>
          {/* File Drop Zone */}
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="space-y-2">
              <div className="text-4xl">📁</div>
              <div>
                <p className="text-lg font-medium">Arrastra archivos aquí</p>
                <p className="text-sm text-muted-foreground">o haz clic para seleccionar</p>
              </div>
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv,.zip,.rar,.dwg,.dxf"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                Seleccionar archivos
              </Button>
            </div>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Archivos seleccionados ({files.length})</Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Configuration - Always visible */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select value={uploadCategory} onValueChange={setUploadCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!currentFolder && (
          <div className="space-y-2">
            <Label>Carpeta (opcional)</Label>
            <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin carpeta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin carpeta</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.icon} {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Descripción (opcional)</Label>
        <Textarea
          value={uploadDescription}
          onChange={(e) => setUploadDescription(e.target.value)}
          placeholder="Describe estos documentos..."
          rows={3}
        />
      </div>

      {/* Processing Status */}
      {processingStatus && (
        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded text-center">
          🤖 {processingStatus}
        </div>
      )}

      {/* Step 1: Process Button */}
      {!isProcessed && files.length > 0 && (
        <div className="space-y-2">
          <Button 
            type="button"
            onClick={handleProcess}
            disabled={files.length === 0 || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? 'Procesando...' : `🤖 Procesar ${files.length} archivo${files.length !== 1 ? 's' : ''} con IA`}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Se analizarán los archivos con OCR e IA para extraer texto y datos estructurados
          </p>
        </div>
      )}

      {/* Processing Results - Editable */}
      {editableResults.length > 0 && showResults && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Resultados del Procesamiento</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleProcess()}
                disabled={isProcessing}
              >
                Reprocesar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResults(false)}
              >
                Ocultar
              </Button>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {editableResults.map((result, index) => (
              <EditableProcessingResultCard 
                key={index} 
                result={result} 
                onUpdate={(updatedResult) => {
                  const newResults = [...editableResults];
                  newResults[index] = updatedResult;
                  setEditableResults(newResults);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Upload Form */}
      {isProcessed && (
        <form onSubmit={handleUpload} className="space-y-4">
          <DialogFooter>
            <div className="space-y-2 w-full">
              <Button 
                type="submit" 
                disabled={editableResults.length === 0 || isUploading}
                className="w-full"
                size="lg"
              >
                {isUploading ? 'Subiendo...' : `📤 Subir ${editableResults.length} archivo${editableResults.length !== 1 ? 's' : ''}`}
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  setIsProcessed(false);
                  setShowResults(false);
                  setProcessingResults([]);
                  setEditableResults([]);
                }}
                className="w-full"
              >
                ← Volver a Seleccionar Archivos
              </Button>
            </div>
          </DialogFooter>
        </form>
      )}
    </div>
  );
}

// Component to display and edit processing results for each uploaded file
function EditableProcessingResultCard({ 
  result, 
  onUpdate 
}: { 
  result: any; 
  onUpdate: (updatedResult: any) => void;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedDescription, setEditedDescription] = React.useState(result.aiDescription);
  const [editedTags, setEditedTags] = React.useState(result.aiTags.join(', '));

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-600 bg-green-50';
    if (confidence > 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'mistral-pdf':
      case 'mistral':
        return <Bot className="h-3 w-3 text-orange-500" />;
      case 'openai-vision':
      case 'openai':
        return <Zap className="h-3 w-3 text-green-500" />;
      case 'tesseract':
        return <Eye className="h-3 w-3 text-blue-500" />;
      case 'regex':
        return <Cpu className="h-3 w-3 text-gray-500" />;
      default:
        return <FileText className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const handleSaveEdit = () => {
    const updatedResult = {
      ...result,
      aiDescription: editedDescription,
      aiTags: editedTags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
    };
    onUpdate(updatedResult);
    setIsEditing(false);
  };

  const formatExtractedData = (data: Record<string, any>) => {
    if (!data || Object.keys(data).length === 0) return null;
    
    return Object.entries(data).map(([key, value]) => (
      <div key={key} className="flex justify-between items-center py-1">
        <span className="text-sm font-medium text-muted-foreground">{key}:</span>
        <span className="text-sm">{value !== null ? String(value) : '-'}</span>
      </div>
    ));
  };

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm truncate max-w-[200px]" title={result.fileName}>
            {result.fileName}
          </span>
          {result.error && (
            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">Error</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(result.confidence)}`}>
            {Math.round(result.confidence * 100)}%
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="h-6 w-6 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* AI Providers Info */}
      {result.metadata && (
        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
          <span>Procesado con:</span>
          {result.metadata.ocrProvider && (
            <div className="flex items-center gap-1">
              {getProviderIcon(result.metadata.ocrProvider)}
              <span>{result.metadata.ocrProvider}</span>
            </div>
          )}
          {result.metadata.aiProvider && (
            <div className="flex items-center gap-1">
              {getProviderIcon(result.metadata.aiProvider)}
              <span>{result.metadata.aiProvider}</span>
            </div>
          )}
        </div>
      )}

      {/* Editable Description and Tags */}
      {isEditing && (
        <div className="space-y-3 mb-3 p-3 bg-blue-50 rounded border">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Descripción:</Label>
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Etiquetas (separadas por coma):</Label>
            <Input
              value={editedTags}
              onChange={(e) => setEditedTags(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEdit}>
              Guardar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setEditedDescription(result.aiDescription);
                setEditedTags(result.aiTags.join(', '));
                setIsEditing(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between h-6">
            <span className="text-xs">Ver detalles del procesamiento</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-3 mt-2">
          {/* Error Message */}
          {result.error && (
            <div className="bg-red-50 border border-red-200 p-2 rounded text-sm text-red-700">
              <strong>Error:</strong> {result.error}
            </div>
          )}

          {/* Generated Description and Tags */}
          <div className="space-y-2 bg-muted p-2 rounded">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Descripción generada:</Label>
              <p className="text-sm">{result.aiDescription}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Etiquetas generadas:</Label>
              <div className="flex flex-wrap gap-1">
                {result.aiTags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* OCR Text */}
          {result.ocrText && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1">
                {getProviderIcon(result.metadata?.ocrProvider || 'unknown')}
                Texto extraído (OCR):
              </Label>
              <div className="max-h-24 overflow-y-auto bg-muted p-2 rounded text-xs">
                {result.ocrText}
              </div>
            </div>
          )}

          {/* Extracted Data */}
          {result.extractedData && Object.keys(result.extractedData).length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1">
                {getProviderIcon('openai')}
                Datos estructurados extraídos:
              </Label>
              <div className="bg-muted p-2 rounded space-y-1">
                {formatExtractedData(result.extractedData)}
              </div>
            </div>
          )}

          {/* No processing results */}
          {!result.ocrText && (!result.extractedData || Object.keys(result.extractedData).length === 0) && !result.error && (
            <div className="text-xs text-muted-foreground text-center py-2">
              No se extrajo contenido adicional de este archivo
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
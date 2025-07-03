'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Upload, X, ChevronDown, Eye, FileText, Edit, Bot, Cpu, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { DOCUMENT_CATEGORIES } from '../types';
import { uploadDocumentsAction } from '../actions/document-actions';
import type { Folder } from '../types';

interface AddDocumentCardProps {
  obraId: string;
  currentFolder: Folder | null;
  folders: Folder[];
}

export function AddDocumentCard({ obraId, currentFolder, folders }: AddDocumentCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('otros');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(currentFolder?.id || 'unassigned');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [editableResults, setEditableResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
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
        const folderId = selectedFolderId !== 'unassigned' ? selectedFolderId : '';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isProcessed || editableResults.length === 0) {
      toast.error('Primero procesa los archivos');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('obra_id', obraId);
      formData.append('category', category);
      formData.append('description', description || '');

      // Add folder_id if selected
      if (selectedFolderId !== 'unassigned') {
        formData.append('folder_id', selectedFolderId);
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

      await uploadDocumentsAction(formData);

      toast.success('Documentos subidos correctamente');
      handleClose();
      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir documentos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setDescription('');
    setCategory('otros');
    setSelectedFolderId(currentFolder?.id || 'unassigned');
    setIsProcessed(false);
    setShowResults(false);
    setEditableResults([]);
    setProcessingStatus('');
    setIsOpen(false);
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
    <>
      <div
        className="group cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-col items-center gap-2 p-3 h-48 w-40  hover:bg-muted transition-colors bg-white outline outline-dashed  outline-[#09090b1a] outline-[3px] shadow-lite relative">
          <span className="bg-white absolute top-[-3px] right-[-3px] w-7 h-7 border border-dashed border-[3px] border-[#09090b1a] border-dash border-t-0 border-r-0 overflow-hidden" >
            <div className="noise-bg  border border-t-0 border-r-0 !absolute !top-0 !right-0 !w-full !h-full -z-10" />
            <div className="content-[''] absolute top-0 right-0 w-full h-full  border-t-0 border-l-0 border-[#fefefe_#ffffff00] border-[23px] z-10" />
          </span>
          <Plus className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            Nuevo Documento
          </span>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentFolder ? `Subir Documentos a ${currentFolder.name}` : 'Subir Documentos'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Selection Section - Hidden when processed */}
            {!isProcessed && (
              <>
                {/* File Upload Area */}
                <div className="space-y-4">
                  <Label>Archivos</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                      }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Arrastra archivos aquí o haz clic para seleccionar
                    </p>
                    <Input
                      type="file"
                      multiple
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                      id="file-input"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      Seleccionar archivos
                    </Button>
                  </div>

                  {/* Selected Files */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      <Label>Archivos seleccionados ({files.length})</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                            <span className="truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Upload Configuration - Always visible */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
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

              <div className="space-y-2">
                <Label>Carpeta</Label>
                <Select
                  value={selectedFolderId}
                  onValueChange={setSelectedFolderId}
                  disabled={!!currentFolder}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin clasificar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin Clasificar</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        📁 {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción (Opcional)</Label>
              <Textarea
                placeholder="Descripción del documento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <DialogFooter>
                  <div className="space-y-2 w-full">
                    <Button type="button" variant="outline" onClick={handleClose}>
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={editableResults.length === 0 || isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? 'Subiendo...' : `📤 Subir ${editableResults.length} archivo${editableResults.length !== 1 ? 's' : ''}`}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsProcessed(false);
                        setShowResults(false);
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

            {/* Default Footer for Step 1 */}
            {!isProcessed && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
              </DialogFooter>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(result.aiDescription);
  const [editedTags, setEditedTags] = useState(result.aiTags.join(', '));

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-600 bg-green-50';
    if (confidence > 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'mistral-pdf':
      case 'mistral':
        return <Bot className="h-3 w-3 text-orange-500" title="Mistral AI" />;
      case 'openai-vision':
      case 'openai':
        return <Zap className="h-3 w-3 text-green-500" title="OpenAI" />;
      case 'tesseract':
        return <Eye className="h-3 w-3 text-blue-500" title="Tesseract OCR" />;
      case 'regex':
        return <Cpu className="h-3 w-3 text-gray-500" title="Regex Pattern" />;
      default:
        return <FileText className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const handleSaveEdit = () => {
    const updatedResult = {
      ...result,
      aiDescription: editedDescription,
      aiTags: editedTags.split(',').map(tag => tag.trim()).filter(Boolean)
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
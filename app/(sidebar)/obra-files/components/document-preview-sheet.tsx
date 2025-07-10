'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, X, ExternalLink, Brain, Loader2, ChevronDown, ChevronUp, Copy, CheckCircle } from 'lucide-react';
import { processWithGPTAction, processWithMistralAction, processWithOCROnlyAction } from '../actions/document-actions';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { DOCUMENT_CATEGORIES } from '../types';
import type { ObraDocument } from '../types';

interface DocumentPreviewSheetProps {
  document: ObraDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreviewSheet({ document, isOpen, onClose }: DocumentPreviewSheetProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState<string | null>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPreviewUrl = async () => {
      if (!document || !isOpen) {
        setPreviewUrl(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/documents/${document.id}/download`);
        if (!response.ok) throw new Error('Failed to fetch document URL');

        const data = await response.json();
        setPreviewUrl(data.url);
      } catch (err) {
        setError('Error al cargar la vista previa');
        console.error('Error fetching document URL:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreviewUrl();
  }, [document, isOpen]);

  const handleDownload = async () => {
    if (!document || !previewUrl) return;

    const link = window.document.createElement('a');
    link.href = previewUrl;
    link.download = document.name;
    link.click();
  };

  const handleProcessWithProvider = async (provider: 'gpt' | 'mistral' | 'ocr-only') => {
    if (!document || processing) return;

    setProcessing(true);
    setProcessMessage(null);

    try {
      console.log(`Processing document with ${provider}:`, document.id);
      const formData = new FormData();
      formData.append('document_id', document.id);
      
      let result;
      if (provider === 'gpt') {
        result = await processWithGPTAction(formData);
      } else if (provider === 'mistral') {
        result = await processWithMistralAction(formData);
      } else {
        result = await processWithOCROnlyAction(formData);
      }
      
      console.log('Processing result:', result);
      
      if (result.success) {
        setProcessMessage(result.message || 'Documento procesado exitosamente');
        setProcessingResult(result.result);
        setShowResults(true);
        
        // Update document status in UI without reloading
        if (document) {
          document.processing_status = 'completed';
        }
      } else {
        setProcessMessage(`Error: ${result.message || 'Error desconocido'}`);
        setProcessingResult(null);
      }
    } catch (error) {
      console.error('Processing error:', error);
      setProcessMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (!document) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-4xl p-0 bg-white/90 backdrop-blur-lg"
      >
        <div className="flex h-full">
          {/* Preview Area - 75% */}
          <div className="flex-1 p-6 overflow-hidden">
            <div className="h-full flex flex-col">
              <SheetHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-2 text-lg">
                    <span className="text-2xl">
                      {document.type.startsWith('image/') ? '🖼️' : '📄'}
                    </span>
                    {document.name}
                  </SheetTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProcessWithProvider('gpt')}
                      disabled={processing}
                      className="bg-green-50 hover:bg-green-100 border-green-200"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4 mr-2" />
                      )}
                      GPT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProcessWithProvider('mistral')}
                      disabled={processing}
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4 mr-2" />
                      )}
                      Mistral
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProcessWithProvider('ocr-only')}
                      disabled={processing}
                      className="bg-gray-50 hover:bg-gray-100 border-gray-200"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4 mr-2" />
                      )}
                      OCR
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      disabled={!previewUrl}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </SheetHeader>

              {/* Process Message */}
              {processMessage && (
                <div className={`mb-4 p-3 rounded-md ${
                  processMessage.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>
                  <p className="text-sm">{processMessage}</p>
                </div>
              )}

              {/* Processing Results */}
              {processingResult && (
                <div className="mb-4 border rounded-lg overflow-hidden">
                  <div 
                    className="bg-gray-50 p-3 cursor-pointer flex items-center justify-between hover:bg-gray-100"
                    onClick={() => setShowResults(!showResults)}
                  >
                    <h3 className="font-medium text-sm">Resultados del Procesamiento</h3>
                    {showResults ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                  
                  {showResults && (
                    <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                      {/* Provider Info */}
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-medium">Proveedor:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          processingResult.provider?.includes('GPT') ? 'bg-green-100 text-green-700' :
                          processingResult.provider?.includes('Mistral') ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {processingResult.provider || 'Desconocido'}
                        </span>
                        {processingResult.timestamp && (
                          <span className="text-gray-500">
                            {new Date(processingResult.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {processingResult.description && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm">Descripción</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(processingResult.description)}
                              className="h-6 px-2"
                            >
                              {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </Button>
                          </div>
                          <p className="text-sm bg-gray-50 p-2 rounded border">
                            {processingResult.description}
                          </p>
                        </div>
                      )}

                      {/* Tags */}
                      {processingResult.tags && processingResult.tags.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Etiquetas</h4>
                          <div className="flex flex-wrap gap-1">
                            {processingResult.tags.map((tag: string, index: number) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* OCR Text */}
                      {processingResult.ocrText && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm">Texto Extraído</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(processingResult.ocrText)}
                              className="h-6 px-2"
                            >
                              {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </Button>
                            <span className="text-xs text-gray-500">
                              ({processingResult.ocrText.length} caracteres)
                            </span>
                          </div>
                          <div className="bg-gray-50 p-3 rounded border text-sm max-h-40 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-mono text-xs">
                              {processingResult.ocrText}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      {processingResult.metadata && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Metadatos</h4>
                          <div className="bg-gray-50 p-3 rounded border text-xs space-y-1">
                            {Object.entries(processingResult.metadata).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="font-medium text-gray-600">
                                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                </span>
                                <span className="text-gray-800">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Preview Content */}
              <div className="flex-1 min-h-0">
                <DocumentPreview
                  document={document}
                  previewUrl={previewUrl}
                  loading={loading}
                  error={error}
                />
              </div>
            </div>
          </div>

          {/* Metadata Sidebar - 25% */}
          <div className="w-80 bg-muted/30 p-6 border-l overflow-y-auto">
            <DocumentMetadata document={document} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface DocumentPreviewProps {
  document: ObraDocument;
  previewUrl: string | null;
  loading: boolean;
  error: string | null;
}

function DocumentPreview({ document, previewUrl, loading, error }: DocumentPreviewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Cargando vista previa...</p>
        </div>
      </div>
    );
  }

  if (error || !previewUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-sm text-muted-foreground mb-4">
            {error || 'No se puede mostrar la vista previa'}
          </p>
          {previewUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir en nueva pestaña
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Image preview
  if (document.type.startsWith('image/')) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full bg-muted/20 rounded-lg overflow-hidden flex items-center justify-center"
      >
        <img
          src={previewUrl}
          alt={document.name}
          className="max-w-full max-h-full object-contain rounded"
        />
      </motion.div>
    );
  }

  // PDF preview
  if (document.type === 'application/pdf') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full bg-white rounded-lg overflow-hidden"
      >
        <iframe
          src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
          className="w-full h-full"
          title={`Vista previa de ${document.name}`}
        />
      </motion.div>
    );
  }

  // Office documents preview
  if (document.type.includes('word') ||
    document.type.includes('excel') ||
    document.type.includes('powerpoint') ||
    document.type.includes('openxmlformats')) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full bg-white rounded-lg overflow-hidden"
      >
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`}
          className="w-full h-full"
          title={`Vista previa de ${document.name}`}
        />
      </motion.div>
    );
  }

  // Default preview for unsupported file types
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full bg-muted/20 rounded-lg"
    >
      <div className="text-6xl mb-4">📄</div>
      <h3 className="text-lg font-medium mb-2">Vista previa no disponible</h3>
      <p className="text-muted-foreground mb-4 text-center">
        Este tipo de archivo no admite vista previa.<br />
        Puedes descargarlo para verlo.
      </p>
      <Button
        variant="outline"
        onClick={() => window.open(previewUrl, '_blank')}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Abrir en nueva pestaña
      </Button>
    </motion.div>
  );
}

function DocumentMetadata({ document }: { document: ObraDocument }) {
  const category = DOCUMENT_CATEGORIES.find(c => c.id === document.category);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-4">Información del documento</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Tamaño</label>
            <p className="text-sm">{Math.round(document.size / 1024)} KB</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Tipo</label>
            <p className="text-sm">{document.type}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Categoría</label>
            <div className="flex items-center gap-2">
              {category && (
                <>
                  <span>{category.icon}</span>
                  <span className="text-sm">{category.name}</span>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Subido</label>
            <p className="text-sm">
              {formatDistanceToNow(new Date(document.created_at), {
                addSuffix: true,
                locale: es
              })}
            </p>
          </div>

          {document.folder_id && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Carpeta</label>
              <div className="flex items-center gap-2">
                <span>📁</span>
                <span className="text-sm">En carpeta</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-muted-foreground">Estado de procesamiento</label>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                document.processing_status === 'completed' ? 'bg-green-500' :
                document.processing_status === 'processing' ? 'bg-yellow-500' :
                document.processing_status === 'failed' ? 'bg-red-500' :
                'bg-gray-400'
              }`}></span>
              <span className="text-sm capitalize">
                {document.processing_status === 'pending' ? 'Pendiente' :
                 document.processing_status === 'processing' ? 'Procesando' :
                 document.processing_status === 'completed' ? 'Completado' :
                 document.processing_status === 'failed' ? 'Error' :
                 'Desconocido'}
              </span>
            </div>
            {/* Show processing metadata if available */}
            {document.processing_metadata && (
              <div className="mt-2 text-xs text-gray-600">
                {document.processing_metadata.provider && (
                  <div>Proveedor: {document.processing_metadata.provider}</div>
                )}
                {document.processing_metadata.processed_at && (
                  <div>
                    Procesado: {new Date(document.processing_metadata.processed_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {document.description && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Descripción</label>
          <p className="text-sm mt-1">{document.description}</p>
        </div>
      )}

      {document.tags && document.tags.length > 0 && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Etiquetas</label>
          <div className="flex flex-wrap gap-1 mt-2">
            {document.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 
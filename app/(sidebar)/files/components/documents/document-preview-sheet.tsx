'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, X, ExternalLink, Brain, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/app/auth/utils';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { DOCUMENT_CATEGORIES } from '../../types';
import type { ObraDocument } from '../../types';

interface DocumentPreviewSheetProps {
  document: ObraDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreviewSheet({ document, isOpen, onClose }: DocumentPreviewSheetProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 410) {
            // File missing from storage
            setError(`File not available: ${data.message || 'The file exists in the database but is missing from storage.'}`);
          } else {
            setError(`Error loading document: ${data.error || 'Unknown error'}`);
          }
          return;
        }

        if (data.url) {
          setPreviewUrl(data.url);
        } else {
          setError('No download URL available');
        }
      } catch (err) {
        setError('Error loading preview');
        console.error('Error fetching document URL:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreviewUrl();
  }, [document, isOpen]);

  const handleDownload = async () => {
    if (!document || !previewUrl) return;

    try {
      const link = window.document.createElement('a');
      link.href = previewUrl;
      link.download = document.name;
      link.click();
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Error downloading file');
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
                      {(document.file_type || document.type || '').startsWith('image/') ? '🖼️' : '📄'}
                    </span>
                    {document.name}
                  </SheetTitle>
                  <div className="flex items-center gap-2">
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

              {/* AI Processing Status */}
              {document.processing_status === 'processing' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200"
                >
                  <div className="flex items-center gap-2 text-blue-700">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-medium">IA analizando documento...</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">Estamos extrayendo información y generando la descripción del documento.</p>
                </motion.div>
              )}

              {/* AI Content */}
              {(document.description || document.tags?.length > 0) && (
                <div className="mb-4 border rounded-lg overflow-hidden bg-gradient-to-br from-blue-50/50 to-purple-50/50">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 text-white">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <h3 className="font-medium text-sm">Análisis IA</h3>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {document.description && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Descripción</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {document.description}
                        </p>
                      </div>
                    )}
                    
                    {document.tags && document.tags.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Categorías detectadas</h4>
                        <div className="flex flex-wrap gap-1">
                          {document.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
  const fileType = document.file_type || document.type || '';
  if (fileType.startsWith('image/')) {
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
  if (fileType === 'application/pdf') {
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
  if (fileType.includes('word') ||
    fileType.includes('excel') ||
    fileType.includes('powerpoint') ||
    fileType.includes('openxmlformats')) {
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
            <p className="text-sm">{Math.round((document.file_size || document.size || 0) / 1024)} KB</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Tipo</label>
            <p className="text-sm">{document.file_type || document.type || 'Unknown'}</p>
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
              <span className={`w-2 h-2 rounded-full ${document.processing_status === 'completed' ? 'bg-green-500' :
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
          </div>

          {/* Extracted Data Section */}
          <ExtractedDataSection document={document} />
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

function ExtractedDataSection({ document }: { document: ObraDocument }) {
  const [extractedData, setExtractedData] = useState<any>(null);
  const [fieldDefinitions, setFieldDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadExtractedData = async () => {
    if (!document.folder_id) {
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Fetch field definitions for the folder
      const { data: fields, error: fieldsError } = await supabase
        .from('folder_field_definitions')
        .select('*')
        .eq('folder_id', document.folder_id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!fieldsError && fields) {
        setFieldDefinitions(fields);
      }

      // Fetch extracted data for this document
      const { data: extractedDataRecords, error: dataError } = await supabase
        .from('extracted_data')
        .select('*')
        .eq('file_id', document.id)
        .single();

      if (!dataError && extractedDataRecords) {
        setExtractedData(extractedDataRecords.extracted_data);
      }
    } catch (error) {
      console.error('Error loading extracted data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExtractedData();
  }, [document.id, document.folder_id, document.processing_status]); // Add processing_status to deps

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    
    // Set up real-time subscription for this document's extracted data
    const subscription = supabase
      .channel(`document-${document.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'extracted_data',
          filter: `file_id=eq.${document.id}`,
        },
        (payload) => {
          console.log('Extracted data updated:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setExtractedData(payload.new.extracted_data);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'files',
          filter: `id=eq.${document.id}`,
        },
        (payload) => {
          console.log('Document status updated:', payload);
          // If processing completed, refresh extracted data
          if (payload.new.processing_status === 'completed' && payload.old?.processing_status !== 'completed') {
            console.log('Document processing completed, refreshing extracted data in preview...');
            // Reload extracted data
            loadExtractedData();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [document.id, document.folder_id]);

  if (!document.folder_id) {
    return null;
  }

  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground">Datos Extraídos</label>
      
      {document.processing_status === 'pending' && (
        <div className="flex items-center gap-2 mt-1">
          <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />
          <span className="text-xs text-yellow-600">En cola para procesamiento...</span>
        </div>
      )}
      
      {document.processing_status === 'processing' && (
        <div className="flex items-center gap-2 mt-1">
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          <span className="text-xs text-blue-600">Extrayendo datos...</span>
        </div>
      )}

      {document.processing_status === 'failed' && (
        <div className="flex items-center gap-2 mt-1">
          <X className="h-3 w-3 text-red-500" />
          <span className="text-xs text-red-600">Error en el procesamiento</span>
        </div>
      )}

      {document.processing_status === 'completed' && (
        <>
          {loading ? (
            <div className="flex items-center gap-2 mt-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs text-muted-foreground">Cargando datos extraídos...</span>
            </div>
          ) : fieldDefinitions.length === 0 ? (
            <p className="text-xs text-muted-foreground mt-1">No hay campos definidos para esta carpeta</p>
          ) : extractedData && Object.keys(extractedData).length > 0 ? (
            <div className="mt-2 space-y-2">
              {fieldDefinitions.map((field) => (
                <div key={field.id} className="bg-muted/30 p-2 rounded text-xs">
                  <div className="font-medium text-muted-foreground">{field.field_label}</div>
                  <div className="text-sm">
                    {extractedData[field.field_name] !== undefined && extractedData[field.field_name] !== null 
                      ? String(extractedData[field.field_name])
                      : 'No extraído'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Datos no disponibles</p>
          )}
        </>
      )}
    </div>
  );
} 
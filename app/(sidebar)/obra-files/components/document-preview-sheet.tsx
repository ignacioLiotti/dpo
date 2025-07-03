'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, X, ExternalLink } from 'lucide-react';
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
'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, X, ExternalLink, FileText, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { DOCUMENT_CATEGORIES } from '@/lib/schemas/document-schemas';
import type { ObraDocument } from '@/lib/schemas/document-schemas';

interface DocumentPreviewSheetProps {
  document: ObraDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreviewSheet({
  document,
  isOpen,
  onClose,
}: DocumentPreviewSheetProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch document URL when sheet opens
  useEffect(() => {
    if (document && isOpen && !previewUrl) {
      setIsLoading(true);
      setError(null);

      fetch(`/api/documents/${document.id}/download`)
        .then(response => response.json())
        .then(data => {
          if (data.url) {
            setPreviewUrl(data.url);
          } else {
            setError('Error al obtener la URL del documento');
          }
        })
        .catch(() => {
          setError('Error al cargar el documento');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [document, isOpen, previewUrl]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      setError(null);
    }
  }, [isOpen]);

  if (!document) return null;

  const handleDownload = () => {
    if (previewUrl) {
      const link = window.document.createElement('a');
      link.href = previewUrl;
      link.download = document.name;
      link.click();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-4xl w-full overflow-y-auto floating-scroll bg-white/60 backdrop-blur-sm p-2">
        <div className='flex flex-col gap-6 bg-white border w-full py-4 px-8 rounded-xl h-full'>
          <SheetHeader className="flex-shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-2xl">
                  {document.type.startsWith('image/') ? '🖼️' : '📄'}
                </span>
                <SheetTitle className="text-xl font-semibold truncate">
                  {document.name}
                </SheetTitle>
              </div>
              <Button onClick={handleDownload} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
            {/* File Preview Section */}
            <div className="lg:col-span-3 min-h-0">
              <FilePreview
                document={document}
                previewUrl={previewUrl}
                isLoading={isLoading}
                error={error}
              />
            </div>

            {/* File Metadata Section */}
            <div className="lg:col-span-1 space-y-4 overflow-y-auto">
              <DocumentMetadata document={document} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// File Preview Component
interface FilePreviewProps {
  document: ObraDocument;
  previewUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

function FilePreview({ document, previewUrl, isLoading, error }: FilePreviewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Cargando vista previa...</p>
        </div>
      </div>
    );
  }

  if (error || !previewUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {error || 'No se puede mostrar la vista previa'}
          </p>
        </div>
      </div>
    );
  }

  // Image preview
  if (document.type.startsWith('image/')) {
    return (
      <div className="relative h-full bg-muted rounded-lg overflow-hidden border p-2">
        <img
          src={previewUrl}
          alt={document.name}
          className="w-full h-full object-contain"
          onError={() => console.error('Error loading image')}
        />
      </div>
    );
  }

  // PDF preview
  if (document.type === 'application/pdf') {
    return (
      <div className="relative h-full bg-muted rounded-lg overflow-hidden">
        <iframe
          src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          className="w-full h-full"
          title={`Vista previa de ${document.name}`}
        />
        <div className="absolute top-2 right-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.open(previewUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Abrir
          </Button>
        </div>
      </div>
    );
  }

  // Office documents preview
  if (document.type.includes('word') ||
    document.type.includes('excel') ||
    document.type.includes('powerpoint') ||
    document.type.includes('openxmlformats')) {
    return (
      <div className="relative h-full bg-muted rounded-lg overflow-hidden">
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`}
          className="w-full h-full"
          title={`Vista previa de ${document.name}`}
        />
        <div className="absolute top-2 right-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.open(previewUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Abrir
          </Button>
        </div>
      </div>
    );
  }

  // Default preview for unsupported file types
  return (
    <div className="flex flex-col items-center justify-center h-full bg-muted rounded-lg">
      <div className="text-6xl mb-4">
        {document.type.startsWith('image/') ? '🖼️' :
          document.type === 'application/pdf' ? '📄' :
            document.type.startsWith('text/') ? '📝' :
              document.type.includes('word') ? '📄' :
                document.type.includes('excel') ? '📊' :
                  document.type.includes('powerpoint') ? '📊' : '📁'}
      </div>
      <h3 className="text-lg font-medium mb-2">Vista previa no disponible</h3>
      <p className="text-muted-foreground mb-4 text-center">
        Este tipo de archivo no admite vista previa.<br />
        Puedes descargarlo para verlo.
      </p>
      <Button
        variant="outline"
        onClick={() => window.open(previewUrl, '_blank')}
      >
        <Download className="h-4 w-4 mr-2" />
        Descargar archivo
      </Button>
    </div>
  );
}

// Document metadata component
interface DocumentMetadataProps {
  document: ObraDocument;
}

function DocumentMetadata({ document }: DocumentMetadataProps) {
  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <h3 className="font-semibold text-lg mb-3">Información del archivo</h3>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-muted-foreground">Tamaño:</span>
          <span className="font-mono">
            {Math.round(document.size / 1024)} KB
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-medium text-muted-foreground">Tipo:</span>
          <span className="font-mono text-xs">
            {document.type}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-medium text-muted-foreground">Categoría:</span>
          <Badge variant="secondary" className="w-fit">
            {DOCUMENT_CATEGORIES.find(c => c.id === document.category)?.name || 'Otros'}
          </Badge>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-medium text-muted-foreground">Creado:</span>
          <span>
            {formatDistanceToNow(new Date(document.created_at), {
              addSuffix: true,
              locale: es
            })}
          </span>
        </div>

        {document.description && (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-muted-foreground">Descripción:</span>
            <p className="text-sm leading-relaxed bg-muted p-3 rounded">
              {document.description}
            </p>
          </div>
        )}

        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="font-medium text-muted-foreground">Etiquetas:</span>
            <div className="flex flex-wrap gap-1">
              {document.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
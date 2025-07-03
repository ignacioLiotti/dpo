'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreVertical, Download, Edit3, Trash2, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DocumentPreviewSheet } from './document-preview-sheet';

import type { ObraDocument, Folder } from '../types';
import { AddDocumentCard } from './add-document-card';

interface DocumentGridProps {
  documents: ObraDocument[];
  obraId: string;
  currentFolder: Folder | null;
  folders: Folder[];
}

export function DocumentGrid({ documents, obraId, currentFolder, folders }: DocumentGridProps) {
  return (
    <>
      {documents.map((document) => (
        <DocumentCardClient
          key={document.id}
          document={document}
          folders={folders}
        />
      ))}
      <AddDocumentCard
        obraId={obraId}
        currentFolder={currentFolder}
        folders={folders}
      />
    </>
  );
}


interface DocumentCardClientProps {
  document: ObraDocument;
  folders: Folder[];
}

export function DocumentCardClient({ document, folders }: DocumentCardClientProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`);
      const { url } = await response.json();

      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name;
      link.click();
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  return (
    <>
      <div
        className="group cursor-pointer"
        onClick={handlePreview}
      >
        <div className="flex flex-col items-center gap-2 p-3 h-48 w-40  hover:bg-muted transition-colors bg-white outline outline-outline outline-1 shadow-lite relative">
          <span className=" bg-white absolute top-[-5px] right-[-5px] w-7 h-7 overflow-hidden z-10" >
            <div className="noise-bg  border border-t-0 border-r-0 !absolute !top-0 !right-0 !w-full !h-full -z-[100]" />
          </span>
          <span className="bg-white absolute top-[-1px] right-[-1px] w-6 h-6 border border-t-0 border-r-0 overflow-hidden z-20" >
            <div className="noise-bg  border border-t-0 border-r-0 !absolute !top-0 !right-0 !w-full !h-full -z-[100]" />
            <div className="content-[''] absolute top-0 right-0 w-full h-full  border-t-0 border-l-0 border-[#fefefe_#ffffff00] border-[23px] z-[100]" />
          </span>
          <div className="text-4xl">
            {/* {document.type.startsWith('image/') ? '🖼️' : '📄'} */}
          </div>
          <span
            className="text-sm font-medium text-center truncate w-full"
            title={document.name}
          >
            {document.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(document.created_at), {
              addSuffix: true,
              locale: es
            })}
          </span>

          {/* Document Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Vista previa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <DocumentPreviewSheet
        document={document}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
} 
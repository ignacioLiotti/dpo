import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, Eye, Edit3, Trash2, MoreVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DocumentCardClient } from './document-card-client';
import { DOCUMENT_CATEGORIES } from '../types';
import type { ObraDocument, Folder } from '../types';

interface DocumentTableProps {
  documents: ObraDocument[];
  folders: Folder[];
}

// Helper functions
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getCategoryInfo = (categoryId?: string) => {
  return DOCUMENT_CATEGORIES.find(c => c.id === categoryId) || { name: 'Otros', icon: '📄' };
};

export function DocumentTable({ documents, folders }: DocumentTableProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium mb-2">No hay documentos</h3>
        <p className="text-muted-foreground">
          Los documentos aparecerán aquí cuando se suban.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Carpeta</TableHead>
            <TableHead>Tamaño</TableHead>
            <TableHead>Modificado</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <DocumentTableRow
              key={document.id}
              document={document}
              folders={folders}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface DocumentTableRowProps {
  document: ObraDocument;
  folders: Folder[];
}

function DocumentTableRow({ document, folders }: DocumentTableRowProps) {
  const category = getCategoryInfo(document.category);
  const folder = document.folder_id ? folders.find(f => f.id === document.folder_id) : null;

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
      <TableRow className="group hover:bg-muted/50 cursor-pointer">
        <TableCell>
          <div className="text-2xl">
            {document.type.startsWith('image/') ? '🖼️' : '📄'}
          </div>
        </TableCell>
        <TableCell>
          <div className="font-medium">{document.name}</div>
          {document.description && (
            <div className="text-sm text-muted-foreground truncate max-w-64">
              {document.description}
            </div>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span>{category.icon}</span>
            <span className="text-sm">{category.name}</span>
          </div>
        </TableCell>
        <TableCell>
          {folder ? (
            <div className="flex items-center gap-2">
              <span>📁</span>
              <span className="text-sm">{folder.name}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Sin clasificar</span>
          )}
        </TableCell>
        <TableCell>
          <span className="text-sm">{formatFileSize(document.size)}</span>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(document.created_at), {
              addSuffix: true,
              locale: es
            })}
          </span>
        </TableCell>
        <TableCell>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
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
        </TableCell>
      </TableRow>
      {/* Hidden DocumentCardClient to handle preview functionality */}
      <div className="hidden">
        <DocumentCardClient document={document} folders={folders} />
      </div>
    </>
  );
} 
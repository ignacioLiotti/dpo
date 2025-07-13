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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { DocumentPreviewSheet } from './document-preview-sheet';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import type { ObraDocument, Folder } from '../../types';
import { AddDocumentCard } from './add-document-card';
import { deleteDocumentAction } from '../../actions/document-actions';
import { DocumentThumbnail } from './document-thumbnail';

interface DocumentGridProps {
  documents: ObraDocument[];
  currentFolder: Folder | null;
  folders: Folder[];
}

export function DocumentGrid({ documents, currentFolder, folders }: DocumentGridProps) {
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
  const router = useRouter();

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
      toast.error('Error downloading document');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${document.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('id', document.id);

      await deleteDocumentAction(formData);
      toast.success('Document deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error deleting document');
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
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
              <DocumentThumbnail 
                document={document}
                className="w-full h-24 rounded-md mb-2"
              />
              <span
                className="text-sm font-medium text-center truncate w-full"
                title={document.name}
              >
                {document.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(document.created_at), {
                  addSuffix: true,
                  locale: undefined
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
                  <DropdownMenuContent align="end" className="pointer-events-auto">
                    <DropdownMenuItem onClick={handlePreview}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </ContextMenuItem>
          <ContextMenuItem>
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-red-600"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <DocumentPreviewSheet
        document={document}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
} 
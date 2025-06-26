'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

import { useSupabaseUpload } from '@/hooks/use-supabase-upload';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone';
import { uploadDocumentsAction } from '@/lib/actions/document-actions';
import { DOCUMENT_CATEGORIES, ALLOWED_MIME_TYPES } from '@/lib/schemas/document-schemas';
import type { Folder } from '@/lib/schemas/document-schemas';

interface UploadFormClientProps {
  obraId: string;
  currentFolder: Folder | null;
  folders: Folder[];
}

export function UploadFormClient({ obraId, currentFolder, folders }: UploadFormClientProps) {
  const router = useRouter();
  const [uploadCategory, setUploadCategory] = useState<string>('otros');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('unassigned');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Dropzone setup
  const dropzoneOptions = {
    bucketName: 'obra-vault',
    path: obraId,
    allowedMimeTypes: [...ALLOWED_MIME_TYPES],
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 10,
  };
  const dropzone = useSupabaseUpload(dropzoneOptions);

  const handleUpload = async () => {
    if (dropzone.files.length === 0) {
      toast.error('Selecciona al menos un archivo');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadDocumentsAction({
        obra_id: obraId,
        files: dropzone.files,
        category: uploadCategory,
        folder_id: currentFolder ? currentFolder.id : (selectedFolderId !== 'unassigned' ? selectedFolderId : undefined),
        description: uploadDescription || undefined,
      });

      if (result?.data?.success) {
        toast.success('Documentos subidos correctamente');
        dropzone.setFiles([]);
        setUploadDescription('');
        router.refresh(); // Refresh to show new documents
      } else {
        toast.error('Error al subir documentos');
      }
    } catch (error) {
      toast.error('Error al subir documentos');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Dropzone {...dropzone} className="min-h-[150px]">
        <DropzoneEmptyState />
        <DropzoneContent />
      </Dropzone>

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

        <div className="space-y-2">
          <Label>Carpeta</Label>
          <Select
            value={currentFolder ? currentFolder.id : selectedFolderId}
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
                  {folder.name}
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
          value={uploadDescription}
          onChange={(e) => setUploadDescription(e.target.value)}
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button
          onClick={handleUpload}
          disabled={isUploading || dropzone.files.length === 0}
          className="w-full"
        >
          {isUploading ? 'Subiendo...' : `Subir ${dropzone.files.length} archivo${dropzone.files.length !== 1 ? 's' : ''}`}
        </Button>
      </DialogFooter>
    </div>
  );
} 
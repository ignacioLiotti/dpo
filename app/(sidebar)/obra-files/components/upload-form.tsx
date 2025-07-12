import React from 'react';

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { DOCUMENT_CATEGORIES } from '../types';
import type { Folder } from '../types';
import { UploadFormClient } from './upload-form-client';

interface UploadFormProps {
  currentFolder: Folder | null;
  folders: Folder[];
}

export function UploadForm({ currentFolder, folders }: UploadFormProps) {
  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            📄 Subir Documentos
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {currentFolder ? `Subir Documentos a ${currentFolder.name}` : 'Subir Documentos'}
            </DialogTitle>
          </DialogHeader>

          <UploadFormClient
            currentFolder={currentFolder}
            folders={folders}
          />
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            📁 Nueva Carpeta
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nueva Carpeta</DialogTitle>
          </DialogHeader>

          <CreateFolderForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateFolderForm() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label>Nombre de la carpeta</Label>
        <input
          name="name"
          placeholder="Nombre de la carpeta..."
          className="w-full p-2 border rounded"
          required
        />
      </div>


      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit">
          Crear Carpeta
        </Button>
      </div>
    </form>
  );
} 
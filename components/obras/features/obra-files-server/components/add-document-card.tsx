'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Upload, X } from 'lucide-react';
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
import { DOCUMENT_CATEGORIES } from '@/lib/schemas/document-schemas';
import { uploadDocumentsAction } from '@/lib/actions/document-actions';
import type { Folder } from '@/lib/schemas/document-schemas';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error('Selecciona al menos un archivo');
      return;
    }

    setIsLoading(true);

    try {
      const result = await uploadDocumentsAction({
        obra_id: obraId,
        files,
        category,
        folder_id: selectedFolderId !== 'unassigned' ? selectedFolderId : undefined,
        description: description || undefined,
      });

      if (result?.data?.success) {
        toast.success('Documentos subidos correctamente');
        handleClose();
        router.refresh();
      } else {
        toast.error('Error al subir documentos');
      }
    } catch (error) {
      toast.error('Error al subir documentos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setDescription('');
    setCategory('otros');
    setSelectedFolderId(currentFolder?.id || 'unassigned');
    setIsOpen(false);
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

          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Form Fields */}
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || files.length === 0}
              >
                {isLoading ? 'Subiendo...' : `Subir ${files.length} archivo${files.length !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 
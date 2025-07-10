'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FileText, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

import { uploadDocumentsAction } from '../actions/document-actions';
import { DOCUMENT_CATEGORIES } from '../types';
import type { Folder } from '../types';

interface UploadFormClientProps {
  obraId: string;
  currentFolder: Folder | null;
  folders: Folder[];
}

export function UploadFormClient({ obraId, currentFolder, folders }: UploadFormClientProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState<string>('otros');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [folderHasExtraction, setFolderHasExtraction] = useState(false);

  // Check if current folder or selected folder has data extraction enabled
  useEffect(() => {
    const checkFolderExtraction = () => {
      const targetFolder = currentFolder || folders.find(f => f.id === selectedFolderId);
      setFolderHasExtraction(targetFolder?.extract_data || false);
    };
    
    checkFolderExtraction();
  }, [currentFolder, selectedFolderId, folders]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.error('Selecciona al menos un archivo');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('obra_id', obraId);
      formData.append('category', uploadCategory);
      formData.append('description', uploadDescription);
      formData.append('tags', uploadTags);
      
      // Add folder_id if selected
      const folderId = currentFolder ? currentFolder.id : (selectedFolderId || '');
      if (folderId) {
        formData.append('folder_id', folderId);
      }

      // Add files
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const result = await uploadDocumentsAction(formData);
      
      // Show success message
      const successMessage = folderHasExtraction 
        ? `${files.length} documento${files.length !== 1 ? 's' : ''} subido${files.length !== 1 ? 's' : ''} correctamente. Los archivos se procesarán automáticamente con IA.`
        : `${files.length} documento${files.length !== 1 ? 's' : ''} subido${files.length !== 1 ? 's' : ''} correctamente.`;
      
      toast.success(successMessage);
      
      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, {
            duration: 5000,
          });
        });
      }
      
      // Reset form after successful upload
      setFiles([]);
      setUploadDescription('');
      setUploadTags('');
      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir documentos');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleUpload} className="space-y-4">
        {/* File Drop Zone */}
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {files.length > 0 ? `${files.length} archivo${files.length !== 1 ? 's' : ''} seleccionado${files.length !== 1 ? 's' : ''}` : 'Selecciona archivos o arrastra aquí'}
            </p>
            <p className="text-sm text-muted-foreground">
              Formatos soportados: PDF, JPG, PNG, TIFF, BMP (máx. 10MB c/u)
            </p>
            <Input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp"
              onChange={handleFileChange}
              className="mt-2"
            />
          </div>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Archivos seleccionados:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <span className="truncate flex-1">{file.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Selection */}
          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select value={uploadCategory} onValueChange={setUploadCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Folder Selection (only if not in a folder) */}
          {!currentFolder && (
            <div>
              <Label htmlFor="folder">Carpeta (opcional)</Label>
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona carpeta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin carpeta</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name} {folder.extract_data && '🤖'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Textarea
            id="description"
            placeholder="Descripción de los documentos..."
            value={uploadDescription}
            onChange={(e) => setUploadDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* Tags */}
        <div>
          <Label htmlFor="tags">Etiquetas (opcional)</Label>
          <Input
            id="tags"
            placeholder="tag1, tag2, tag3..."
            value={uploadTags}
            onChange={(e) => setUploadTags(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separa las etiquetas con comas
          </p>
        </div>

        {/* AI Processing Notice */}
        {folderHasExtraction && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">🤖</span>
              <span className="text-sm text-blue-800 font-medium">
                Procesamiento automático con IA habilitado
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Los archivos en esta carpeta se procesarán automáticamente con OCR e IA para extraer datos estructurados.
            </p>
          </div>
        )}

        {/* Upload Button */}
        <DialogFooter>
          <Button 
            type="submit" 
            disabled={files.length === 0 || isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? 'Subiendo...' : `📤 Subir ${files.length} archivo${files.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
}
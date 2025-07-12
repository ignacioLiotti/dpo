'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Upload, X, FileText } from 'lucide-react';
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
import { DOCUMENT_CATEGORIES } from '../types';
import { uploadDocumentsAction } from '../actions/document-actions';
import type { Folder } from '../types';

interface AddDocumentCardProps {
  currentFolder: Folder | null;
  folders: Folder[];
}

export function AddDocumentCard({ currentFolder, folders }: AddDocumentCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('otros');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(currentFolder?.id || 'none');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCardDragging, setIsCardDragging] = useState(false);
  const [folderHasExtraction, setFolderHasExtraction] = useState(false);

  // Check if current folder or selected folder has data extraction enabled
  useEffect(() => {
    const checkFolderExtraction = () => {
      const targetFolder = currentFolder || folders.find(f => f.id === selectedFolderId && selectedFolderId !== 'none');
      setFolderHasExtraction(targetFolder?.extract_data || false);
    };

    checkFolderExtraction();
  }, [currentFolder, selectedFolderId, folders]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleCardDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsCardDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setIsOpen(true);
    }
  };

  const handleCardDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsCardDragging(true);
  };

  const handleCardDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsCardDragging(false);
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

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Select at least one file');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description);
      formData.append('tags', tags);

      // Add folder_id if selected
      const folderId = currentFolder ? currentFolder.id : (selectedFolderId !== 'none' ? selectedFolderId : '');
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
        ? `${files.length} file${files.length !== 1 ? 's' : ''} uploaded successfully. Files will be automatically processed with AI.`
        : `${files.length} file${files.length !== 1 ? 's' : ''} uploaded successfully.`;

      toast.success(successMessage);

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning: string) => {
          toast.warning(warning, {
            duration: 5000,
          });
        });
      }

      // Reset and close
      setFiles([]);
      setDescription('');
      setTags('');
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Error uploading documents');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${isCardDragging
          ? 'border-primary bg-primary/10 scale-105 shadow-lg'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        onClick={() => setIsOpen(true)}
        onDrop={handleCardDrop}
        onDragOver={handleCardDragOver}
        onDragLeave={handleCardDragLeave}
      >
        <Plus className={`mx-auto h-12 w-12 mb-4 transition-colors ${isCardDragging ? 'text-primary' : 'text-gray-400'
          }`} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isCardDragging ? 'Drop files here' : 'Upload Documents'}
        </h3>
        <p className="text-sm text-gray-500">
          {isCardDragging
            ? 'Drop to upload documents'
            : 'Click here or drag files to add new documents'
          }
        </p>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload New Documents</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400'
                }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''} selected` : 'Select files or drag here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supported formats: PDF, JPG, PNG, TIFF, BMP (max 10MB each)
                </p>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp"
                  onChange={handleFileChange}
                  className="pt-1 font-mono rounded-none"
                  inputDirectClassName="font-mono file:mr-4 file:font-semibold"
                />
              </div>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Selected files:</h4>
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
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}
            {/* <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!currentFolder && (
                <div>
                  <Label htmlFor="folder">Carpeta (opcional)</Label>
                  <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona carpeta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin carpeta</SelectItem>
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

            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descripción de los documentos..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="tags">Etiquetas (opcional)</Label>
              <Input
                id="tags"
                placeholder="tag1, tag2, tag3..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separa las etiquetas con comas
              </p>
            </div> */}

            {/* AI Processing Notice */}
            {folderHasExtraction && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">🤖</span>
                  <span className="text-sm text-blue-800 font-medium">
                    Automatic AI processing enabled
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Files in this folder will be automatically processed with OCR and AI to extract structured data.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || isLoading}
            >
              {isLoading ? 'Uploading...' : `📤 Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
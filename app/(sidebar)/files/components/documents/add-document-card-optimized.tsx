'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Upload, X, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { DOCUMENT_CATEGORIES } from '../../types';
import { uploadDocumentsAction } from '../../actions/document-actions';
import type { Folder } from '../../types';

interface AddDocumentCardProps {
  currentFolder: Folder | null;
  folders: Folder[];
  onOptimisticUpdate?: (files: OptimisticFile[]) => void;
}

interface OptimisticFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  realId?: string; // ID from database after successful upload
}

export function AddDocumentCardOptimized({ 
  currentFolder, 
  folders,
  onOptimisticUpdate 
}: AddDocumentCardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('otros');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(currentFolder?.id || 'none');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isCardDragging, setIsCardDragging] = useState(false);
  const [folderHasExtraction, setFolderHasExtraction] = useState(false);
  
  // Track upload progress for each file
  const [uploadingFiles, setUploadingFiles] = useState<OptimisticFile[]>([]);

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

  const updateFileProgress = (fileId: string, progress: number) => {
    setUploadingFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, progress, status: progress === 100 ? 'processing' : 'uploading' }
          : file
      )
    );
  };

  const markFileCompleted = (fileId: string, realId: string) => {
    setUploadingFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, status: 'completed', realId, progress: 100 }
          : file
      )
    );
  };

  const markFileFailed = (fileId: string, error: string) => {
    setUploadingFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, status: 'failed', error }
          : file
      )
    );
  };

  const handleUploadOptimistic = async () => {
    if (files.length === 0) {
      toast.error('Select at least one file');
      return;
    }

    // 1. Create optimistic entries immediately
    const optimisticFiles: OptimisticFile[] = files.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0
    }));

    setUploadingFiles(optimisticFiles);
    
    // Notify parent component to show optimistic entries immediately
    if (onOptimisticUpdate) {
      onOptimisticUpdate(optimisticFiles);
    }

    // Close dialog and show progress in the main UI
    setIsOpen(false);
    
    // Show optimistic success message
    toast.success(`Uploading ${files.length} file${files.length !== 1 ? 's' : ''}...`);

    // 2. Process uploads in parallel (non-blocking)
    const uploadPromises = files.map(async (file, index) => {
      const optimisticFile = optimisticFiles[index];
      const formData = new FormData();
      
      formData.append('file', file);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('tags', tags);
      formData.append('optimisticId', optimisticFile.id);

      // Add folder_id if selected
      const folderId = currentFolder ? currentFolder.id : (selectedFolderId !== 'none' ? selectedFolderId : '');
      if (folderId) {
        formData.append('folder_id', folderId);
      }

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => {
            const file = prev.find(f => f.id === optimisticFile.id);
            if (file && file.progress < 90) {
              return prev.map(f => 
                f.id === optimisticFile.id 
                  ? { ...f, progress: Math.min(f.progress + 10, 90) }
                  : f
              );
            }
            return prev;
          });
        }, 200);

        const result = await uploadDocumentsAction(formData);
        
        clearInterval(progressInterval);

        if (result.success && result.data?.files?.[0]) {
          markFileCompleted(optimisticFile.id, result.data.files[0].id);
          
          // Show processing notification if extraction is enabled
          if (folderHasExtraction) {
            toast.info(`🤖 Processing ${file.name} with AI...`, { duration: 3000 });
          }
        } else {
          const error = result.error || 'Upload failed';
          markFileFailed(optimisticFile.id, error);
          toast.error(`Failed to upload ${file.name}: ${error}`);
        }

        return result;
      } catch (error) {
        markFileFailed(optimisticFile.id, error instanceof Error ? error.message : 'Unknown error');
        toast.error(`Error uploading ${file.name}`);
        throw error;
      }
    });

    // 3. Don't wait for uploads - let them happen in background
    Promise.allSettled(uploadPromises).then(() => {
      // Clean up completed uploads after a delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.status === 'uploading' || f.status === 'processing'));
        
        // Refresh to show real data
        router.refresh();
      }, 3000);
    });

    // Reset form
    setFiles([]);
    setDescription('');
    setTags('');
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: OptimisticFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-orange-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: OptimisticFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
    }
  };

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer w-[335px] ${
          isCardDragging
            ? 'border-primary bg-primary/10 scale-105 shadow-lg'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onClick={() => setIsOpen(true)}
        onDrop={handleCardDrop}
        onDragOver={handleCardDragOver}
        onDragLeave={handleCardDragLeave}
      >
        <Plus className={`mx-auto h-12 w-12 mb-4 transition-colors ${
          isCardDragging ? 'text-primary' : 'text-gray-400'
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

      {/* Show upload progress cards */}
      {uploadingFiles.length > 0 && (
        <div className="fixed bottom-4 right-4 w-96 space-y-2 z-50">
          {uploadingFiles.map(file => (
            <div key={file.id} className="bg-white rounded-lg shadow-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(file.status)}
                  <span className="font-medium text-sm truncate max-w-[200px]">
                    {file.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {getStatusText(file.status)}
                </span>
              </div>
              {file.status === 'uploading' && (
                <Progress value={file.progress} className="h-2" />
              )}
              {file.error && (
                <p className="text-xs text-red-500 mt-1">{file.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload New Documents</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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
                    <div key={index} className="flex items-center justify-between p-2 rounded text-sm border bg-gray-50">
                      <div className="flex items-center gap-2 flex-1">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Folder Selection */}
            {!currentFolder && folders.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="folder">Folder (optional)</Label>
                <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No folder</SelectItem>
                    {folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full bg-${folder.color || 'gray'}-500`} />
                          {folder.name}
                          {folder.extract_data && (
                            <span className="text-xs text-blue-600 ml-1">[AI Extract]</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* AI Processing Notice */}
            {folderHasExtraction && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    <strong>AI Processing Enabled:</strong> Documents will be automatically processed to extract structured data.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={uploadingFiles.length > 0}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadOptimistic}
              disabled={files.length === 0 || uploadingFiles.length > 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload {files.length} file{files.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
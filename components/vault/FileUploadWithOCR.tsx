'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '../ui/button';
import { ALLOWED_MIME_TYPES } from '../../lib/schemas/document-schemas';
import { uploadDocumentAction } from '../../lib/actions/vault-actions';

interface FileUploadWithOCRProps {
  obraId: string;
  folder?: string;
  onUploadComplete?: () => void;
}

interface UploadFile extends File {
  preview?: string;
  ocrText?: string;
  description?: string;
}

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'progress';
  progress?: number;
  duration?: number;
}

const Toast: React.FC<ToastProps & { onClose: () => void }> = ({ 
  title, 
  description, 
  variant = 'default', 
  progress, 
  onClose 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'progress':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-800 text-white';
    }
  };

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 min-w-[300px] ${getVariantStyles()}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold">{title}</h4>
          {description && <p className="text-sm mt-1">{description}</p>}
          {progress !== undefined && (
            <div className="mt-2">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs mt-1">{Math.round(progress)}%</p>
            </div>
          )}
        </div>
        <button 
          onClick={onClose}
          className="ml-2 text-white/70 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const FileUploadWithOCR: React.FC<FileUploadWithOCRProps> = ({
  obraId,
  folder,
  onUploadComplete
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<ToastProps | null>(null);

  const showToast = (toastProps: ToastProps) => {
    setToast(toastProps);
    if (toastProps.duration && toastProps.duration > 0) {
      setTimeout(() => setToast(null), toastProps.duration);
    }
  };

  const processOCRForFile = useCallback(async (file: UploadFile): Promise<string> => {
    if (!file.type.startsWith('image/')) return '';

    try {
      const Tesseract = await import('tesseract.js');
      
      const { data } = await Tesseract.recognize(
        file,
        'spa+eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress for ${file.name}: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      return data.text.trim();
    } catch (error) {
      console.error('OCR Error for', file.name, error);
      return '';
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadFiles: UploadFile[] = acceptedFiles.map(file => {
      const uploadFile = file as UploadFile;
      if (file.type.startsWith('image/')) {
        uploadFile.preview = URL.createObjectURL(file);
      }
      return uploadFile;
    });

    setFiles(uploadFiles);

    // Process OCR for images
    showToast({
      title: 'Processing files...',
      description: 'Extracting text from images',
      variant: 'progress',
      progress: 0,
    });

    const processedFiles = await Promise.all(
      uploadFiles.map(async (file, index) => {
        if (file.type.startsWith('image/')) {
          const ocrText = await processOCRForFile(file);
          file.ocrText = ocrText;
          
          const progress = ((index + 1) / uploadFiles.length) * 100;
          showToast({
            title: 'Processing files...',
            description: `Processed ${index + 1} of ${uploadFiles.length} files`,
            variant: 'progress',
            progress,
          });
        }
        return file;
      })
    );

    setFiles(processedFiles);
    setToast(null);
  }, [processOCRForFile]);

  const updateFileDescription = (index: number, description: string) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, description } : file
    ));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      await Promise.all(
        files.map(async (file) => {
          const result = await uploadDocumentAction({
            obra_id: obraId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            folder: folder,
            ocr_content: file.ocrText || undefined,
            description: file.description || undefined,
          });

          if (!result?.data?.success) {
            throw new Error(`Failed to upload ${file.name}`);
          }
        })
      );

      showToast({
        title: 'Upload successful!',
        description: `${files.length} file(s) uploaded with OCR processing`,
        variant: 'success',
        duration: 3000,
      });

      setFiles([]);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      showToast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10000000, // 10MB
    accept: ALLOWED_MIME_TYPES.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
  });

  return (
    <>
      <div className="space-y-6">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="text-4xl mb-4">📁</div>
          <p className="text-lg font-medium mb-2">
            {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-gray-500">
            or click to select files • Images will be processed with OCR
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Files to Upload</h3>
            
            {files.map((file, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {file.preview && (
                    <img 
                      src={file.preview} 
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{file.name}</h4>
                    <p className="text-sm text-gray-500">
                      {file.type} • {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                {file.ocrText && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Extracted Text (OCR)</label>
                    <textarea
                      value={file.ocrText}
                      readOnly
                      className="w-full h-24 p-2 border rounded text-sm font-mono bg-gray-50"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <textarea
                    value={file.description || ''}
                    onChange={(e) => updateFileDescription(index, e.target.value)}
                    placeholder="Add a description for this file..."
                    className="w-full h-20 p-2 border rounded text-sm"
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <Button 
                onClick={uploadFiles}
                disabled={uploading}
                className="px-6"
              >
                {uploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
              </Button>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
};
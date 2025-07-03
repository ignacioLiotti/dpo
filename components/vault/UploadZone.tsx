'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../../supabase/client';
import { useVault } from '../../hooks/vault/useVault';
import { ALLOWED_MIME_TYPES } from '../../lib/schemas/document-schemas';
import { uploadDocumentAction } from '../../lib/actions/vault-actions';

interface UploadZoneProps {
  children: React.ReactNode;
  obraId: string;
  folder?: string;
  disabled?: boolean;
  onUploadComplete?: () => void;
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

export const UploadZone: React.FC<UploadZoneProps> = ({
  children,
  obraId,
  folder,
  disabled = false,
  onUploadComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [toast, setToast] = useState<ToastProps | null>(null);
  const uploadProgress = useRef<number[]>([]);
  const { fetchFiles } = useVault();

  const showToast = (toastProps: ToastProps) => {
    setToast(toastProps);
    if (toastProps.duration && toastProps.duration > 0) {
      setTimeout(() => setToast(null), toastProps.duration);
    }
  };

  const dismissToast = () => setToast(null);

  useEffect(() => {
    if (showProgress && toast?.variant !== 'progress') {
      showToast({
        title: `Uploading ${uploadProgress.current.length} files`,
        description: 'Please do not close browser until completed',
        variant: 'progress',
        progress,
      });
    } else if (toast?.variant === 'progress') {
      setToast(prev => prev ? { ...prev, progress } : null);
    }
  }, [showProgress, progress]);

  const onDrop = async (files: File[]) => {
    if (!files.length || disabled) return;

    uploadProgress.current = files.map(() => 0);
    setShowProgress(true);

    try {
      await Promise.all(
        files.map(async (file, idx) => {
          // First, use server action to create database record and get storage path
          const result = await uploadDocumentAction({
            obra_id: obraId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            folder: folder,
          });

          console.log('Upload action result:', result);

          // Check if the action succeeded
          if (!result || !result.data) {
            const errorMessage = result?.serverError || result?.validationErrors || 'Failed to create document record';
            console.error('Upload action failed:', result);
            throw new Error(`Server action failed: ${errorMessage}`);
          }

          const uploadResult = result.data;
          if (!uploadResult.success) {
            const errorMessage = uploadResult.error || 'Failed to create document record';
            console.error('Upload action failed:', uploadResult);
            throw new Error(`Server action failed: ${errorMessage}`);
          }

          if (!uploadResult.data || !uploadResult.data.storagePath) {
            console.error('Missing data in upload result:', uploadResult);
            throw new Error('Server action failed: Missing storage path in response');
          }

          const storagePath = uploadResult.data.storagePath;

          // Then upload to storage using the generated path
          const { error: uploadError } = await supabase.storage
            .from('obra-vault')
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw uploadError;
          }

          uploadProgress.current[idx] = 100;
          const totalProgress = uploadProgress.current.reduce(
            (acc, currentValue) => acc + currentValue,
            0,
          );
          setProgress(Math.round(totalProgress / files.length));
        }),
      );

      // Reset progress
      uploadProgress.current = [];
      setProgress(0);
      setShowProgress(false);
      dismissToast();

      showToast({
        title: 'Upload successful.',
        variant: 'success',
        duration: 2000,
      });

      // Refresh files and notify parent
      await fetchFiles(obraId, folder);
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      setShowProgress(false);
      dismissToast();

      showToast({
        title: 'Something went wrong please try again.',
        variant: 'error',
        duration: 2500,
      });
    }
  };

  const onDropRejected = (rejections: any[]) => {
    const rejection = rejections[0];

    if (rejection?.errors.find((e: any) => e.code === 'file-too-large')) {
      showToast({
        title: 'File size too large.',
        description: 'Maximum file size is 10MB.',
        variant: 'error',
        duration: 2500,
      });
    }

    if (rejection?.errors.find((e: any) => e.code === 'file-invalid-type')) {
      showToast({
        title: 'File type not supported.',
        description: 'Supported: PDF, Images (PNG, JPG, WebP, GIF), Office docs, Text files, ZIP archives',
        variant: 'error',
        duration: 4000,
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    maxSize: 10000000, // 10MB
    accept: ALLOWED_MIME_TYPES.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    disabled,
  });

  return (
    <>
      <div
        {...getRootProps({ onClick: (evt) => evt.stopPropagation() })}
        className="relative h-full"
      >
        {/* Hidden file input */}
        <input {...getInputProps()} id="upload-files" />

        {/* Drag overlay */}
        <div className="absolute inset-0 z-50 pointer-events-none">
          <div
            className={`
              bg-white dark:bg-gray-900 h-full flex items-center justify-center text-center 
              border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg
              transition-all duration-200
              ${isDragActive ? 'visible border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'invisible'}
            `}
          >
            <div className="p-8">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop your files here to upload
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Supported file types • Max 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Main content with upload prompt when empty */}
        <div className="overflow-y-auto h-full">
          {children}
        </div>
      </div>

      {toast && <Toast {...toast} onClose={dismissToast} />}
    </>
  );
};
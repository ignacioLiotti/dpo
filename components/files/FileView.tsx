'use client';

import React from 'react';
import type { UserFolder, UserFile } from '../../lib/actions/file-system-actions';

interface FileViewProps {
  folder: UserFolder;
  files: UserFile[];
  onFilesChange: () => void;
}

export const FileView: React.FC<FileViewProps> = ({
  folder,
  files,
  onFilesChange,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    return '📁';
  };

  return (
    <div>
      {/* Folder Info */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="text-3xl mr-4">📁</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {folder.name}
            </h2>
            {folder.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {folder.description}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {files.length} files • Created {new Date(folder.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-center">
          <div className="text-4xl mb-2">📤</div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            Upload Files
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Drag and drop files here or click to browse
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
            Choose Files
          </button>
        </div>
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No files yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload files to this folder to get started
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {files.map((file) => (
              <div key={file.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">{getFileIcon(file.type)}</div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                      </p>
                      {file.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {file.description}
                        </p>
                      )}
                      {file.category && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                          {file.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded-md border border-blue-600 hover:bg-blue-50"
                      title="Extract data"
                    >
                      Extract Data
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-700 px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                      title="View file"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
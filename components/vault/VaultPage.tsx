'use client';

import React, { useState, useEffect } from 'react';
import { UploadZone } from './UploadZone';
import { useVault } from '../../hooks/vault/useVault';
import { DOCUMENT_CATEGORIES } from '../../lib/schemas/document-schemas';
import { TabularDataViewer } from './TabularDataViewer';

interface VaultPageProps {
  obraId: string;
  initialFolder?: string;
  className?: string;
}

export const VaultPage: React.FC<VaultPageProps> = ({ 
  obraId,
  initialFolder,
  className = '' 
}) => {
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(initialFolder);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTabularData, setShowTabularData] = useState(false);
  
  const { files, loading, error, fetchFiles, deleteFile } = useVault();

  useEffect(() => {
    fetchFiles(obraId, currentFolder);
  }, [obraId, currentFolder, fetchFiles]);

  const filteredFiles = files.filter(file => {
    return !searchQuery || 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.ocr_content?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleUploadComplete = () => {
    fetchFiles(obraId, currentFolder);
  };

  const handleDelete = async (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile(fileId);
    }
  };

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
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Document Vault
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              {filteredFiles.length} files
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTabularData(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <span className="mr-2">📋</span>
                Table View
              </button>
              <label 
                htmlFor="upload-files"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md cursor-pointer transition-colors"
              >
                <span className="mr-2">📁</span>
                Add Files
              </label>
            </div>
          </div>
        </div>
        
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>


      {/* Main content area with upload zone */}
      <div className="flex-1 overflow-hidden">
        <UploadZone 
          obraId={obraId}
          folder={currentFolder}
          disabled={false}
          onUploadComplete={handleUploadComplete}
        >
          <div className="h-full p-6">
            {/* Stats */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">📄</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Files</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{files.length}</div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">📁</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Current Folder</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentFolder || 'Sin Clasificar'}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">💾</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Size</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}
                </div>
              </div>
            </div>

            {/* File list */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="text-lg">Loading...</div>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  Error: {error}
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="p-12 text-center">
                  {searchQuery ? (
                    <div className="text-gray-500">
                      <div className="text-4xl mb-4">🔍</div>
                      <p className="text-lg mb-2">No files match your search</p>
                      <p className="text-sm">Try adjusting your search terms</p>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <div className="text-6xl mb-6">📁</div>
                      <p className="text-xl mb-4">No files uploaded yet</p>
                      <p className="text-sm mb-6">
                        Drag and drop files here or click the "Add Files" button above to get started
                      </p>
                      <label 
                        htmlFor="upload-files"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors"
                      >
                        <span className="mr-2">➕</span>
                        Upload Your First File
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredFiles.map((file) => (
                    <div key={file.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{getFileIcon(file.type)}</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {file.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                            </div>
                            {file.description && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                📝 {file.description}
                              </div>
                            )}
                            {file.ocr_content && (
                              <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                🔍 OCR: {file.ocr_content.substring(0, 100)}{file.ocr_content.length > 100 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Delete file"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </UploadZone>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            Current folder: {currentFolder || 'Sin Clasificar'}
          </span>
          <div className="flex items-center gap-4">
            <span>
              📁 Supported: PDF, Images, Office docs, Text files, ZIP archives
            </span>
            <span>
              ⚡ Max size: 10MB per file
            </span>
          </div>
        </div>
      </div>

      {/* Tabular Data Viewer Dialog */}
      {showTabularData && (
        <TabularDataViewer
          obraId={obraId}
          folderName={currentFolder}
          isOpen={showTabularData}
          onClose={() => setShowTabularData(false)}
        />
      )}
    </div>
  );
};
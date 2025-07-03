'use client';

import React, { useState, useEffect } from 'react';
import { getFoldersAction, createFolderAction, getFilesAction } from '../../lib/actions/file-system-actions';
import { FolderView } from './FolderView';
import { FileView } from './FileView';
import { TableView } from './TableView';
import type { UserFolder, UserFile } from '../../lib/actions/file-system-actions';

export const FileManager: React.FC = () => {
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [files, setFiles] = useState<UserFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<UserFolder | null>(null);
  const [view, setView] = useState<'folders' | 'files' | 'table'>('folders');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      loadFiles(selectedFolder.id);
    }
  }, [selectedFolder]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const result = await getFoldersAction({});
      if (result?.data?.success) {
        setFolders(result.data.data);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (folderId: string) => {
    try {
      setLoading(true);
      const result = await getFilesAction({ folder_id: folderId });
      if (result?.data?.success) {
        setFiles(result.data.data);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (name: string, description?: string) => {
    try {
      const result = await createFolderAction({ name, description });
      if (result?.data?.success) {
        loadFolders();
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleFolderSelect = (folder: UserFolder) => {
    setSelectedFolder(folder);
    setView('files');
  };

  const handleBack = () => {
    if (view === 'table') {
      setView('files');
    } else {
      setSelectedFolder(null);
      setView('folders');
    }
  };

  console.log('folders', folders)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              {view !== 'folders' && (
                <button
                  onClick={handleBack}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {view === 'folders' ? 'File Manager' :
                  view === 'files' ? selectedFolder?.name || 'Files' :
                    'Table View'}
              </h1>
            </div>

            {view === 'files' && (
              <button
                onClick={() => setView('table')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                📊 Table View
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
          </div>
        ) : view === 'folders' ? (
          <FolderView
            folders={folders}
            onFolderSelect={handleFolderSelect}
            onCreateFolder={handleCreateFolder}
          />
        ) : view === 'files' ? (
          <FileView
            folder={selectedFolder!}
            files={files}
            onFilesChange={() => loadFiles(selectedFolder!.id)}
          />
        ) : (
          <TableView
            folder={selectedFolder!}
          />
        )}
      </div>
    </div>
  );
};
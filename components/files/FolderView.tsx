'use client';

import React, { useState } from 'react';
import type { UserFolder } from '../../lib/actions/file-system-actions';

interface FolderViewProps {
  folders: UserFolder[];
  onFolderSelect: (folder: UserFolder) => void;
  onCreateFolder: (name: string, description?: string) => void;
}

export const FolderView: React.FC<FolderViewProps> = ({
  folders,
  onFolderSelect,
  onCreateFolder,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), newFolderDescription.trim() || undefined);
      setNewFolderName('');
      setNewFolderDescription('');
      setShowCreateForm(false);
    }
  };

  return (
    <div>
      {/* Create Folder Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          + New Folder
        </button>
      </div>

      {/* Create Folder Form */}
      {showCreateForm && (
        <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Create New Folder
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter folder name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Folders Grid */}
      {folders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No folders yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create your first folder to organize your files
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => onFolderSelect(folder)}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md 
                       cursor-pointer transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center mb-3">
                <div className="text-3xl mr-3">📁</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                    {folder.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {folder.file_count || 0} files
                  </p>
                </div>
              </div>
              {folder.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {folder.description}
                </p>
              )}
              <div className="mt-3 text-xs text-gray-400">
                Created {new Date(folder.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
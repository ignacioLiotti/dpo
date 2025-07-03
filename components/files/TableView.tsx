'use client';

import React, { useState, useEffect } from 'react';
import { getTabularDataForFolderAction, exportTabularDataAction } from '../../lib/actions/file-system-actions';
import type { UserFolder } from '../../lib/actions/file-system-actions';

interface TableViewProps {
  folder: UserFolder;
}

interface TabularData {
  fields: Array<{
    field_name: string;
    field_label: string;
    field_type: string;
  }>;
  files: Array<{
    file_id: string;
    file_name: string;
    file_date: string;
    [field_name: string]: string | null;
  }>;
  totalFiles: number;
  totalFields: number;
}

export const TableView: React.FC<TableViewProps> = ({ folder }) => {
  const [data, setData] = useState<TabularData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('file_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadData();
  }, [folder.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getTabularDataForFolderAction({ folder_id: folder.id });
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportTabularDataAction({ folder_id: folder.id });
      
      if (result.success && result.csvContent) {
        const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', result.filename || 'folder-data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedFiles = () => {
    if (!data) return [];

    return [...data.files].sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return '⚪';
    return sortDirection === 'asc' ? '⬆️' : '⬇️';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading table data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
          Error Loading Data
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.totalFields === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Field Definitions
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Set up field definitions first to extract data from your files
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
          Set Up Fields
        </button>
      </div>
    );
  }

  if (data.totalFiles === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Files
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Upload files to this folder to see extracted data
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {folder.name} - Table View
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {data.totalFiles} files • {data.totalFields} fields
          </p>
        </div>
        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
        >
          📁 Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {/* File Name Column */}
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('file_name')}
                >
                  <div className="flex items-center gap-1">
                    File Name
                    <span>{renderSortIcon('file_name')}</span>
                  </div>
                </th>

                {/* Date Column */}
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('file_date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <span>{renderSortIcon('file_date')}</span>
                  </div>
                </th>

                {/* Field Columns */}
                {data.fields.map((field) => (
                  <th
                    key={field.field_name}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort(field.field_name)}
                  >
                    <div className="flex items-center gap-1">
                      <div>
                        <div>{field.field_label}</div>
                        <div className="text-xs text-gray-400 normal-case">
                          {field.field_type}
                        </div>
                      </div>
                      <span>{renderSortIcon(field.field_name)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {getSortedFiles().map((file) => (
                <tr key={file.file_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {/* File Name */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {file.file_name}
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {file.file_date}
                  </td>

                  {/* Field Values */}
                  {data.fields.map((field) => {
                    const value = file[field.field_name];
                    return (
                      <td
                        key={field.field_name}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                      >
                        {value !== null && value !== undefined ? (
                          <span>{value}</span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600 italic">
                            No data
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
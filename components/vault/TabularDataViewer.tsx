'use client';

import React, { useState, useEffect } from 'react';
import { getTabularDataAction, exportTabularDataToCSVAction } from '../../lib/actions/table-generation-actions';
import type { TabularData, TabularRow, TabularField } from '../../lib/actions/table-generation-actions';

interface TabularDataViewerProps {
  obraId: string;
  folderName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TabularDataViewer: React.FC<TabularDataViewerProps> = ({
  obraId,
  folderName,
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<TabularData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('document_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, obraId, folderName]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getTabularDataAction({
        obra_id: obraId,
        folder_name: folderName,
      });

      if (result?.success && result.data) {
        setData(result.data);
      } else {
        setError(result?.error || 'Failed to load data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const result = await exportTabularDataToCSVAction({
        obra_id: obraId,
        folder_name: folderName,
      });

      if (result.success && result.csvContent) {
        // Create and download the CSV file
        const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', result.filename || 'extracted-data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError(result.error || 'Failed to export CSV');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export CSV');
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

  const getSortedAndFilteredRows = (): TabularRow[] => {
    if (!data) return [];

    let filteredRows = data.rows;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredRows = data.rows.filter(row => {
        return (
          row.document_name.toLowerCase().includes(query) ||
          row.document_date.includes(query) ||
          data.fields.some(field => {
            const value = row[field.field_name];
            return value && value.toString().toLowerCase().includes(query);
          })
        );
      });
    }

    // Apply sorting
    return filteredRows.sort((a, b) => {
      let aValue: string | null;
      let bValue: string | null;

      if (sortField === 'document_name') {
        aValue = a.document_name;
        bValue = b.document_name;
      } else if (sortField === 'document_date') {
        aValue = a.document_date;
        bValue = b.document_date;
      } else {
        aValue = a[sortField] as string | null;
        bValue = b[sortField] as string | null;
      }

      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return '⚪';
    return sortDirection === 'asc' ? '⬆️' : '⬇️';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              📊 Tabular Data View
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {folderName ? `Folder: ${folderName}` : 'All Folders'} • 
              {data ? `${data.totalDocuments} documents, ${data.totalFields} fields` : 'Loading...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={!data || loading}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors"
            >
              <span className="mr-2">📁</span>
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2"
            >
              ✖️
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search documents or field values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-lg text-gray-600 dark:text-gray-400">
                <span className="mr-2">⏳</span>
                Loading tabular data...
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-4">❌</div>
                <div className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                  Error Loading Data
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {error}
                </div>
                <button
                  onClick={loadData}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : !data || data.rows.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">📭</div>
                <div className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  No Data Available
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  {data?.totalFields === 0 
                    ? 'No field definitions found for this folder'
                    : 'No documents with extracted data found'
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-auto h-full">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    {/* Document Name Column */}
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('document_name')}
                    >
                      <div className="flex items-center gap-1">
                        Document Name
                        <span className="text-sm">{renderSortIcon('document_name')}</span>
                      </div>
                    </th>

                    {/* Date Column */}
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('document_date')}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        <span className="text-sm">{renderSortIcon('document_date')}</span>
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
                          <span className="text-sm">{renderSortIcon(field.field_name)}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {getSortedAndFilteredRows().map((row) => (
                    <tr
                      key={row.document_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {/* Document Name */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {row.document_name}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {row.document_date}
                      </td>

                      {/* Field Values */}
                      {data.fields.map((field) => {
                        const value = row[field.field_name];
                        return (
                          <td
                            key={field.field_name}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                          >
                            {value !== null ? (
                              <span className="break-all">
                                {value}
                              </span>
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
          )}
        </div>

        {/* Footer */}
        {data && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div>
                Showing {getSortedAndFilteredRows().length} of {data.totalDocuments} documents
                {searchQuery && (
                  <span className="ml-2">
                    (filtered by: "{searchQuery}")
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span>📊 {data.totalFields} fields defined</span>
                <span>📄 {data.totalDocuments} total documents</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
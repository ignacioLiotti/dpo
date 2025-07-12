'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentTable } from './document-table';
import { FolderGrid } from './folder-grid';
import { DocumentGrid } from './document-grid';
import { DocumentTreeView } from './document-tree-view';
import { ViewToggle } from './view-toggle';
import { ExtractedDataView } from './extracted-data-view';
import { Search, Filter, ArrowLeft, FileText, FolderOpen, Home, ChevronRight, Bot } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DOCUMENT_CATEGORIES } from '../types';
import type { ObraDocument, Folder } from '../types';
import FolderFront from '@/components/ui/FolderFront';
import { cn } from '@/utils/utils';

interface ObraFilesClientWrapperProps {
  searchParams: {
    search?: string;
    category?: string;
    folder?: string;
  };
  documents: ObraDocument[];
  folders: Folder[];
  currentFolder: Folder | null;
  folderCounts: Record<string, number>;
  extractedData?: any[];
}

export function ObraFilesClientWrapper({
  searchParams,
  documents,
  folders,
  currentFolder,
  folderCounts,
  extractedData = []
}: ObraFilesClientWrapperProps) {
  const [view, setView] = useState<'cards' | 'table' | 'extracted'>('cards');
  const [folderFieldCount, setFolderFieldCount] = useState(0);

  const baseUrl = '/obra-files';

  // Build query params helper
  const buildQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    Object.entries({ ...searchParams, ...updates }).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      }
    });
    return params.toString();
  };

  // Check if current folder has extraction enabled
  const showExtractedDataView = currentFolder?.extract_data || false;

  // Fetch field count when folder changes
  useEffect(() => {
    if (currentFolder?.extract_data) {
      fetchFieldCount();
    } else {
      setFolderFieldCount(0);
    }
  }, [currentFolder]);

  const fetchFieldCount = async () => {
    if (!currentFolder) return;

    try {
      // Use our action instead of API endpoint
      const { getFolderFieldDefinitions } = await import('../actions/folder-extraction-actions');
      const result = await getFolderFieldDefinitions(currentFolder.id);
      setFolderFieldCount(result.fields?.length || 0);
    } catch (error) {
      console.error('Error fetching field count:', error);
      setFolderFieldCount(0);
    }
  };

  return (
    <div className="flex h-full bg-white/50 w-full">
      {/* Left Sidebar - Navigation Panel */}
      <div className="w-1/5 min-w-[320px] border-r bg-gradient-to-b from-muted/20 to-muted/40 backdrop-blur-sm">
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          {/* Header Section with Breadcrumb */}
          <div className="space-y-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href={baseUrl} className="hover:text-foreground transition-colors">
                <div className="flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  <span>Root</span>
                </div>
              </Link>
              {currentFolder && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <div className="flex items-center gap-1 text-foreground">
                    <FolderOpen className="w-4 h-4" />
                    <span className="font-medium">{currentFolder.name}</span>
                    {currentFolder.extract_data && (
                      <Bot className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Back Button */}
            <AnimatePresence mode="wait">
              {currentFolder && (
                <div>
                  <Link href={`${baseUrl}?${buildQuery({ folder: undefined })}`}>
                    <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/60">
                      <ArrowLeft className="w-4 h-4" />
                      Back to Root
                    </Button>
                  </Link>
                </div>
              )}
            </AnimatePresence>

            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-primary/10", currentFolder && "py-3")}>
                {currentFolder ? (
                  <div className="group cursor-pointer hover:bg-muted transition-colors">
                    <div className="flex flex-col items-start gap-2 p-3 w-[35px] h-[15px] rounded-lg hover:bg-muted transition-colors bg-gradient-to-b from-[#4F4F4F] to-[#3D3D3D] relative">
                      {currentFolder.extract_data && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center z-20">
                          <Bot className="w-2 h-2 text-white" />
                        </div>
                      )}
                      <FolderFront className="w-[45px] h-[25px] absolute -bottom-1 -left-1 transform origin-[50%_100%] group-hover:[transform:perspective(800px)_rotateX(-30deg)] transition-transform duration-300" />
                    </div>
                  </div>
                ) : (
                  <FileText className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {currentFolder ? currentFolder.name : 'Files'}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Organization Files
                  </p>
                  {currentFolder?.extract_data && (
                    <Badge variant="secondary" className="text-xs">
                      <Bot className="w-3 h-3 mr-1" />
                      AI Enabled
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={currentFolder ? `Search in ${currentFolder.name}...` : "Search files..."}
                  defaultValue={searchParams.search || ''}
                  className="pl-10 bg-background/50 border-muted-foreground/20"
                  name="search"
                  form="search-form"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Folder Field Setup / Extraction Preview / Debug Panel */}
          {currentFolder && (
            <>

            </>
          )}

          {/* Document Tree View */}
          <div>
            <DocumentTreeView
              folders={folders}
              documents={documents}
              currentFolder={currentFolder}
              searchParams={searchParams}
            />
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="p-6 h-full overflow-y-auto space-y-6">
          {/* Content Header with View Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {view === 'extracted' ? 'Extracted Data' :
                  currentFolder ? `Contents of ${currentFolder.name}` : 'Organization Files'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {view === 'extracted' ?
                  `Structured data extracted from ${documents.filter(d => d.extracted_data).length} files` :
                  `${documents.length} file${documents.length !== 1 ? 's' : ''} and ${folders.length} folder${folders.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>

            {/* View Toggle - Moved to right side */}
            <ViewToggle
              view={view}
              onViewChange={setView}
              showExtractedData={showExtractedDataView}
            />
          </div>

          {/* Content Display */}
          <AnimatePresence mode="wait">
            {view === 'extracted' ? (
              <motion.div
                key="extracted"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ExtractedDataView documents={documents} currentFolder={currentFolder} extractedData={extractedData} />
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Folders Section - Only show when not in extracted view and not in a folder */}
                {!currentFolder && (
                  <AnimatePresence mode="wait">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-medium">Folders</h4>
                        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          {folders.length} folder{folders.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-6">
                        <FolderGrid
                          folders={folders}
                          folderCounts={folderCounts}
                        />
                      </div>
                    </div>
                  </AnimatePresence>
                )}

                {/* Documents Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-medium">
                      {currentFolder ? 'Files' : 'Recent Files'}
                    </h4>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {documents.length} file{documents.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Documents Display */}
                  <AnimatePresence mode="wait">
                    {view === 'table' ? (
                      <motion.div
                        key="table"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <DocumentTable documents={documents} folders={folders} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="cards"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-wrap gap-4"
                      >
                        <DocumentGrid
                          documents={documents}
                          currentFolder={currentFolder}
                          folders={folders}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Empty State */}
                  <AnimatePresence>
                    {documents.length === 0 && (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-4 opacity-50">
                          {currentFolder ? '📁' : '📄'}
                        </div>
                        <h3 className="text-lg font-medium mb-2">
                          {currentFolder ? 'Empty folder' : 'No files'}
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          {currentFolder
                            ? 'This folder doesn\'t contain any files yet. You can upload files using the add documents button.'
                            : 'Files will appear here when uploaded. Start by creating a folder or uploading a file.'
                          }
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
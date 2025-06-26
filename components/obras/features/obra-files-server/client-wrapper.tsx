'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentTable } from './components/document-table';
import { FolderGrid } from './components/folder-grid';
import { DocumentGrid } from './components/document-grid';
import { DocumentTreeView } from './components/document-tree-view';
import { ViewToggle } from './components/view-toggle';
import { Search, Filter, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DOCUMENT_CATEGORIES } from '@/lib/schemas/document-schemas';
import type { ObraDocument, Folder } from '@/lib/schemas/document-schemas';

interface ObraFilesClientWrapperProps {
  obraId: string;
  obraName?: string;
  searchParams: {
    search?: string;
    category?: string;
    folder?: string;
  };
  documents: ObraDocument[];
  folders: Folder[];
  currentFolder: Folder | null;
  folderCounts: Record<string, number>;
}

export function ObraFilesClientWrapper({
  obraId,
  obraName,
  searchParams,
  documents,
  folders,
  currentFolder,
  folderCounts
}: ObraFilesClientWrapperProps) {
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const baseUrl = `/obras/${obraId}`;

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

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Navigation Panel */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-1/5 min-w-[320px] border-r bg-gradient-to-b from-muted/20 to-muted/40 backdrop-blur-sm"
      >
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          {/* Header Section */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {currentFolder && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href={`${baseUrl}?${buildQuery({ folder: undefined })}`}>
                    <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/60">
                      <ArrowLeft className="w-4 h-4" />
                      Volver a la raíz
                    </Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-semibold"
                >
                  {currentFolder ? currentFolder.name : 'Documentos'}
                </motion.h2>
                <p className="text-sm text-muted-foreground">
                  {obraName || `Obra ${obraId}`}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* View Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Vista</label>
              <ViewToggle view={view} onViewChange={setView} />
            </div>
          </motion.div>

          <Separator />

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={currentFolder ? `Buscar en ${currentFolder.name}...` : "Buscar documentos..."}
                  defaultValue={searchParams.search || ''}
                  className="pl-10 bg-background/50 border-muted-foreground/20"
                  name="search"
                  form="search-form"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Categoría</label>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  name="category"
                  defaultValue={searchParams.category || 'all'}
                  className="flex-1 px-3 py-2 border border-input/50 bg-background/50 text-sm rounded-md"
                  form="search-form"
                >
                  <option value="">Todas las categorías</option>
                  {DOCUMENT_CATEGORIES.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Form */}
            <form
              id="search-form"
              method="GET"
              action={currentFolder ? `${baseUrl}?folder=${currentFolder.id}` : baseUrl}
              className="hidden"
            >
              <Button type="submit" size="sm">Buscar</Button>
            </form>

            {/* Active Filters */}
            <AnimatePresence>
              {(searchParams.search || searchParams.category) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-2 border-t border-muted"
                >
                  <span className="text-sm font-medium text-muted-foreground">Filtros activos:</span>
                  <div className="space-y-1">
                    {searchParams.search && (
                      <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                        Buscar: "{searchParams.search}"
                      </span>
                    )}
                    {searchParams.category && (
                      <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                        {DOCUMENT_CATEGORIES.find(c => c.id === searchParams.category)?.name || 'Categoría'}
                      </span>
                    )}
                    <Link
                      href={currentFolder ? `${baseUrl}?folder=${currentFolder.id}` : baseUrl}
                      className="block text-primary hover:underline text-xs mt-1"
                    >
                      Limpiar filtros
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <Separator />

          {/* Document Tree View */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <DocumentTreeView
              folders={folders}
              documents={documents}
              currentFolder={currentFolder}
              obraId={obraId}
              searchParams={searchParams}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Right Content Area */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex-1 overflow-hidden"
      >
        <div className="p-6 h-full overflow-y-auto space-y-6">
          {/* Folders Section */}
          <AnimatePresence mode="wait">
            {!currentFolder && folders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Carpetas
                  </h3>
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    {folders.length} carpeta{folders.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <motion.div
                  className="flex flex-wrap gap-6"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                >
                  <FolderGrid
                    folders={folders}
                    folderCounts={folderCounts}
                    obraId={obraId}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Documents Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {currentFolder ? `Documentos en ${currentFolder.name}` : 'Documentos'}
              </h3>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                {documents.length} documento{documents.length !== 1 ? 's' : ''}
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
                    obraId={obraId}
                    currentFolder={currentFolder}
                    folders={folders}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            <AnimatePresence>
              {documents.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-4 opacity-50">
                    {currentFolder ? '📁' : '📄'}
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {currentFolder ? 'Carpeta vacía' : 'No hay documentos'}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {currentFolder
                      ? 'Esta carpeta no contiene documentos todavía. Puedes subir archivos usando el botón de arriba.'
                      : 'Los documentos aparecerán aquí cuando se suban. Comienza creando una carpeta o subiendo un archivo.'
                    }
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 
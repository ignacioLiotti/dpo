import React from 'react';
import { Search, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ViewToggle } from './view-toggle';
import { DOCUMENT_CATEGORIES } from '../types';
import type { Folder } from '../types';

interface SearchAndFiltersProps {
  currentFolder: Folder | null;
  searchParams: {
    search?: string;
    category?: string;
    folder?: string;
  };
  obraId: string;
  view: 'cards' | 'table';
  onViewChange: (view: 'cards' | 'table') => void;
}

export function SearchAndFilters({
  currentFolder,
  searchParams,
  obraId,
  view,
  onViewChange
}: SearchAndFiltersProps) {
  const baseUrl = `/obras/${obraId}`;

  // Build query params helper
  const buildQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();

    // Keep existing params and apply updates
    Object.entries({ ...searchParams, ...updates }).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      }
    });

    return params.toString();
  };

  return (
    <div className="space-y-4">
      {/* Navigation and Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {currentFolder && (
            <Link href={`${baseUrl}?${buildQuery({ folder: undefined })}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-2">
            {currentFolder ? (
              <>
                <span className="text-lg">📁</span>
                <h2 className="text-xl font-semibold">{currentFolder.name}</h2>
              </>
            ) : (
              <h2 className="text-xl font-semibold">Documentos</h2>
            )}
          </div>
        </div>

        {/* View Toggle - only show when not in folder view or when there are documents */}
        <ViewToggle view={view} onViewChange={onViewChange} />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={currentFolder ? `Buscar en ${currentFolder.name}...` : "Buscar documentos..."}
            defaultValue={searchParams.search || ''}
            className="pl-10"
            // Using form to enable search functionality
            name="search"
            form="search-form"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            name="category"
            defaultValue={searchParams.category || 'all'}
            className="px-3 py-2 border border-input bg-background text-sm rounded-md"
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

        {/* Search Form - Hidden but enables search functionality */}
        <form
          id="search-form"
          method="GET"
          action={currentFolder ? `${baseUrl}?folder=${currentFolder.id}` : baseUrl}
          className="hidden"
        >
          <Button type="submit" size="sm">
            Buscar
          </Button>
        </form>
      </div>

      {/* Active Filters Display */}
      {(searchParams.search || searchParams.category) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filtros activos:</span>
          {searchParams.search && (
            <span className="bg-muted px-2 py-1 rounded text-xs">
              Buscar: "{searchParams.search}"
            </span>
          )}
          {searchParams.category && (
            <span className="bg-muted px-2 py-1 rounded text-xs">
              {DOCUMENT_CATEGORIES.find(c => c.id === searchParams.category)?.name || 'Categoría'}
            </span>
          )}
          <Link
            href={currentFolder ? `${baseUrl}?folder=${currentFolder.id}` : baseUrl}
            className="text-primary hover:underline text-xs"
          >
            Limpiar filtros
          </Link>
        </div>
      )}
    </div>
  );
} 
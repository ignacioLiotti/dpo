'use client';

import React, { useState } from 'react';
import type { Obra } from '@/types/obra';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ObrasDataTable } from '@/components/obras/obras-data-table';
import { CreateObraSheet } from './create-obra-sheet'; // We'll create this next

interface ObrasPageClientProps {
  initialObras: Obra[];
  // We could pass other necessary data like options for selects here later
}

export function ObrasPageClient({ initialObras }: ObrasPageClientProps) {
  // TODO: Implement optimistic updates or state management if needed for the table data
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  const handleOpenCreateSheet = () => setIsCreateSheetOpen(true);
  const handleCloseCreateSheet = () => setIsCreateSheetOpen(false);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Obras</h1>
        <Button onClick={handleOpenCreateSheet}>
          <PlusCircle className="mr-2 h-4 w-4" /> Crear Obra
        </Button>
      </div>

      <ObrasDataTable data={initialObras} />

      <CreateObraSheet
        isOpen={isCreateSheetOpen}
        onClose={handleCloseCreateSheet}
      // We might need a callback here later to refresh data or update optimistically
      // onObraCreated={handleObraCreated}
      />
    </div>
  );
} 
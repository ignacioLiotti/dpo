'use client';

import { VaultPage } from '@/components/vault';
import { useState } from 'react';

interface Obra {
  id: string;
  obra_name: string;
  user_id: string;
  [key: string]: any;
}

interface VaultDemoClientProps {
  obras: Obra[];
  userId: string;
}

export function VaultDemoClient({ obras, userId }: VaultDemoClientProps) {
  const [selectedObraId, setSelectedObraId] = useState<string>(
    obras.length > 0 ? obras[0].id : ''
  );

  if (obras.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-lg mb-2">No obras found</div>
          <div className="text-sm text-gray-500">
            Create an obra first to use the vault functionality
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Obra selector */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <label htmlFor="obra-select" className="text-sm font-medium">
            Select Obra:
          </label>
          <select
            id="obra-select"
            value={selectedObraId}
            onChange={(e) => setSelectedObraId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            {obras.map((obra) => (
              <option key={obra.id} value={obra.id}>
                {obra.obra_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vault */}
      <div className="flex-1 overflow-hidden">
        {selectedObraId && (
          <VaultPage
            obraId={selectedObraId}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
} 
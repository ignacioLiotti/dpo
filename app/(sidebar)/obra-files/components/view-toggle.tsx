'use client';

import React from 'react';
import { Grid3X3, List, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

interface ViewToggleProps {
  view: 'cards' | 'table' | 'extracted';
  onViewChange: (view: 'cards' | 'table' | 'extracted') => void;
  showExtractedData?: boolean;
}

export function ViewToggle({ view, onViewChange, showExtractedData = false }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant={view === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('cards')}
        className="h-8 px-3"
      >
        <Grid3X3 className="w-4 h-4 mr-1" />
        Cards
      </Button>
      <Button
        variant={view === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className="h-8 px-3"
      >
        <List className="w-4 h-4 mr-1" />
        Table
      </Button>
      {showExtractedData && (
        <Button
          variant={view === 'extracted' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('extracted')}
          className="h-8 px-3"
        >
          <Database className="w-4 h-4 mr-1" />
          Data
        </Button>
      )}
    </div>
  );
}
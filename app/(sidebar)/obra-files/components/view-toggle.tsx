'use client';

import React from 'react';
import { Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

interface ViewToggleProps {
  view: 'cards' | 'table';
  onViewChange: (view: 'cards' | 'table') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant={view === 'cards' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('cards')}
        className={cn(
          "h-8 px-3",
        )}
      >
        <Grid3X3 className="w-4 h-4 mr-1" />
        Cards
      </Button>
      <Button
        variant={view === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className={cn(
          "h-8 px-3",
        )}
      >
        <List className="w-4 h-4 mr-1" />
        Table
      </Button>
    </div>
  );
} 
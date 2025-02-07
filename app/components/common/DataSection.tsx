import React from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTable } from './DataTable';
import { BaseSectionProps } from '@/lib/types/common';

interface DataSectionProps<T> extends BaseSectionProps {
  items: T[];
  columns: Array<{
    header: string;
    key: keyof T;
    editable?: boolean;
    width?: string;
    render?: (value: any, item: T) => React.ReactNode;
  }>;
  onUpdate?: (id: string | number, key: keyof T, value: string) => void;
  onDelete?: (id: string | number) => void;
  getRowId: (item: T) => string | number;
  showActions?: boolean;
  footer?: React.ReactNode;
}

export function DataSection<T>({
  tag,
  tagIndex,
  items,
  columns,
  onUpdate,
  onDelete,
  getRowId,
  showActions = false,
  highlightChanges = false,
  footer,
}: DataSectionProps<T>) {
  const ref = React.useRef(null);

  // Animation variants
  const containerVariants = {
    hidden: { scale: 1.1, opacity: 0 },
    visible: { scale: 1, opacity: 1 }
  };

  const borderVariants = {
    hidden: { borderColor: 'rgba(59, 130, 246, 0.75)' },
    visible: { borderColor: 'rgba(59, 130, 246, 0)' }
  };

  return (
    <motion.div
      ref={ref}
      id={`section-${tag}`}
      initial="visible"
      animate="visible"
      variants={containerVariants}
      transition={{ duration: 1 }}
      className="relative scroll-mt-10"
    >
      <motion.div
        initial="visible"
        animate="visible"
        variants={borderVariants}
        transition={{ duration: 1.5, delay: 0.2 }}
        className={cn(
          "border-2 rounded-lg",
          (!Array.isArray(items) || items.length === 0) && "border-dashed border-muted-foreground/50 bg-muted/50"
        )}
      >
        {/* Section Header */}
        <h3 className={cn(
          "text-[14px] font-bold bg-input/20 rounded-lg p-2 pl-4 flex items-center justify-between gap-2",
          (!Array.isArray(items) || items.length === 0) && "text-muted-foreground"
        )}>
          <span className="flex items-center gap-2">
            <Package size={16} strokeWidth={2} aria-hidden="true" />
            {tagIndex + 1}. {tag.toUpperCase()}
          </span>
        </h3>

        {/* Empty state */}
        {(!Array.isArray(items) || items.length === 0) && (
          <div className="h-24 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Package className="h-8 w-8 opacity-50" />
            <span className="text-sm">No hay elementos en esta sección</span>
          </div>
        )}

        {/* Data table */}
        {Array.isArray(items) && items.length > 0 && (
          <DataTable
            data={items}
            columns={columns}
            onUpdate={onUpdate}
            onDelete={onDelete}
            getRowId={getRowId}
            showActions={showActions}
            highlightChanges={highlightChanges}
          />
        )}

        {/* Optional footer */}
        {footer}
      </motion.div>
    </motion.div>
  );
} 
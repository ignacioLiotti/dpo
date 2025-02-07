import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditableInput } from './EditableInput';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  header: string;
  key: keyof T;
  editable?: boolean;
  width?: string;
  render?: (value: any, item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onUpdate?: (id: string | number, key: keyof T, value: string) => void;
  onDelete?: (id: string | number) => void;
  getRowId: (item: T) => string | number;
  showActions?: boolean;
  highlightChanges?: boolean;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  onUpdate,
  onDelete,
  getRowId,
  showActions = false,
  highlightChanges = false,
  className,
}: DataTableProps<T>) {
  return (
    <Table className={cn("bg-white", className)}>
      <TableHeader>
        <TableRow className="bg-white">
          {columns.map((column) => (
            <TableHead
              key={String(column.key)}
              className={cn("bg-white", column.width)}
            >
              {column.header}
            </TableHead>
          ))}
          {showActions && (
            <TableHead className="bg-white w-[100px] text-center">
              Acciones
            </TableHead>
          )}
        </TableRow>
      </TableHeader>

      <TableBody>
        {data.map((item) => (
          <TableRow key={getRowId(item)}>
            {columns.map((column) => (
              <TableCell
                key={`${getRowId(item)}-${String(column.key)}`}
                className="border-r"
              >
                {column.editable && onUpdate ? (
                  <EditableInput
                    value={item[column.key]}
                    onChange={(value) => onUpdate(getRowId(item), column.key, value)}
                    highlightChanges={highlightChanges}
                  />
                ) : column.render ? (
                  column.render(item[column.key], item)
                ) : (
                  String(item[column.key] || '')
                )}
              </TableCell>
            ))}
            {showActions && onDelete && (
              <TableCell className="text-center border-r border-l">
                <Button
                  variant="destructive"
                  className="flex items-center gap-1 h-6 w-7 p-0 mx-auto"
                  onClick={() => onDelete(getRowId(item))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 
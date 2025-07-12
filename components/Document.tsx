'use client'

import React from 'react'
import { useForm, useStore, type FieldApi } from '@tanstack/react-form'
// FormInstance type is usually inferred or derived from useForm return type
import type { FieldComponent } from '@tanstack/react-form'
import { Button } from './ui/button'
import { TableCell, TableBody, TableHead, Table, TableHeader, TableRow } from './ui/table'
import { Input } from './ui/input'
import { motion } from 'framer-motion'
import { Textarea } from './ui/textarea'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type Column,
  type Table as TanStackTableType,
  type TableState
} from '@tanstack/react-table'
// --- Type Definitions ---

export type SectionConfig =
  | {
    id: string
    type: 'header'
    titleKey: string
    subtitleKey?: string
    descriptionKey?: string
  }
  | {
    id: string
    type: 'text'
    fieldKey: string
    label?: string
  }
  | {
    id: string
    type: 'columns'
    columns: 1 | 2
    fields: Array<{ fieldKey: string; label?: string }>
  }
  | {
    id: string
    type: 'table'
    columns: string[]
    rowsKey: string
  }
  | {
    id: string
    type: 'complexTable'
    columns: string[]
    rowsKey: string
  }

export type DocumentData = Record<string, any>

export interface DocumentProps {
  config: SectionConfig[]
  initialData: DocumentData
  onSubmit: (data: DocumentData) => void | Promise<void>
  className?: string
}

// --- Main Document Component ---

export function Document({
  config,
  initialData,
  onSubmit,
  className,
}: DocumentProps) {
  const form = useForm({
    defaultValues: initialData,
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className={`space-y-12 ${className ?? ''}`.trim()}
    >
      {config.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          form={form}
        />
      ))}

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <div className="flex justify-end mt-8">
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Document'}
            </Button>
          </div>
        )}
      />
    </form>
  )
}

// --- Section Renderer Logic ---

interface SectionRendererProps {
  section: SectionConfig
  form: any // Use 'any' temporarily to bypass complex useForm type issues
}

// Define props for the generic field rendering helper
interface FieldHelperProps<T = any> {
  // Use a basic FieldApi type, acknowledging the complexity
  field: FieldApi<any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any>;
  component: React.ElementType;
  label?: string;
  placeholder?: string;
  [key: string]: any; // Allow other props like rows, className etc.
}

const SectionRenderer = React.memo(
  ({ section, form }: SectionRendererProps) => {
    // Revert to fieldComponent pattern
    const fieldComponent = React.useCallback(
      <T,>({ field, component: Comp, label, placeholder, ...props }: FieldHelperProps<T>) => (
        <div className="space-y-1 w-full">
          {label && <label htmlFor={field.name} className="text-sm font-medium">{label}</label>}
          <Comp
            id={field.name}
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              field.handleChange(e.target.value)
            }
            placeholder={placeholder}
            className={`${props.className ?? ''} ${field.state.meta.errors.length ? 'border-red-500' : ''}`.trim()}
            {...props}
          />
          {field.state.meta.errors.length > 0 && (
            <em className="text-red-500 text-sm">
              {field.state.meta.errors.join(', ')}
            </em>
          )}
        </div>
      ),
      []
    );

    switch (section.type) {
      case 'header':
        return (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 border-b pb-6 mb-6"
          >
            <form.Field
              name={section.titleKey}
              children={(field: any) =>
                fieldComponent({
                  field,
                  component: Input,
                  label: 'Title',
                  placeholder: 'Enter title…',
                  className: 'text-2xl font-bold',
                })
              }
            />
            {section.subtitleKey && (
              <form.Field
                name={section.subtitleKey}
                children={(field: any) =>
                  fieldComponent({
                    field,
                    component: Input,
                    label: 'Subtitle',
                    placeholder: 'Enter subtitle…',
                    className: 'text-lg text-muted-foreground',
                  })
                }
              />
            )}
            {section.descriptionKey && (
              <form.Field
                name={section.descriptionKey}
                children={(field: any) =>
                  fieldComponent({
                    field,
                    component: Textarea,
                    label: 'Description',
                    placeholder: 'Enter description…',
                    rows: 3,
                  })
                }
              />
            )}
          </motion.div>
        )

      case 'text':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <form.Field
              name={section.fieldKey}
              children={(field: any) =>
                fieldComponent({
                  field,
                  component: Textarea,
                  label: section.label ?? 'Text',
                  placeholder: `Enter ${section.label?.toLowerCase() ?? 'text'}...`,
                  rows: 5,
                })
              }
            />
          </motion.div>
        )

      case 'columns':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={`grid grid-cols-1 ${section.columns === 2 ? 'md:grid-cols-2' : ''
              } gap-6`}
          >
            {section.fields.map((f) => (
              <form.Field
                key={f.fieldKey}
                name={f.fieldKey}
                children={(field: any) =>
                  fieldComponent({
                    field,
                    component: Input,
                    label: f.label,
                    placeholder: `Enter ${f.label?.toLowerCase() ?? f.fieldKey}...`,
                  })
                }
              />
            ))}
          </motion.div>
        )

      case 'table': { // TanStack Table integration
        const rowsKey = section.rowsKey;
        const rows = useStore(form.store, (state: any) => // Use any for state type temporarily
          (state?.values?.[rowsKey] as Record<string, any>[] | undefined) ?? []
        );

        const columns = React.useMemo<ColumnDef<Record<string, any>>[]>(() =>
          section.columns.map((colKey) => ({
            id: colKey,
            header: colKey.charAt(0).toUpperCase() + colKey.slice(1),
            accessorKey: colKey,
            cell: ({ row, column }: { row: Row<Record<string, any>>, column: Column<Record<string, any>> }) => {
              const fieldName = `${rowsKey}[${row.index}].${column.id}`;
              return (
                <form.Field name={fieldName} children={(field: any) => (
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={column.id}
                    className={field.state.meta.errors.length ? 'border-red-500' : ''}
                  />
                )} />
              );
            },
          })),
          [section.columns, rowsKey]
        );

        const table: TanStackTableType<Record<string, any>> = useReactTable({
          data: rows,
          columns,
          getCoreRowModel: getCoreRowModel(),
        });

        if (!table) {
          return null;
        }


        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="overflow-x-auto border rounded-md"
          >
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel()?.rows?.length ? (
                  table.getRowModel()?.rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No rows found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </motion.div>
        );
      }

      case 'complexTable': {
        const rowsKey = section.rowsKey;

        const RowComponent = React.memo(({ index, field, removeValue }: {
          index: number;
          field: any;
          removeValue: (index: number) => void;
        }) => (
          <TableRow key={index}>
            {section.columns.map((colKey) => (
              <TableCell key={colKey}>
                <form.Field name={`${rowsKey}[${index}].${colKey}`}>
                  {(subField: any) => (
                    <Input
                      id={subField.name}
                      name={subField.name}
                      value={subField.state.value}
                      onBlur={subField.handleBlur}
                      onChange={(e) => subField.handleChange(e.target.value)}
                      placeholder={colKey.charAt(0).toUpperCase() + colKey.slice(1)}
                      className={subField.state.meta.errors.length ? 'border-red-500' : ''}
                    />
                  )}
                </form.Field>
              </TableCell>
            ))}
            <TableCell className="text-right">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeValue(index)}
              >
                Remove
              </Button>
            </TableCell>
          </TableRow>
        ));

        RowComponent.displayName = 'ComplexTableRow';

        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <form.Field name={rowsKey} mode="array">
              {(field: any) => (
                <>
                  <div className="overflow-x-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {section.columns.map((colKey) => (
                            <TableHead key={colKey} className="whitespace-nowrap">{colKey.charAt(0).toUpperCase() + colKey.slice(1)}</TableHead>
                          ))}
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {field.state.value?.length ? (
                          field.state.value.map((_: any, index: number) => (
                            <RowComponent key={index} index={index} field={field} removeValue={field.removeValue} />
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={section.columns.length + 1} className="h-24 text-center">
                              No rows added yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newRow = Object.fromEntries(section.columns.map((c) => [c, '']));
                      field.pushValue(newRow);
                    }}
                  >
                    Add Row
                  </Button>
                </>
              )}
            </form.Field>
          </motion.div>
        );
      }

      default:
        console.warn('Unknown section type:', (section as any).type)
        return null
    }
  }
)

SectionRenderer.displayName = 'SectionRenderer' 
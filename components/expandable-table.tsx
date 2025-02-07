'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ArrowUpDown,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditableCell } from './editable-cell'
import { SortDirection } from '../lib/types/table-types'
import { highlightText, sortData } from '../lib/utils/table-utils'
import { Card } from './ui/card'

// ─────────────────────────────────────────────────────
// 1) TanStack React Table Imports
// ─────────────────────────────────────────────────────
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  ColumnDef,
  ExpandedState,
  flexRender,
} from '@tanstack/react-table'

/** 
 * We'll not use "initialData" for production fetch, but let's keep a fallback.
 */
interface Item {
  id: string
  insumos: string
  unidad: string
  precio: string
  subItems?: Item[]
}

const initialData: Item[] = []

/**
 * Convert your fetched "tags" data structure into an Item[] shape.
 */
function adaptTagsToItems(tags: any[]): Item[] {
  // Each tag => one top-level Item
  // Each element => one subItem
  return tags.map((tag) => {
    const subItems = tag.element_tags?.map((et: any) => {
      const el = et.elements
      // If you want the last or the first price, adapt accordingly:
      let priceString = '0.00'
      if (el.prices?.length > 0) {
        const lastPrice = el.prices[el.prices.length - 1].price
        priceString = String(lastPrice)
      }
      return {
        id: String(el.id),
        insumos: el.name,
        unidad: el.unit,
        precio: priceString,
      } as Item
    }) ?? []

    return {
      id: String(tag.id),
      insumos: tag.name,
      unidad: '',
      precio: '',
      subItems,
    } as Item
  })
}

/**
 * A helper to gather all IDs (item + all subItems) recursively.
 */
function collectAllIdsRecursive(item: Item): string[] {
  const result = [item.id]
  if (item.subItems) {
    for (const sub of item.subItems) {
      result.push(...collectAllIdsRecursive(sub))
    }
  }
  return result
}

/**
 * Remove all items (and sub-items) whose IDs exist in `idsToRemove`.
 */
function removeIdsFromData(data: Item[], idsToRemove: Set<string>): Item[] {
  return data
    .filter((it) => !idsToRemove.has(it.id))
    .map((it) => {
      if (it.subItems) {
        return { ...it, subItems: removeIdsFromData(it.subItems, idsToRemove) }
      }
      return it
    })
}

/**
 * Duplicate items that are selected (along with sub-items). 
 * Returns a new array with duplicates appended at the top level.
 */
function duplicateSelected(data: Item[], selectedIds: Set<string>): Item[] {
  const newData = [...data]

  const cloneItem = (item: Item): Item => {
    const newId = `${item.id}-copy-${Math.floor(Math.random() * 1000)}`
    return {
      ...item,
      id: newId,
      subItems: item.subItems?.map(cloneItem) ?? [],
    }
  }

  const traverse = (items: Item[]) => {
    items.forEach((it) => {
      if (selectedIds.has(it.id)) {
        newData.push(cloneItem(it))
      }
      if (it.subItems) {
        traverse(it.subItems)
      }
    })
  }

  traverse(data)
  return newData
}

export default function ExpandableTable() {
  const [data, setData] = useState<Item[]>(initialData)

  // Use a TanStack 'expanded' state instead of manual expandedRows
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<keyof Item>('id')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  /**
   * Fetch data from /api/tagsWithElements
   */
  useEffect(() => {
    fetch('/api/tagsWithElements')
      .then((res) => res.json())
      .then((tags: any[]) => {
        const adapted = adaptTagsToItems(tags)
        setData(adapted)
      })
      .catch((err) => console.error('Error fetching elements:', err))
  }, [])

  /**
   * Sort data
   */
  const handleSort = (column: keyof Item) => {
    setSortColumn(column)
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

  /**
   * Update an item or subItem with a new value for the specified field.
   */
  const handleEdit = (id: string, field: keyof Item, value: string) => {
    function updateItem(items: Item[]): Item[] {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value }
        }
        if (item.subItems) {
          return { ...item, subItems: updateItem(item.subItems) }
        }
        return item
      })
    }
    setData((old) => updateItem(old))
  }

  /**
   * Toggle selection for this item + its children.
   */
  const handleToggleSelect = (item: Item) => {
    const allIds = collectAllIdsRecursive(item)
    const newSelectedIds = new Set(selectedIds)
    const newExpanded = { ...expanded as any }

    // If any child is not selected, select them all. Otherwise, unselect them all.
    const shouldSelect = allIds.some((id) => !newSelectedIds.has(id))

    if (shouldSelect) {
      allIds.forEach((id) => {
        newSelectedIds.add(id)
        newExpanded[id] = true // auto-expand
      })
    } else {
      allIds.forEach((id) => {
        newSelectedIds.delete(id)
        delete newExpanded[id]
      })
    }

    setSelectedIds(newSelectedIds)
    setExpanded(newExpanded)
  }

  /**
   * Filter + sort data for display
   */
  const filteredAndSortedData = useMemo(() => {
    let result = data
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      // Filter parent items if they match or have subItems that match
      result = result
        .map((item) => {
          const filteredSubItems = item.subItems?.filter((subItem) =>
            Object.values(subItem).some((value) =>
              value.toLowerCase().includes(searchLower)
            )
          )
          return { ...item, subItems: filteredSubItems }
        })
        .filter(
          (item) =>
            (item.subItems && item.subItems.length > 0) ||
            Object.values(item).some(
              (value) =>
                typeof value === 'string' &&
                value.toLowerCase().includes(searchLower)
            )
        )
    }
    // Sort
    return sortData(result, sortColumn, sortDirection)
  }, [data, searchTerm, sortColumn, sortDirection])

  /**
   * Auto-expand rows that contain search text
   */
  useEffect(() => {
    if (!searchTerm) {
      setExpanded({})
      return
    }
    const newExpanded: ExpandedState = { ...expanded as any }
    const searchLower = searchTerm.toLowerCase()

    data.forEach((item) => {
      const itemMatches = Object.values(item).some(
        (val) => typeof val === 'string' && val.toLowerCase().includes(searchLower)
      )
      const subItemMatches = item.subItems?.some((subItem) =>
        Object.values(subItem).some(
          (val) => typeof val === 'string' && val.toLowerCase().includes(searchLower)
        )
      )
      if (itemMatches || subItemMatches) {
        (newExpanded as Record<string, boolean>)[item.id] = true;
      }
    })

    setExpanded(newExpanded)
  }, [searchTerm, data])

  // ─────────────────────────────────────────────────────
  // Define columns for TanStack React Table
  // ─────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<Item>[]>(
    () => [
      {
        // Checkbox column for selection
        id: 'selection',
        header: () => null, // empty
        cell: ({ row }) => {
          const item = row.original
          return (
            <input
              type="checkbox"
              checked={selectedIds.has(item.id)}
              onChange={() => handleToggleSelect(item)}
              className="cursor-pointer"
            />
          )
        },
      },
      {
        // ID
        accessorKey: 'id',
        header: () => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort('id')}
            className="flex items-center space-x-1"
          >
            <span>ID</span>
            {sortColumn === 'id' ? (
              sortDirection === 'asc' ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row, getValue }) => {
          return (
            <div className="flex items-center justify-center">
              <EditableCell
                value={getValue<string>()}
                onChange={(val) => handleEdit(row.original.id, 'id', val)}
              />
            </div>
          )
        },
      },
      {
        // Insumos
        accessorKey: 'insumos',
        header: () => (
          <Button
            variant="ghost"
            onClick={() => handleSort('insumos')}
            className="flex items-center space-x-1"
          >
            <span>Insumos</span>
            {sortColumn === 'insumos' ? (
              sortDirection === 'asc' ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row, getValue }) => {
          const item = row.original
          const depth = row.depth
          const hasSubRows = row.getCanExpand()
          const isExpanded = row.getIsExpanded()

          return (
            <div
              // Indent sub-rows based on depth, plus fade/height transitions
              className="flex items-center transition-all duration-300"
              style={{
                paddingLeft: `${depth * 20}px`,
              }}
            >
              {/* Expand button if there are subItems */}
              {hasSubRows && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={row.getToggleExpandedHandler()}
                  className="mr-2"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              <EditableCell
                className={depth === 0 ? 'font-bold' : ''}
                value={item.insumos}
                onChange={(val) => handleEdit(item.id, 'insumos', val)}
                displayValue={highlightText(getValue<string>(), searchTerm)}
              />
            </div>
          )
        },
      },
      {
        // Unidad
        accessorKey: 'unidad',
        header: () => (
          <Button
            variant="ghost"
            onClick={() => handleSort('unidad')}
            className="flex items-center space-x-1"
          >
            <span>Unidad</span>
            {sortColumn === 'unidad' ? (
              sortDirection === 'asc' ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row, getValue }) => {
          return (
            <EditableCell
              value={getValue<string>()}
              onChange={(val) => handleEdit(row.original.id, 'unidad', val)}
            />
          )
        },
      },
      {
        // Precio
        accessorKey: 'precio',
        header: () => (
          <Button
            variant="ghost"
            onClick={() => handleSort('precio')}
            className="flex items-center space-x-1"
          >
            <span>Precio</span>
            {sortColumn === 'precio' ? (
              sortDirection === 'asc' ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )
            ) : (
              <ArrowUpDown className="h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row, getValue }) => {
          return (
            <EditableCell
              value={getValue<string>()}
              onChange={(val) => handleEdit(row.original.id, 'precio', val)}
            />
          )
        },
      },
    ],
    [selectedIds, sortColumn, sortDirection, searchTerm]
  )

  // ─────────────────────────────────────────────────────
  // Create the TanStack table
  // ─────────────────────────────────────────────────────
  const table = useReactTable({
    data: filteredAndSortedData,
    columns,
    state: {
      expanded,
    },
    getSubRows: (row) => row.subItems,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  // Bulk Actions
  const handleDeleteSelected = () => {
    setData((old) => removeIdsFromData(old, selectedIds))
    setSelectedIds(new Set())
  }

  const handleDuplicateSelected = () => {
    setData((old) => duplicateSelected(old, selectedIds))
    setSelectedIds(new Set())
  }

  const handleExecuteSelected = () => {
    console.log('execute')
    // Additional logic if needed
    setSelectedIds(new Set())
  }

  console.log(data)

  return (
    <div className="container p-4">
      {/* Search */}
      <Input
        placeholder="Buscar..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />

      {/* Bulk actions if anything is selected */}
      {selectedIds.size > 0 && (
        <div className="mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Actions ({selectedIds.size})</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleDeleteSelected}>
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicateSelected}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExecuteSelected}>
                Execute
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Table */}
      <Card className="max-h-[80vh] overflow-y-scroll">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
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
            {table.getRowModel().rows.map((row) => {
              const rowClasses = [
                'overflow-hidden',          // hide content that would otherwise overflow
                'transition-all',           // animate changes
                'duration-300',            // 300ms
                row.depth === 0 && 'bg-muted/30', // highlight top-level row
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <TableRow
                  key={row.id}
                  className={rowClasses}
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
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

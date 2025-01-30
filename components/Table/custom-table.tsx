"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  DollarSign,
  Tag,
  Ruler,
  HammerIcon,
  FilterIcon,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  SortingState,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  Column,
} from "@tanstack/react-table"
import { motion } from "framer-motion"

import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { DataTablePagination } from "./DataTablePagination"
import { DataTableFloatingToolbar } from "./DataTableFloatingToolbar"
import { EditableCell } from "../editable-cell"
import { Item } from "@/types/table-types"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
export interface ElementRow {
  id: string
  insumos: string
  unidad: string
  precio: string
  tags: string[] | string
}

// ─────────────────────────────────────────────────────
// Helper: highlight text
// ─────────────────────────────────────────────────────
function highlightText(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm) return text
  const regex = new RegExp(`(${searchTerm})`, "gi")
  const parts = text.split(regex)
  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="bg-yellow-200 font-bold">
        {part}
      </span>
    ) : (
      part
    )
  )
}

// Simple helper to turn a ReactNode highlight into a pure string if needed
function highlightPlainString(text: string, searchTerm: string) {
  return String(highlightText(text, searchTerm))
}

// ─────────────────────────────────────────────────────
// Global filter function
// ─────────────────────────────────────────────────────
function globalFilterFn(row: any, columnId: string, filterValue: string) {
  const cellValue = row.getValue(columnId)
  if (cellValue == null) return false

  const lower = filterValue.toLowerCase()

  if (typeof cellValue === "string") {
    return cellValue.toLowerCase().includes(lower)
  }
  if (typeof cellValue === "number") {
    return cellValue.toString().includes(lower)
  }
  if (Array.isArray(cellValue)) {
    return cellValue.some((tag: string) => tag.toLowerCase().includes(lower))
  }
  return false
}

// ─────────────────────────────────────────────────────
// Server-side fetcher for a single page
// Adjust to match your API route
// ─────────────────────────────────────────────────────
async function fetchPageData({
  pageIndex,
  pageSize,
  searchTerm,
  sorting,
}: {
  pageIndex: number
  pageSize: number
  searchTerm: string
  sorting: SortingState
}): Promise<{
  rows: ElementRow[]
  total: number
}> {
  const sortParam = sorting
    .map((sort) => `${sort.id}:${sort.desc ? "desc" : "asc"}`)
    .join(",")

  // Example query: /api/tagsWithElements?page=0&limit=10&search=wood&sort=id:asc
  const url = `/api/tagsWithElements?page=${pageIndex}&limit=${pageSize}&search=${searchTerm}&sort=${sortParam}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch data: ${res.statusText}`)
  }

  const data = await res.json()

  // Adapt the data shape if needed
  const adaptTableData = (arr: any[], _type: string): ElementRow[] =>
    arr.map((el: any) => ({
      id: String(el.id),
      insumos: el.nombre || "",
      unidad: el.unidad || "",
      precio: (el.precio || "0.00").toString(),
      fecha_precio: el.fecha_precio || "",
      tags: el.category || "",
    }))

  const materials = adaptTableData(data.materiales || [], "materiales")
  const indices = adaptTableData(data.indices || [], "indices")
  const items = adaptTableData(data.items || [], "items")
  const jornales = adaptTableData(data.jornales || [], "jornales")

  return {
    rows: [...materials, ...indices, ...items, ...jornales],
    total: data.total,
  }
}

// ─────────────────────────────────────────────────────
// A small custom hook to store/fetch cached pages
// for a given combination of parameters
// ─────────────────────────────────────────────────────
interface PageResult {
  rows: ElementRow[]
  total: number
}

/**
 * usePagesCache
 * 
 * - Keeps a local map of pageIndex => { rows, total }.
 * - Reset the cache whenever the `cacheKey` (a string
 *   representing search/filter/sort/pageSize) changes.
 */
function usePagesCache(cacheKey: string) {
  const [cache, setCache] = useState<Record<number, PageResult>>({})
  const [highestCachedPage, setHighestCachedPage] = useState<number>(-1)

  console.log('cached pages ammount', Object.keys(cache).length)

  //console log the number of pages cached, not the ammount but the pages number

  console.log('cached pages', Object.keys(cache))

  // Whenever the key changes (e.g. user changes searchTerm),
  // reset the entire cache
  useEffect(() => {
    setCache({})
    setHighestCachedPage(-1)
  }, [cacheKey])

  const getPage = useCallback(
    (pageIndex: number) => {
      return cache[pageIndex] || null
    },
    [cache]
  )

  const setPage = useCallback(
    (pageIndex: number, data: PageResult) => {
      console.log(`📥 Caching page ${pageIndex}`, {
        existing: Object.keys(cache).length,
        new: pageIndex,
        highest: highestCachedPage
      })
      setCache((prev) => ({ ...prev, [pageIndex]: data }))
      setHighestCachedPage((prev) => Math.max(prev, pageIndex))
    },
    [cache, highestCachedPage]
  )

  return { getPage, setPage }
}

// ─────────────────────────────────────────────────────
// Reusable sorted-column header with icon + up/down
// ─────────────────────────────────────────────────────
interface HeaderWithSortProps {
  label: string
  column: Column<any, any>
  icon?: React.ComponentType<any>
}
const HeaderWithSort: React.FC<HeaderWithSortProps> = ({ label, column, icon: Icon }) => {
  const canSort = column.getCanSort()
  const sorted = column.getIsSorted() // false | 'asc' | 'desc'

  return (
    <Button
      variant="ghost"
      onClick={column.getToggleSortingHandler()}
      className="flex items-center space-x-1 -ml-3 px-3"
      disabled={!canSort}
    >
      <div className="flex items-center space-x-2">
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
        <span>{label}</span>
        {canSort && (
          sorted === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : sorted === "desc" ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ArrowUpDown className="h-4 w-4" />
          )
        )}
      </div>
    </Button>
  )
}

// ─────────────────────────────────────────────────────
// Animated wrapper for TableCells
// ─────────────────────────────────────────────────────
interface AnimatedTableCellProps {
  children: React.ReactNode
  className?: string
}
const AnimatedTableCell: React.FC<AnimatedTableCellProps> = ({ children, className }) => {
  return (
    <motion.div
      layout
      initial={{ width: 0 }}
      animate={{ width: "auto" }}
      exit={{ width: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────
// The Main Table Component
// ─────────────────────────────────────────────────────
export default function CustomTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const loadingRef = useRef(new Set<string>())

  // ─────────────────────────────────────────────────────
  // 1) Table Data & States
  // ─────────────────────────────────────────────────────
  const [tableData, setTableData] = useState<ElementRow[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // 2) Sorting & Filtering & Pagination
  //    Initialize from URL (optional)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState({
    pageIndex: parseInt(searchParams.get("page") ?? "0") || 0,
    pageSize: parseInt(searchParams.get("size") ?? "10") || 10,
  })

  // 3) Build a "cache key" for the current combination
  //    of pageSize, globalFilter, sorting, etc.
  //    This ensures if you change filters, the old pages are discarded.
  const cacheKey = useMemo(() => {
    const sortKey = sorting.map((s) => s.id + ":" + (s.desc ? "desc" : "asc")).join(",")
    return `${globalFilter}__${sortKey}__size:${pagination.pageSize}`
  }, [globalFilter, sorting, pagination.pageSize])

  // 4) Row Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 5) Table instance
  const columns = useMemo<ColumnDef<ElementRow>[]>(
    () => [
      {
        id: "selection",
        header: ({ table }) => {
          const handleCheckedChange = (checked: boolean | "indeterminate") => {
            const toggleHandler = table?.getToggleAllRowsSelectedHandler?.()
            if (toggleHandler) {
              const syntheticEvent = {
                target: { checked: checked === true },
              } as unknown as MouseEvent
              toggleHandler(syntheticEvent)
            }
          }
          return (
            <Checkbox
              checked={table?.getIsAllRowsSelected?.() ?? false}
              onCheckedChange={handleCheckedChange}
              className="mx-auto"
              aria-label="Select all"
            />
          )
        },
        cell: ({ row }) => {
          const item = row.original
          return (
            <Checkbox
              checked={selectedIds.has(item.id)}
              onCheckedChange={() => handleToggleSelect(item.id)}
              aria-label="Select row"
            />
          )
        },
      },
      {
        accessorKey: "id",
        header: ({ column }) => <HeaderWithSort label="ID" column={column} />,
        cell: ({ row }) => (
          <EditableCell
            value={highlightPlainString(row.original.id, globalFilter)}
            onChange={(val) => handleEdit(row.original.id, "id", val)}
            className="justify-center"
          />
        ),
      },
      {
        accessorKey: "insumos",
        header: ({ column }) => <HeaderWithSort label="Insumos" column={column} icon={HammerIcon} />,
        cell: ({ row }) => (
          <EditableCell
            className="font-medium"
            value={row.original.insumos}
            onChange={(val) => handleEdit(row.original.id, "insumos", val)}
            displayValue={highlightText(row.original.insumos, globalFilter)}
            onClick={() => handleToggleSelect(row.original.id)}
          />
        ),
      },
      {
        accessorKey: "unidad",
        header: ({ column }) => <HeaderWithSort label="Unidad" column={column} icon={Ruler} />,
        cell: ({ row }) => (
          <EditableCell
            value={highlightPlainString(row.original.unidad, globalFilter)}
            onChange={(val) => handleEdit(row.original.id, "unidad", val)}
          />
        ),
      },
      {
        accessorKey: "precio",
        header: ({ column }) => <HeaderWithSort label="Precio" column={column} icon={DollarSign} />,
        cell: ({ row }) => {
          const formatDate = (dateString: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit' });
          };

          return (
            <div className="flex items-center gap-2">
              <EditableCell
                value={Array.isArray(row.original.precio)
                  ? highlightPlainString(row.original.precio[0], globalFilter)
                  : highlightPlainString(row.original.precio, globalFilter)}
                onChange={(val) => handleEdit(row.original.id, "precio", val)}
              />
              <Badge variant="outline" className="text-xs">
                {Array.isArray(row.original.precio)
                  ? formatDate(row.original.precio[1])
                  : formatDate(row.original.precio[1])}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "tags",
        header: ({ column }) => <HeaderWithSort label="Tags" column={column} icon={Tag} />,
        cell: ({ row }) => {
          const tags = row.original.tags
          return (
            <div className="flex flex-wrap gap-1">
              {Array.isArray(tags) ? (
                tags.map((tag, i) => {
                  const truncated = isTextTruncated(tag, 10); // Adjust maxLength as needed
                  return (
                    truncated ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            key={`${row.original.id}-${tag}-${i}`}
                            variant="accent"
                            className="max-w-[150px] truncate text-ellipsis"
                          >
                            {tag}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {tag}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge
                        key={`${row.original.id}-${tag}-${i}`}
                        variant="accent"
                        className="max-w-[150px] truncate text-ellipsis"
                      >
                        {tag}
                      </Badge>
                    )
                  );
                })
              ) : (
                (() => {
                  const truncated = isTextTruncated(tags, 19); // Adjust maxLength as needed
                  return (
                    truncated ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            key={`${row.original.id}-${tags}`}
                            variant="accent"
                            className="max-w-[150px] truncate block"
                          >
                            {tags}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {tags}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge
                        key={`${row.original.id}-${tags}`}
                        variant="accent"
                        className="max-w-[150px] truncate block"
                      >
                        {tags}
                      </Badge>
                    )
                  );
                })()
              )}
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: tableData,
    columns,
    pageCount: Math.ceil(totalRows / pagination.pageSize),
    state: {
      sorting,
      globalFilter,
      pagination,
      rowSelection: Object.fromEntries([...selectedIds].map((id) => [id, true])),
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
      const targetPage = newPagination.pageIndex;

      // Only allow navigation if the page is cached or it's going backwards
      if (getPage(targetPage) || targetPage < pagination.pageIndex) {
        setPagination(newPagination);
      } else {
        // If page is not cached, trigger its fetch first
        const loadingKey = `${targetPage}-${cacheKey}`;
        if (!loadingRef.current.has(loadingKey)) {
          fetchPageData({
            pageIndex: targetPage,
            pageSize: pagination.pageSize,
            searchTerm: globalFilter,
            sorting,
          }).then(({ rows, total }) => {
            setPage(targetPage, { rows, total });
            setPagination(newPagination);
          }).catch(err => {
            console.error("Failed to fetch page:", err);
          });
        }
      }
    },
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === "function"
          ? updater(Object.fromEntries([...selectedIds].map((id) => [id, true])))
          : updater
      setSelectedIds(new Set(Object.keys(newSelection)))
    },
  })

  // ─────────────────────────────────────────────────────
  // 6) The pagesCache hook
  // ─────────────────────────────────────────────────────
  const { getPage, setPage } = usePagesCache(cacheKey)

  // Add a new effect just for URL updates
  useEffect(() => {
    if (searchParams) {
      const currentPage = searchParams.get("page")
      const currentSize = searchParams.get("size")

      // Only update URL if values actually changed
      if (currentPage !== pagination.pageIndex.toString() ||
        currentSize !== pagination.pageSize.toString()) {
        const params = new URLSearchParams(searchParams.toString())
        params.set("page", pagination.pageIndex.toString())
        params.set("size", pagination.pageSize.toString())
        router.replace(`?${params.toString()}`, { scroll: false })
      }
    }
  }, [pagination.pageIndex, pagination.pageSize])

  // Data loading effect
  useEffect(() => {
    const loadData = async () => {
      const loadingKey = `${pagination.pageIndex}-${cacheKey}`
      if (loadingRef.current.has(loadingKey)) return;

      // 1) Check cache first
      const cached = getPage(pagination.pageIndex)
      if (cached) {
        // If cached, just use it
        setTableData(cached.rows)
        setTotalRows(cached.total)
        return;
      }

      // Otherwise, fetch from server
      try {
        loadingRef.current.add(loadingKey)
        setIsLoading(true)
        const { rows, total } = await fetchPageData({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          searchTerm: globalFilter,
          sorting,
        })

        if (!getPage(pagination.pageIndex)) { // Double check cache before updating
          setTableData(rows)
          setTotalRows(total)
          // Store in cache
          setPage(pagination.pageIndex, { rows, total })
          // Trigger prefetch immediately after initial data load
          prefetchPages(total);
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setIsLoading(false)
        loadingRef.current.delete(loadingKey)
      }
    }

    // Helper function to fetch and cache a single page
    const fetchAndCachePage = async (pageIndex: number, maxPage: number) => {
      if (pageIndex < 0 || pageIndex >= maxPage || getPage(pageIndex)) return;

      const prefetchKey = `${pageIndex}-${cacheKey}`
      if (loadingRef.current.has(prefetchKey)) return;

      try {
        loadingRef.current.add(prefetchKey)
        const { rows, total } = await fetchPageData({
          pageIndex,
          pageSize: pagination.pageSize,
          searchTerm: globalFilter,
          sorting,
        })
        if (!getPage(pageIndex)) { // Double check cache before updating
          setPage(pageIndex, { rows, total })
        }
      } catch (err) {
        console.warn(`Prefetch of page ${pageIndex} failed.`, err)
      } finally {
        loadingRef.current.delete(prefetchKey)
      }
    }

    // Prefetch function that can be called both after initial load and on navigation
    const prefetchPages = async (total: number) => {
      const maxPage = Math.ceil(total / pagination.pageSize)
      const prefetchCount = 5

      // Prefetch next and previous pages in parallel
      const prefetchPromises = [];
      for (let i = 1; i <= prefetchCount; i++) {
        prefetchPromises.push(fetchAndCachePage(pagination.pageIndex + i, maxPage));
        prefetchPromises.push(fetchAndCachePage(pagination.pageIndex - i, maxPage));
      }

      await Promise.all(prefetchPromises);
    }

    // Always load the main data
    loadData();

    // Also set up prefetch on navigation changes
    if (totalRows > 0) {
      const timeoutId = setTimeout(() => prefetchPages(totalRows), 100);
      return () => clearTimeout(timeoutId);
    }

  }, [pagination.pageIndex, cacheKey])

  // ─────────────────────────────────────────────────────
  // 8) Handlers
  // ─────────────────────────────────────────────────────
  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  function handleEdit(itemId: string, field: keyof ElementRow, value: string) {
    // Example local update
    setTableData((prev) =>
      prev.map((row) => (row.id === itemId ? { ...row, [field]: value } : row))
    )
    // You could also update the cache if you want these changes persistent
  }

  function handleDeleteSelected() {
    setTableData((prev) => prev.filter((row) => !selectedIds.has(row.id)))
    setSelectedIds(new Set())
  }

  function handleDuplicateSelected() {
    const newRows: ElementRow[] = []
    for (const row of tableData) {
      if (selectedIds.has(row.id)) {
        const newId = `${row.id}-copy-${Math.floor(Math.random() * 1000)}`
        newRows.push({ ...row, id: newId })
      }
    }
    setTableData((prev) => [...prev, ...newRows])
  }

  function handleExecuteSelected() {
    console.log("Execute action for selected:", [...selectedIds])

    // redirect to presupuesto
    router.push(`/presupuesto?selectedIds=${[...selectedIds].join(',')}`);
  }

  // ─────────────────────────────────────────────────────
  // 9) Render
  // ─────────────────────────────────────────────────────
  // console.log(tableData)
  return (
    <div className="container p-4 flex flex-col gap-4 relative">
      {/* Top actions / toolbar */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <Input
            placeholder="Buscar..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
          {selectedIds.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="h-10">
                  Actions ({selectedIds.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleDeleteSelected}>Delete</DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicateSelected}>Duplicate</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExecuteSelected}>Execute</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="secondary">
            <FilterIcon />
          </Button>
          <Button variant="secondary">Actions ({selectedIds.size})</Button>
          <Button variant="default">Actions</Button>
        </div>
      </div>

      {/* Table Container */}
      <Card className="max-h-[80vh] overflow-auto rounded-lg border shadow-3sm">
        <Table className="w-full">
          <TableHeader className="shadow-2sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={`py-0 px-4 ${header.column.id === "id" ? "w-2 p-0" : ""
                      } ${header.column.id === "selection"
                        ? "flex items-center justify-center pl-2"
                        : ""
                      }`}
                  >
                    {header.isPlaceholder
                      ? null
                      : typeof header.column.columnDef.header === 'function'
                        ? header.column.columnDef.header(header.getContext())
                        : header.column.columnDef.header}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="text-foreground-dim">
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="h-10">
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={`py-0 px-4 ${cell.column.id === "id" || cell.column.id === "selection"
                      ? "text-center align-middle"
                      : ""
                      }`}
                  >
                    <AnimatedTableCell>
                      {typeof cell.column.columnDef.cell === 'function'
                        ? cell.column.columnDef.cell(cell.getContext())
                        : cell.column.columnDef.cell}
                    </AnimatedTableCell>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Extra toolbar (optional) */}
      <DataTableFloatingToolbar
        table={table}
        data={tableData}
        columnsConfig={table.getAllColumns()}
      />

      {/* Pagination UI */}
      <DataTablePagination
        table={table}
        isLoading={isLoading}
        totalPages={Math.ceil(totalRows / pagination.pageSize)}
      />
    </div>
  )
}

function isTextTruncated(text: string, maxLength: number): boolean {
  return text.length > maxLength;
}

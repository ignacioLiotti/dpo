"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  DollarSign,
  Tag,
  Ruler,
  HammerIcon,
  FilterIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  SortingState,
  getSortedRowModel,
  getFilteredRowModel,
  Column,
} from "@tanstack/react-table";
import { motion } from "framer-motion";

import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DataTablePagination } from "./DataTablePagination";
import { DataTableFloatingToolbar } from "./DataTableFloatingToolbar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useQuery } from "@tanstack/react-query";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
export interface ElementRow {
  id: string;
  nombre: string;
  unidad: string;
  precio: number;
  fecha: string;
  categoria: string;
}

// ─────────────────────────────────────────────────────
// Helper: highlight text
// ─────────────────────────────────────────────────────
function highlightText(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="bg-yellow-200 font-bold">
        {part}
      </span>
    ) : (
      part
    )
  );
}

function highlightPlainString(text: string, searchTerm: string) {
  return String(highlightText(text, searchTerm));
}

// ─────────────────────────────────────────────────────
// Reusable sorted-column header with icon + up/down
// ─────────────────────────────────────────────────────
interface HeaderWithSortProps {
  label: string;
  column: Column<any, any>;
  icon?: React.ComponentType<any>;
}
const HeaderWithSort: React.FC<HeaderWithSortProps> = ({ label, column, icon: Icon }) => {
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted();

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
        {canSort &&
          (sorted === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : sorted === "desc" ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ArrowUpDown className="h-4 w-4" />
          ))}
      </div>
    </Button>
  );
};

// ─────────────────────────────────────────────────────
// Animated wrapper for TableCells
// ─────────────────────────────────────────────────────
interface AnimatedTableCellProps {
  children: React.ReactNode;
  className?: string;
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
  );
};

// ─────────────────────────────────────────────────────
// The Main Table Component
// ─────────────────────────────────────────────────────
export default function CustomTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const obraParam = searchParams.get("obra");

  // 1) Table Data & Local States
  const [tableData, setTableData] = useState<ElementRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);

  // 2) Sorting, Filtering & Pagination (initialized from URL if needed)
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: parseInt(searchParams.get("page") ?? "0") || 0,
    pageSize: parseInt(searchParams.get("size") ?? "10") || 10,
  });

  // 3) Build a "cache key" for the current combination of parameters.
  const cacheKey = useMemo(() => {
    const sortKey = sorting.map((s) => s.id + ":" + (s.desc ? "desc" : "asc")).join(",");
    return `${globalFilter}__${sortKey}__size:${pagination.pageSize}`;
  }, [globalFilter, sorting, pagination.pageSize]);

  // 4) Row Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 5) Define Table Columns
  const columns = useMemo<ColumnDef<ElementRow>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <HeaderWithSort label="Name" column={column} icon={Tag} />
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return <div className="flex items-center"><span className="truncate">{value}</span></div>;
      },
    },
    {
      accessorKey: "unidad",
      header: ({ column }) => (
        <HeaderWithSort label="Unit" column={column} icon={Ruler} />
      ),
    },
    {
      accessorKey: "precio",
      header: ({ column }) => (
        <HeaderWithSort label="Price" column={column} icon={DollarSign} />
      ),
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
        }).format(value);
      },
    },
    {
      accessorKey: "categoria",
      header: ({ column }) => (
        <HeaderWithSort label="Category" column={column} icon={HammerIcon} />
      ),
    },
    {
      accessorKey: "fecha",
      header: ({ column }) => (
        <HeaderWithSort label="Price Date" column={column} />
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return value ? new Date(value).toLocaleDateString() : "-";
      },
    },
  ], []);

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
    onPaginationChange: setPagination,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === "function"
          ? updater(Object.fromEntries([...selectedIds].map((id) => [id, true])))
          : updater;
      setSelectedIds(new Set(Object.keys(newSelection)));
    },
  });

  // 6) Data Fetching with React Query using the object syntax.
  const { data: queryData, isLoading, error } = useQuery({
    queryKey: ["items", pagination.pageIndex, pagination.pageSize, sorting, globalFilter],
    queryFn: async () => {
      const sortParam = sorting
        .map((sort) => `${sort.id}:${sort.desc ? "desc" : "asc"}`)
        .join(",");
      const url = `/api/items?page=${pagination.pageIndex}&limit=${pagination.pageSize}&search=${globalFilter}&sort=${sortParam}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch data: ${res.statusText}`);
      }
      const data = await res.json();
      const items = data.items || [];
      const rows = items.map((item: any) => ({
        id: item.id.toString(),
        nombre: item.nombre,
        unidad: item.unidad,
        precio: item.precios?.[0]?.precio || 0,
        fecha: item.precios?.[0]?.fecha || "",
        categoria: item.categoria,
      }));
      return { rows, total: data.total || 0 };
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    if (queryData) {
      setTableData(queryData.rows);
      setTotalRows(queryData.total);
    }
  }, [queryData]);

  // Update URL parameters when pagination changes.
  useEffect(() => {
    if (searchParams) {
      const currentPage = searchParams.get("page");
      const currentSize = searchParams.get("size");
      if (
        currentPage !== pagination.pageIndex.toString() ||
        currentSize !== pagination.pageSize.toString()
      ) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", pagination.pageIndex.toString());
        params.set("size", pagination.pageSize.toString());
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }
  }, [pagination.pageIndex, pagination.pageSize]);

  // 7) Handlers for Row Actions
  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  function handleEdit(itemId: string, field: keyof ElementRow, value: string) {
    setTableData((prev) =>
      prev.map((row) => (row.id === itemId ? { ...row, [field]: value } : row))
    );
  }

  function handleDeleteSelected() {
    setTableData((prev) => prev.filter((row) => !selectedIds.has(row.id)));
    setSelectedIds(new Set());
  }

  function handleDuplicateSelected() {
    const newRows: ElementRow[] = [];
    for (const row of tableData) {
      if (selectedIds.has(row.id)) {
        const newId = `${row.id}-copy-${Math.floor(Math.random() * 1000)}`;
        newRows.push({ ...row, id: newId });
      }
    }
    setTableData((prev) => [...prev, ...newRows]);
  }

  function handleExecuteSelected() {
    console.log("Execute action for selected:", [...selectedIds]);
    router.push(`/presupuesto?selectedIds=${[...selectedIds].join(",")}`);
  }

  // 8) Render
  return (
    <div className="container max-w-full p-4 flex flex-col gap-4 relative">
      {obraParam && (
        <div className="mb-4">
          <Card className="p-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <HammerIcon className="h-5 w-5" />
              Obra: {decodeURIComponent(obraParam)}
            </h2>
          </Card>
        </div>
      )}

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
                      : typeof header.column.columnDef.header === "function"
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
                      {typeof cell.column.columnDef.cell === "function"
                        ? cell.column.columnDef.cell(cell.getContext())
                        : cell.getValue()}
                    </AnimatedTableCell>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <DataTableFloatingToolbar table={table} data={tableData} columnsConfig={table.getAllColumns()} />

      <DataTablePagination
        table={table}
        isLoading={isLoading}
        totalPages={Math.ceil(totalRows / pagination.pageSize)}
      />
    </div>
  );
}

function globalFilterFn(row: any, columnId: string, filterValue: string) {
  const cellValue = row.getValue(columnId);
  if (cellValue == null) return false;
  const lower = filterValue.toLowerCase();
  if (typeof cellValue === "string") {
    return cellValue.toLowerCase().includes(lower);
  }
  if (typeof cellValue === "number") {
    return cellValue.toString().includes(lower);
  }
  if (Array.isArray(cellValue)) {
    return cellValue.some((tag: string) => tag.toLowerCase().includes(lower));
  }
  return false;
}

function isTextTruncated(text: string, maxLength: number): boolean {
  return text.length > maxLength;
}

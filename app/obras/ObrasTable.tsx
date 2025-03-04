"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Building2,
  MapPin,
  Calendar,
  Activity,
  CalendarRange,
  Search,
  Filter,
  CircleDollarSign,
  X,
  Check,
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
  flexRender,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import Link from "next/link";
import { format, subMonths, parse, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { Obra } from "@/types";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

// ─────────────────────────────────────────────────────
// Helper: highlight text
// ─────────────────────────────────────────────────────
function highlightText(text: string = "", searchTerm: string = ""): React.ReactNode {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="bg-yellow-200 dark:bg-yellow-800 font-medium">
        {part}
      </span>
    ) : (
      part
    )
  );
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
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────
// Date Filter Component
// ─────────────────────────────────────────────────────
interface DateFilterProps {
  onFilterChange: (range: { from: Date | null; to: Date | null } | null) => void;
  value?: DateRange;
}

const DateFilter: React.FC<DateFilterProps> = ({ onFilterChange, value }) => {
  const presets = [
    { label: "Último mes", getDates: () => ({ from: subMonths(new Date(), 1), to: new Date() }) },
    { label: "Últimos 6 meses", getDates: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
    { label: "Último año", getDates: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
    { label: "Últimos 4 años", getDates: () => ({ from: subMonths(new Date(), 48), to: new Date() }) },
  ];

  const handleSelect = (newDate: DateRange | undefined) => {
    onFilterChange(newDate ? {
      from: newDate.from || null,
      to: newDate.to || null,
    } : null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="lg" className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4" />
          Filtrar por fecha
          {value?.from && (
            <span className="ml-2 text-xs text-muted-foreground">
              {format(value.from, "MMM yyyy", { locale: es })}
              {value.to && ` - ${format(value.to, "MMM yyyy", { locale: es })}`}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Filtros predefinidos</DropdownMenuLabel>
        {presets.map((preset) => (
          <DropdownMenuItem
            key={preset.label}
            onClick={() => {
              const newDate = preset.getDates();
              handleSelect(newDate);
            }}
          >
            {preset.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="p-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarRange className="mr-2 h-4 w-4" />
                Personalizado
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={handleSelect}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            handleSelect(undefined);
          }}
        >
          Limpiar filtro
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ─────────────────────────────────────────────────────
// Presupuesto Range Input Component
// ─────────────────────────────────────────────────────
const PresupuestoRangeInput: React.FC<{
  value: { min?: number; max?: number };
  onChange: (value: { min?: number; max?: number }) => void;
}> = ({ value, onChange }) => {
  const [localValue, setLocalValue] = useState<[number, number]>([value.min || 0, value.max || 100000000000]);
  const [open, setOpen] = useState(false);
  const [customInputs, setCustomInputs] = useState({
    min: value.min?.toString() || "",
    max: value.max?.toString() || ""
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleValueChange = (newValue: [number, number]) => {
    setLocalValue(newValue);
    setCustomInputs({
      min: newValue[0].toString(),
      max: newValue[1].toString()
    });
  };

  const handleCustomInputChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? '' : parseFloat(value);
    setCustomInputs(prev => ({
      ...prev,
      [type]: value
    }));

    if (numValue !== '') {
      if (type === 'min') {
        setLocalValue([numValue, Math.max(numValue, localValue[1])]);
      } else {
        setLocalValue([Math.min(numValue, localValue[0]), numValue]);
      }
    }
  };

  const handleValueCommit = () => {
    const min = customInputs.min ? parseFloat(customInputs.min) : undefined;
    const max = customInputs.max ? parseFloat(customInputs.max) : undefined;

    onChange({
      min,
      max
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            "flex items-center gap-2 h-8 px-3 text-muted-foreground",
            (value.min !== undefined || value.max !== undefined) && "text-foreground"
          )}
        >
          <CircleDollarSign className="h-4 w-4" />
          {value.min === undefined && value.max === undefined ? (
            <span>Presupuesto</span>
          ) : (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-muted-foreground"
            >
              {formatCurrency(value.min || 0)} - {formatCurrency(value.max || 100000000000)}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        align="start"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 py-2"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>{formatCurrency(localValue[0])}</span>
                <span>{formatCurrency(localValue[1])}</span>
              </div>
              <Slider
                defaultValue={[value.min || 0, value.max || 100000000000]}
                value={localValue}
                min={0}
                max={10000000}
                step={100000}
                onValueChange={handleValueChange}
                className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              />
            </div>
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="min-value" className="text-xs text-muted-foreground mb-1.5 block">
                  Mínimo
                </Label>
                <div className="relative">
                  <CircleDollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="min-value"
                    type="number"
                    value={customInputs.min}
                    onChange={(e) => handleCustomInputChange('min', e.target.value)}
                    className="pl-8 pr-2 h-8"
                    placeholder="Min"
                  />
                </div>
              </div>
              <div className="flex-1">
                <Label htmlFor="max-value" className="text-xs text-muted-foreground mb-1.5 block">
                  Máximo
                </Label>
                <div className="relative">
                  <CircleDollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="max-value"
                    type="number"
                    value={customInputs.max}
                    onChange={(e) => handleCustomInputChange('max', e.target.value)}
                    className="pl-8 pr-2 h-8"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                onChange({});
                setCustomInputs({ min: "", max: "" });
                setLocalValue([0, 10000000]);
                setOpen(false);
              }}
            >
              Reset
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                handleValueCommit();
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
};

// ─────────────────────────────────────────────────────
// Estado Select Component
// ─────────────────────────────────────────────────────
const EstadoSelect: React.FC<{
  estados: string[];
  value: string[];
  onChange: (value: string[]) => void;
}> = ({ estados, value, onChange }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[180px] justify-between shadow-sm rounded-lg h-8 text-muted-foreground"
          >
            {value.length === 0 && "Seleccionar estado"}
            {value.length === 1 && value[0]}
            {value.length > 1 && `${value.length} estados`}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-0">
          <Command>
            <CommandInput placeholder="Buscar estado..." />
            <CommandEmpty>No se encontraron estados.</CommandEmpty>
            <CommandGroup>
              {estados.map((estado) => (
                <CommandItem
                  key={estado}
                  onSelect={() => {
                    onChange(
                      value.includes(estado)
                        ? value.filter((v) => v !== estado)
                        : [...value, estado]
                    );
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(estado) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {estado}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {value.map((estado) => (
            <Badge
              key={estado}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {estado}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => onChange(value.filter((v) => v !== estado))}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────
// Add this before the FilterPopover interface
// ─────────────────────────────────────────────────────
interface TableFilters {
  departamento?: string;
  hasEmpresa: boolean;
  empresaNombre?: string;
}

// ─────────────────────────────────────────────────────
// Filter Popover Component
// ─────────────────────────────────────────────────────
interface FilterPopoverProps {
  onFilterChange: (filters: TableFilters) => void;
  currentFilters: TableFilters;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({
  onFilterChange,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<TableFilters>(currentFilters);

  const handleFilterChange = (newFilters: Partial<TableFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="flex items-center gap-2 text-muted-foreground ">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label>Ubicación</Label>
            <Input
              placeholder="Filtrar por ubicación..."
              value={filters.departamento || ""}
              onChange={(e) => handleFilterChange({ departamento: e.target.value || undefined })}
            />
          </div>

          <div className="space-y-2">
            <Label>Empresa</Label>
            <Input
              placeholder="Nombre de empresa..."
              value={filters.empresaNombre || ""}
              onChange={(e) => handleFilterChange({ empresaNombre: e.target.value || undefined })}
            />
          </div>

          <div className="space-y-2">
            <Label>Solo con empresa asignada</Label>
            <Button
              variant={filters.hasEmpresa ? "default" : "outline"}
              onClick={() => handleFilterChange({ hasEmpresa: !filters.hasEmpresa })}
              className="w-full"
            >
              {filters.hasEmpresa ? "Sí" : "No"}
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              const emptyFilters = { hasEmpresa: false };
              setFilters(emptyFilters);
              onFilterChange(emptyFilters);
            }}
            className="mt-2"
          >
            Limpiar filtros
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ─────────────────────────────────────────────────────
// The Main Table Component
// ─────────────────────────────────────────────────────
interface ObrasTableProps {
  data: Obra[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  estados: string[];
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

export default function ObrasTable({
  data,
  searchQuery,
  onSearchChange,
  estados,
  dateRange,
  onDateRangeChange
}: ObrasTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // States
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: parseInt(searchParams.get("page") ?? "0") || 0,
    pageSize: parseInt(searchParams.get("size") ?? "10") || 10,
  });
  const [tableFilters, setTableFilters] = useState<TableFilters>({ hasEmpresa: false });
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
  const [presupuestoRange, setPresupuestoRange] = useState<{ min?: number; max?: number }>({});

  // Update DateFilter component to use parent's state
  const handleDateFilterChange = (range: { from: Date | null; to: Date | null } | null) => {
    onDateRangeChange?.(range ? { from: range.from!, to: range.to! } : undefined);
  };

  // Parse date from string (format: "DD-MMM-YY")
  const parseDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    try {
      return parse(dateStr.toLowerCase(), "dd-MMM-yy", new Date(), { locale: es });
    } catch {
      return null;
    }
  };

  // Apply all filters
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply date filter
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter((obra) => {
        const startDate = parseDate(obra.fechaInicio);
        if (!startDate) return false;

        const range = {
          start: dateRange.from!,
          end: dateRange.to || new Date(),
        };

        return isWithinInterval(startDate, range);
      });
    }

    // Apply estado filter
    if (selectedEstados.length > 0) {
      filtered = filtered.filter((obra) => selectedEstados.includes(obra.avance));
    }

    // Apply presupuesto range filter
    if (presupuestoRange.min !== undefined || presupuestoRange.max !== undefined) {
      filtered = filtered.filter((obra) => {
        const monto = parseFloat(obra.montoContrato?.replace(/[$.]/g, '').replace(',', '.') || "0");
        if (presupuestoRange.min !== undefined && monto < presupuestoRange.min) return false;
        if (presupuestoRange.max !== undefined && monto > presupuestoRange.max) return false;
        return true;
      });
    }

    // Apply table filters
    if (tableFilters.departamento) {
      const searchTerm = tableFilters.departamento.toLowerCase();
      filtered = filtered.filter((obra) =>
        obra.departamento?.toLowerCase().includes(searchTerm) ||
        obra.localidad?.toLowerCase().includes(searchTerm)
      );
    }

    if (tableFilters.empresaNombre) {
      const searchTerm = tableFilters.empresaNombre.toLowerCase();
      filtered = filtered.filter((obra) =>
        obra.empresaAdjudicada?.toLowerCase().includes(searchTerm)
      );
    }

    if (tableFilters.hasEmpresa) {
      filtered = filtered.filter((obra) => obra.empresaAdjudicada && obra.empresaAdjudicada.trim() !== '');
    }

    return filtered;
  }, [data, dateRange, selectedEstados, presupuestoRange, tableFilters]);

  // Define Table Columns
  const columns = useMemo<ColumnDef<Obra>[]>(() => [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <HeaderWithSort label="ID" column={column} />
      ),
      size: 80,
    },
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <HeaderWithSort label="Nombre" column={column} icon={Building2} />
      ),
      cell: ({ getValue, row }) => {
        const value = getValue() as string;
        const obraId = row.original.id;
        return (
          <Link href={`/obras/${obraId}`} className="flex items-center">
            <span className="truncate">{highlightText(value, searchQuery)}</span>
          </Link>
        );
      },
    },
    {
      accessorFn: (row) => `${row.localidad}, ${row.departamento}`,
      id: "ubicacion",
      header: ({ column }) => (
        <HeaderWithSort label="Ubicación" column={column} icon={MapPin} />
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return highlightText(value, searchQuery);
      },
    },
    {
      accessorKey: "empresaAdjudicada",
      header: ({ column }) => (
        <HeaderWithSort label="Empresa" column={column} icon={Building2} />
      ),
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return highlightText(value || '-', searchQuery);
      },
    },
    {
      accessorKey: "montoContrato",
      header: ({ column }) => (
        <HeaderWithSort label="Presupuesto" column={column} icon={CircleDollarSign} />
      ),
      sortingFn: (rowA, rowB) => {
        const aValue = parseFloat(rowA.original.montoContrato?.replace(/[$.]/g, '').replace(',', '.') || "0");
        const bValue = parseFloat(rowB.original.montoContrato?.replace(/[$.]/g, '').replace(',', '.') || "0");
        return aValue - bValue;
      },
      cell: ({ getValue }) => {
        const value = getValue() as string;
        console.log(value);
        const numericValue = parseFloat(value?.replace(/[$.]/g, '').replace(',', '.') || "0");
        console.log(numericValue);
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(numericValue);
      },
    },
    {
      accessorKey: "fechaInicio",
      header: ({ column }) => (
        <HeaderWithSort label="Fecha Inicio" column={column} icon={Calendar} />
      ),
    },
    {
      accessorKey: "fechaFin",
      header: ({ column }) => (
        <HeaderWithSort label="Fecha Fin" column={column} icon={Calendar} />
      ),
    },
    {
      accessorKey: "avance",
      header: ({ column }) => (
        <HeaderWithSort label="Estado" column={column} icon={Activity} />
      ),
    },

  ], [searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => String(row.id),
  });

  // Update URL parameters when pagination changes
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

  return (
    <Card className="rounded-lg border-none shadow-none">
      <div className="p-4 border-b">
        <div className="flex items-center gap-4 justify-between">
          <div className="relative flex-1 max-w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar obras..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4 ">
            {/* <DateFilter onFilterChange={handleDateFilterChange} value={dateRange} /> */}
            <PresupuestoRangeInput
              value={presupuestoRange}
              onChange={setPresupuestoRange}
            />
            <EstadoSelect
              estados={estados}
              value={selectedEstados}
              onChange={setSelectedEstados}
            />
            <FilterPopover
              onFilterChange={setTableFilters}
              currentFilters={tableFilters}
            />
          </div>
        </div>
      </div>

      <Table className="overflow-y-scroll max-h-[500px]">
        <TableHeader className="sticky top-0 bg-background">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="py-0 px-4"
                >
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
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="h-10">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-0 px-4">
                  <AnimatedTableCell>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </AnimatedTableCell>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-4 py-4 border-t">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} obra(s) total
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 w-[70px] rounded-md border border-input bg-transparent"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

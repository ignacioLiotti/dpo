// tableComponent/Components/DataTableToolbar.tsx

"use client";

import * as React from "react"
import { Table } from "@tanstack/react-table";
import { CheckCircle, CrossIcon, Download, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { useToast } from "@/hooks/use-toast";
import DataTableFacetedFilter from "@/components/Table/DataTableFacetedFilter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  data: any;
  columnsConfig: any;
  globalFilter: string | null;
  setGlobalFilter: (filterValue: string) => void;
}
export function DataTableToolbar<TData>({
  table,
  data,
  columnsConfig,
  globalFilter,
  setGlobalFilter,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
  const filterColumn = columnsConfig?.config?.textInputFilter || "id"; // Use the first column as the default filter column

  // Add this state to manage filter reset callbacks
  const [resetCallbacks, setResetCallbacks] = React.useState<(() => void)[]>([]);

  // Add this function to register reset callbacks
  const registerResetCallback = React.useCallback((callback: () => void) => {
    setResetCallbacks(prev => [...prev, callback]);
  }, []);

  const handleResetFilters = () => {
    table.resetColumnFilters();
    setGlobalFilter("");
    // Call all registered reset callbacks
    resetCallbacks.forEach(callback => callback());
  };

  const isValidDate = (value: any) => {
    return (
      (value instanceof Date && !isNaN(value as any)) ||
      (typeof value === 'string' &&
        /\d{2,4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value) &&
        !isNaN(new Date(value).getTime()))
    );
  };

  const handleAction = (action: any) => {
    if (action.value === 'export') {
      // handleExport();
    } else if (action.value === 'delete') {
      // Placeholder for delete action
      console.log("Delete action triggered");
    }
  };

  const actions = [
    { value: 'export', label: 'Export CSV' },
    // { value: 'delete', label: 'Delete' }
  ];

  const handleFilterChange = (event: any) => {
    if (filterColumn === "global") return setGlobalFilter(event.target.value);
    else return table.getColumn(filterColumn)?.setFilterValue(event.target.value);
  };


  return (
    <div className="tw-flex tw-flex-col tw-justify-center tw-items-start tw-gap-2">
      <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center tw-items-start tw-justify-between tw-w-full tw-gap-3 lg:tw-gap-none">
        <div className="tw-flex tw-flex-1 tw-items-center  tw-space-x-2 tw-text-sm">
          {/* Texto para traducir */}
          <Input
            placeholder={filterColumn !== "global" ? `Filtrar ${table.getColumn(filterColumn)?.columnDef.header} ...` : 'Buscar ...'}
            value={globalFilter ? globalFilter : (table.getColumn(filterColumn)?.getFilterValue() as string)}
            onChange={handleFilterChange}
            className="tw-h-8 tw-w-[150px] lg:tw-w-[250px]"
          />
          {columnsConfig.columns?.map((col: any) => (
            col.filterType && table.getColumn(col.accessorKey) && col.filterOptions && (
              <DataTableFacetedFilter
                key={col.accessorKey}
                column={table.getColumn(col.accessorKey)}
                title={col.header}
                options={col.filterOptions}
                onResetFilters={() => registerResetCallback(() => { })}
              />
            )
          ))}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={handleResetFilters} // Use the new handleResetFilters function
              className="tw-h-8 tw-px-2 lg:tw-px-3"
            >
              {/* Texto para traducir */}
              <span className="tw-hidden lg:tw-flex">
                Resetear
              </span>
              <CrossIcon className="lg:tw-ml-2 lg:tw-h-4 lg:tw-w-4 tw-h-5 tw-w-5" />
            </Button>
          )}
        </div>
        <div className="tw-flex tw-items-center lg:tw-space-x-2">
          {/* <DataTableViewOptions table={table} /> */}
        </div>
      </div>
      <div
        className={`tw-transition-all tw-transform ${selectedRows.length > 0 ? 'tw-max-h-screen' : 'tw-max-h-0'} tw-overflow-hidden tw-duration-500 tw-ease-in-out`}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* Texto para traducir */}
            <Button variant="outline">Acciones</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="tw-w-56">
            {/* Texto para traducir */}
            <DropdownMenuLabel>Acciones Disponibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* <DropdownMenuItem className="tw-cursor-pointer" onClick={(e) => {
                handleAction(e);
                toast({
                  title: <div className="tw-flex tw-gap-3"><CheckCircle />"Row Deleted"</div>,
                  description: "All the selected rows data has been deleted.",
                })
              }}>
                <LogOut className="tw-mr-2 tw-h-4 tw-w-4" />
                <span>Delete</span>
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </div>
  );
}

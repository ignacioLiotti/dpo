"use client";

import * as React from "react"
import { Table } from "@tanstack/react-table";
import { CheckCircle, CrossIcon, Download, PlusCircle, Trash2Icon, XIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useToast } from "../../hooks/use-toast";
import DataTableFacetedFilter from "./DataTableFacetedFilter";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@radix-ui/react-dropdown-menu";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  data: any;
  columnsConfig: any;
}

export function DataTableFloatingToolbar<TData>({
  table,
  data,
  columnsConfig,
}: DataTableToolbarProps<TData>) {
  const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);

  return (
    <AnimatePresence>
      {selectedRows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 10 }}
          exit={{ opacity: 0, y: 30 }}
          className="flex flex-col justify-center items-center gap-2 absolute h-10 w-[450px] rounded-lg shadow-simple bg-black -bottom-10 left-[35%]"
        >
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white">
                {table.getFilteredSelectedRowModel().rows.length} selected
              </span>
              <Separator className="bg-[#ffffff40] h-8 w-[1px]" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { }}
                className="text-white hover:text-white/60"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Duplicate
              </Button>

              <Separator className="bg-[#ffffff40] h-8 w-[1px]" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => { }}
                className="text-[hsl(var(--red-400))] hover:text-[hsl(var(--red-600))]"
              >
                <Trash2Icon className="h-4 w-4 mr-2" />
                Delete
              </Button>

              <Separator className="bg-[#ffffff40] h-8 w-[1px]" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => { }}
                className="text-white hover:text-white/60"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
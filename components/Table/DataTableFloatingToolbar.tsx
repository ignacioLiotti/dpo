"use client";

import * as React from "react"
import { Table } from "@tanstack/react-table";
import { Download, FilePieChart, PlusCircle, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingStep } from "../Onboarding/OnboardingStep";
import { useSearchParams } from "next/navigation";

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

  const searchParams = useSearchParams();
  const obraParam = searchParams.get('obraId') as string;
  // @ts-ignore
  const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id);

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
              <span className="text-sm text-white w-70">
                {table.getFilteredSelectedRowModel().rows.length} seleccionados
              </span>
              <Separator className="bg-[#ffffff40] h-8 w-[1px]" />
            </div>
            <div className="flex items-center gap-2">
              {/* <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { }}
                  className="text-white hover:text-white/60"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Duplicar
                </Button> */}

              <Separator className="bg-[#ffffff40] h-8 w-[1px]" />

              <Button
                onClick={() => { }}
                className="text-red-200 hover:text-red-600"
              >
                <Trash2Icon className="h-4 w-4 mr-2" />
                Eliminar
              </Button>

              <Separator className="bg-[#ffffff40] h-8 w-[1px]" />
              <OnboardingStep
                stepOrder={4}
                set="crear-presupuesto"
                tooltipContent="Presupuesto"
                continueOnboarding={true}
                tooltipSide="top"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  href={`/obras/${obraParam}/create/presupuesto?selectedIds=${[...selectedIds].join(",")}`}
                  className="text-white hover:text-white/60"
                >
                  <FilePieChart className="h-4 w-4 mr-2" />
                  Presupuesto
                </Button>
              </OnboardingStep>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
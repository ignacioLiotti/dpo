'use client'

import React, { useEffect, useState, useCallback, Suspense, memo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, House, PanelsTopLeft, Box, FolderPlus, Save, FilePenLine, BookLock, BookIcon, BookLockIcon, FolderOpen, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSelectedItems } from '@/hooks/useQueries'
import { useObras } from '@/hooks/useObras'
import { usePresupuestos } from '@/hooks/usePresupuestos'
import { usePresupuestoData } from '@/hooks/usePresupuestoData'
import { MedicionesEditor } from '../../components/editores/MedicionesEditor'
import { PresupuestoEditor } from '../../components/editores/PresupuestoEditor'
import { Skeleton } from '@/components/ui/skeleton'

interface AddSectionDialogProps {
  onAdd: (sectionName: string) => void;
}

function AddSectionDialog({ onAdd }: AddSectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [sectionName, setSectionName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (sectionName.trim()) {
      onAdd(sectionName.trim())
      setSectionName('')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-full"
        >
          <Plus className="w-4 h-4" />
          Agregar Sección
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nueva Sección</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Nombre de la sección"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            autoFocus
          />
          <Button type="submit" className="w-full">
            Agregar Sección
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function PresupuestoPage() {
  const searchParams = useSearchParams();
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeView, setActiveView] = useState<'presupuesto' | 'mediciones'>('presupuesto')

  // Get the first obra
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const obraId = obras?.[0]?.id;

  // Get presupuestos for the obra
  const { data: presupuestos, isLoading: isLoadingPresupuestos } = usePresupuestos(obraId ?? 0);
  const presupuestoId = presupuestos?.[0]?.id;

  // Get detailed presupuesto data
  const { presupuesto, items, isLoading: isLoadingPresupuesto } =
    usePresupuestoData(presupuestoId?.toString());

  // Get selected items data
  const selectedIds = searchParams.get('selectedIds')?.split(',') || [];
  const { data: selectedItemsData, isLoading: isLoadingSelected } = useSelectedItems(selectedIds);

  const isLoading = isLoadingObras || isLoadingPresupuestos || isLoadingPresupuesto || isLoadingSelected;

  // Add scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial scroll position

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    );
  }

  if (!obras?.length) {
    return (
      <div className="container mx-auto p-4">
        <p>No obra available. Please create an obra first.</p>
      </div>
    );
  }

  if (!selectedItemsData && selectedIds.length > 0) {
    return (
      <div className="container mx-auto p-4">
        <p>No data available for the selected items.</p>
      </div>
    );
  }

  const pageData = selectedItemsData || {
    presupuestoData: {},
    allElements: [],
    mediciones: []
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs
        defaultValue="presupuesto"
        className={cn("sticky top-0 z-10 p-3 pt-5 -mt-5", isScrolled ? "-ml-20" : "w-1/2")}
        onValueChange={(value: any) => setActiveView(value as 'presupuesto' | 'mediciones')}
      >
        {!isScrolled ? (
          <TabsList>
            <motion.div
              key="expanded"
              className="bg-muted rounded-lg flex"
            >
              <span className='w-full'>
                <TabsTrigger value="presupuesto" className="py-2 w-full justify-start" asChild>
                  <motion.button className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                    "transition-all hover:text-muted-foreground",
                    "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                    "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                    "gap-1.5 group relative",
                  )}>
                    <motion.div layoutId="icon-1" className="flex-shrink-0">
                      <Calculator size={16} strokeWidth={2} aria-hidden="true" />
                    </motion.div>
                    <motion.div layoutId="text-1" className="flex-shrink-0">
                      Presupuesto
                    </motion.div>
                  </motion.button>
                </TabsTrigger>
              </span>
              <span className='w-full'>
                <TabsTrigger value="mediciones" className="py-2 w-full justify-start" asChild>
                  <motion.button className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                    "transition-all hover:text-muted-foreground",
                    "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                    "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                    "gap-1.5 group relative",
                  )}>
                    <motion.div layoutId="icon-2" className="flex-shrink-0">
                      <PanelsTopLeft size={16} strokeWidth={2} aria-hidden="true" />
                    </motion.div>
                    <motion.div layoutId="text-2" className="flex-shrink-0">
                      Mediciones
                    </motion.div>
                  </motion.button>
                </TabsTrigger>
              </span>
            </motion.div>
          </TabsList>
        ) : (
          <TabsList>
            <motion.div
              key="collapsed"
              className="bg-muted rounded-lg flex"
            >
              <TabsTrigger value="presupuesto" className="py-2" asChild>
                <motion.button className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                  "transition-all hover:text-muted-foreground",
                  "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                  "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                  "gap-1.5 group relative",
                )}>
                  <motion.div layoutId="icon-1" className="flex-shrink-0">
                    <Calculator size={16} strokeWidth={2} aria-hidden="true" />
                  </motion.div>
                </motion.button>
              </TabsTrigger>
              <TabsTrigger value="mediciones" className="py-2" asChild>
                <motion.button className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                  "transition-all hover:text-muted-foreground",
                  "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                  "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                  "gap-1.5 group relative",
                )}>
                  <motion.div layoutId="icon-2" className="flex-shrink-0">
                    <PanelsTopLeft size={16} strokeWidth={2} aria-hidden="true" />
                  </motion.div>
                </motion.button>
              </TabsTrigger>
            </motion.div>
          </TabsList>
        )}
      </Tabs>

      <AnimatePresence mode="wait">
        {activeView === 'presupuesto' ? (
          <PresupuestoEditor
            key="presupuesto"
            presupuestoData={pageData.presupuestoData}
            allElements={pageData.allElements}
          />
        ) : (
          <MedicionesEditor
            key="mediciones"
            initialMediciones={pageData.mediciones}
            presupuestoData={pageData.presupuestoData}
            obraId={obraId!}
            presupuestoId={presupuestoId?.toString() || '1'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EditableInput({
  value: initialValue,
  onChange,
  suffix = "",
  prefix = "",
  highlightChange = true,
}: {
  value: string | number;
  onChange: (val: string) => void;
  suffix?: string;
  prefix?: string;
  highlightChange?: boolean;
}) {
  const [value, setValue] = useState(String(initialValue));

  // Determine if the field was edited (only check if highlighting is enabled)
  const isEdited = highlightChange && String(initialValue) !== value;

  useEffect(() => {
    setValue(String(initialValue));
  }, [initialValue]);

  const handleBlur = () => {
    onChange(value);
  };

  const inputElement = (
    <input
      className={`border-b border-transparent group-hover:border-gray-300 group-focus:border-gray-300 focus:outline-none bg-transparent w-[50px] text-right focus-within:border-gray-300 ${isEdited ? "bg-yellow-100" : ""
        }`}
      value={value}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
    />
  );

  if (highlightChange && isEdited) {
    return (
      <div className="flex items-center justify-center gap-1">
        {prefix && <span className="text-sm text-gray-700">{prefix}</span>}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{inputElement}</TooltipTrigger>
            <TooltipContent side="top" className="px-2 py-1 text-xs">
              Original: {initialValue}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {suffix && <span className="text-sm text-gray-700">{suffix}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      {prefix && <span className="text-sm text-gray-700">{prefix}</span>}
      {inputElement}
      {suffix && <span className="text-sm text-gray-700">{suffix}</span>}
    </div>
  );
}



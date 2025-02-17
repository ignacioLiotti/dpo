'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { FilePenLine, BarChart } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { PresupuestoEditor } from '../../../components/editores/PresupuestoEditor'
import { MedicionesEditor } from '../../../components/editores/MedicionesEditor'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TableItem } from '../types'
import { useQuery } from '@tanstack/react-query'
import { Presupuesto, fetchPresupuesto } from '../hooks/usePresupuestoData'

type GroupedPresupuestoData = Record<string, TableItem[]>;

interface PresupuestoPageClientProps {
  id: string;
  initialPresupuesto: Presupuesto;
}

export function PresupuestoPageClient({ id, initialPresupuesto }: PresupuestoPageClientProps) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'normal' | 'preview' | 'medicion'>('normal')
  const [isScrolled, setIsScrolled] = useState(false)
  const [data, setData] = useState<GroupedPresupuestoData>({})

  const { data: presupuesto, isLoading, error } = useQuery({
    queryKey: ['presupuesto', id],
    queryFn: () => fetchPresupuesto(id),
    initialData: initialPresupuesto
  })

  // Update effect to use searchParams instead of params
  useEffect(() => {
    const tabParam = searchParams.get('tab') as 'normal' | 'preview' | 'medicion'
    if (tabParam && ['normal', 'preview', 'medicion'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Transform presupuesto data when it changes
  useEffect(() => {
    if (!presupuesto) return;
    setData(presupuesto.data);
  }, [presupuesto])

  // Update scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate grand total and section rubros
  const { grandTotal, sectionRubros } = React.useMemo(() => {
    if (!presupuesto) return { grandTotal: 0, sectionRubros: [] };

    const total = presupuesto.total;
    const rubros = Object.entries(data).map(([_, items]) => {
      return items.reduce((sum, item) => sum + item.totalPrice, 0) * 100 / total;
    });

    return { grandTotal: total, sectionRubros: rubros };
  }, [data, presupuesto]);

  // Calculate running total (IACUM) for each section
  const sectionIacums = React.useMemo(() => {
    if (!grandTotal) return [];

    let runningTotal = 0;
    return Object.entries(data).map(([_, items]) => {
      runningTotal += items.reduce((sum, item) => sum + item.totalPrice, 0);
      return (runningTotal * 100) / grandTotal;
    });
  }, [data, grandTotal]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Cargando...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error instanceof Error ? error.message : 'Error al cargar el presupuesto'}
      </div>
    )
  }

  if (!presupuesto) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Presupuesto no encontrado
      </div>
    )
  }

  return (
    <div className='flex items-start justify-center gap-8 relative'>
      <div className='flex flex-col gap-2 mb-16'>
        <AnimatePresence mode="wait">
          <Tabs
            value={activeTab}
            onValueChange={(value: string) => setActiveTab(value as 'normal' | 'preview' | 'medicion')}
            className={cn("sticky top-0 z-10 p-3 pt-5 -mt-5", isScrolled ? "-ml-20" : "w-1/2")}
          >
            {!isScrolled ? (
              <TabsList>
                <motion.div
                  key="expanded"
                  className="bg-muted rounded-lg flex"
                >
                  <span className='w-full'>
                    <TabsTrigger value="normal" className="py-2 w-full justify-start" asChild>
                      <motion.button className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                        "transition-all hover:text-muted-foreground",
                        "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                        "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                        "gap-1.5 group relative",
                      )}>
                        <motion.div layoutId="icon-1" className="flex-shrink-0">
                          <FilePenLine size={16} strokeWidth={2} aria-hidden="true" />
                        </motion.div>
                        <motion.div layoutId="text-1" className="flex-shrink-0">
                          <motion.span
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="ml-1.5"
                          >
                            Presupuesto
                          </motion.span>
                        </motion.div>
                      </motion.button>
                    </TabsTrigger>
                  </span>
                  <span className='w-full'>
                  </span>
                  <span className='w-full'>
                    <TabsTrigger value="medicion" className="py-2 w-full justify-start" asChild>
                      <motion.button className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                        "transition-all hover:text-muted-foreground",
                        "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                        "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                        "gap-1.5 group relative",
                      )}>
                        <motion.div layoutId="icon-3" className="flex-shrink-0">
                          <BarChart size={16} strokeWidth={2} aria-hidden="true" />
                        </motion.div>
                        <motion.div layoutId="text-3" className="flex-shrink-0">
                          <motion.span
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="ml-1.5"
                          >
                            Mediciones
                          </motion.span>
                        </motion.div>
                      </motion.button>
                    </TabsTrigger>
                  </span>
                </motion.div>
              </TabsList>
            ) : (
              <TabsList className="flex-col">
                <motion.div
                  key="collapsed"
                  layoutId="tabs-list"
                  transition={{
                    duration: 0.3,
                    width: { duration: 0.2, ease: "easeInOut" },
                    height: { duration: 0.2, ease: "easeInOut", delay: 0.1 }
                  }}
                  className='bg-muted rounded-lg flex flex-col'
                >
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <TabsTrigger value="normal" className="py-3" asChild>
                            <motion.button className={cn(
                              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                              "transition-all hover:text-muted-foreground",
                              "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                              "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                              "gap-1.5 group relative",
                            )}>
                              <motion.div layoutId="icon-1" className="flex-shrink-0">
                                <FilePenLine size={16} strokeWidth={2} aria-hidden="true" />
                              </motion.div>
                            </motion.button>
                          </TabsTrigger>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="px-2 py-1 text-xs">
                        Presupuesto
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <TabsTrigger value="medicion" className="py-3" asChild>
                            <motion.button className={cn(
                              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                              "transition-all hover:text-muted-foreground",
                              "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                              "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                              "gap-1.5 group relative",
                            )}>
                              <motion.div layoutId="icon-3" className="flex-shrink-0">
                                <BarChart size={16} strokeWidth={2} aria-hidden="true" />
                              </motion.div>
                            </motion.button>
                          </TabsTrigger>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="px-2 py-1 text-xs">
                        Mediciones
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              </TabsList>
            )}
          </Tabs>
        </AnimatePresence>

        {activeTab === 'medicion' ? (
          <MedicionesEditor
            medicion={{
              id: 0,
              month: new Date().toISOString(),
              measurements: {}
            }}
            presupuestoData={Object.entries(data).reduce((acc, [section, items]) => {
              acc[section] = items.map(item => ({
                id: String(item.id),
                name: item.name,
                totalPrice: item.totalPrice
              }))
              return acc
            }, {} as Record<string, { id: string; name: string; totalPrice: number }[]>)}
            display={false}
            obraId={presupuesto.obra_id}
          />
        ) : (
          <PresupuestoEditor
            presupuestoData={presupuesto.data}
            allElements={[]}
            display={activeTab === 'preview'}
          />
        )}
      </div>
    </div>
  )
} 
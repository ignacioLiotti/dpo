'use client'

import React, { useState, useEffect } from 'react'
import { Plus, FolderPlus, Save, FilePenLine, BookLock, BookIcon, BookLockIcon, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PresupuestoSection } from '@/components/editores/PresupuestoSection'
import { SearchDialog } from '@/components/SearchDialog'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useSearchParams } from 'next/navigation'
import { useObra } from '@/app/providers/ObraProvider'
import type { TableItem, GroupedData, Obra, Presupuesto } from '@/types'
import { EditableInput } from '@/components/Table/EditableInput'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PresupuestoEditorProps {
  presupuestoData: Record<string, TableItem[]>;
  allElements: TableItem[];
  display?: boolean;
  obraId?: string | number;
  obraData?: Obra;
  onUpdate?: (presupuesto: Presupuesto) => void;
}

export function PresupuestoEditor({
  presupuestoData = {},
  allElements = [],
  display = false,
  obraId,
  obraData,
  onUpdate
}: PresupuestoEditorProps) {
  const searchParams = useSearchParams()
  const idsParam = searchParams.get('selectedIds') ?? ''
  const ids = React.useMemo(() => idsParam.split(',').filter(Boolean), [idsParam])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Record<string, TableItem[]>>(presupuestoData)
  const [newSections, setNewSections] = useState<Set<string>>(new Set())
  const [storedElements, setStoredElements] = useState<TableItem[]>(allElements)
  const [previewVersion, setPreviewVersion] = useState<string | boolean>('false')
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const { state, dispatch } = useObra()

  // Handle global element selection
  const handleGlobalElementSelect = (elements: TableItem[]) => {
    elements.forEach(element => {
      if (!element.targetSection) {
        setError('Por favor seleccione una sección para todos los elementos')
        return
      }
      addElementToSection(element.targetSection, element)
    })
    setIsGlobalSearchOpen(false)
  }

  // Handle adding new section
  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSectionName.trim()) {
      addNewSection(newSectionName.trim())
      setNewSectionName('')
      setIsAddSectionOpen(false)
    }
  }

  // -----------------------------
  //   Update Data in state
  // -----------------------------
  const updateData = (
    tag: string,
    itemId: string | number,
    key: keyof TableItem,
    newValue: string
  ) => {
    if (display) return;

    setData(prevData => {
      const newData = { ...prevData };
      const items = [...(newData[tag] || [])];
      const itemIndex = items.findIndex(item => String(item.id) === String(itemId));

      if (itemIndex === -1) return prevData;

      const item = { ...items[itemIndex] };
      const numericValue = Number(newValue) || 0;

      // Update the specific field
      if (key === 'quantity' || key === 'unitPrice') {
        item[key] = numericValue;
        item.totalPrice = item.quantity * item.unitPrice;
      } else if (key === 'name' || key === 'unit' || key === 'category') {
        // Handle string properties
        item[key] = newValue;
      }

      items[itemIndex] = item;
      newData[tag] = items;

      return newData;
    });
  }

  // Add element to a section
  const addElementToSection = (tag: string, element: TableItem) => {
    if (display) return;

    setData(prevData => {
      const newData = { ...prevData };
      const items = [...(newData[tag] || [])];

      // Check if element already exists in this section
      const existingIndex = items.findIndex(item => String(item.id) === String(element.id));
      if (existingIndex !== -1) return prevData;

      items.push({
        ...element,
        category: tag
      });

      newData[tag] = items;
      return newData;
    });
  }

  // -----------------------------
  //   Delete row from a tag
  // -----------------------------
  const handleDeleteRow = (tag: string, itemId: string | number) => {
    if (display) return;

    setData(prevData => {
      const newData = { ...prevData };
      const items = newData[tag].filter(item => String(item.id) !== String(itemId));
      newData[tag] = items;
      return newData;
    });
  }

  // -----------------------------
  //   Handle Form Submit
  // -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (display || !obraId) return;

    setLoading(true);
    setError(null);

    try {
      // Calculate total
      const total = Object.values(data).reduce((total, items) => {
        return total + items.reduce((sectionTotal, item) =>
          sectionTotal + ((item.quantity || 0) * (item.unitPrice || 0)), 0
        );
      }, 0);

      const presupuestoData = {
        obraId: Number(obraId),
        nombre: "Presupuesto " + new Date().toLocaleDateString(),
        total: Number(total.toFixed(2)),
        data
      };

      const response = await fetch('/api/presupuestos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(presupuestoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar los datos.');
      }

      const newPresupuesto = await response.json();

      // Update the UI with the new presupuesto
      dispatch({
        type: 'ADD_PRESUPUESTO',
        payload: newPresupuesto
      });

      onUpdate?.(newPresupuesto);
      alert('Presupuesto guardado exitosamente!');
    } catch (error) {
      console.error('Error saving data:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar los datos.');
      alert(error instanceof Error ? error.message : 'Error al guardar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const addNewSection = (sectionName: string) => {
    // Create new section
    const newData = { ...data }
    newData[sectionName] = []

    // Sort sections alphabetically
    const sortedData = Object.fromEntries(
      Object.entries(newData).sort(([a], [b]) => a.localeCompare(b))
    )

    setData(sortedData)
    setNewSections(prev => new Set(prev).add(sectionName))

    // Scroll to new section after a brief delay to ensure render
    setTimeout(() => {
      const sectionElement = document.getElementById(`section-${sectionName}`)
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        console.error(`Section with id section-${sectionName} not found`)
      }
    }, 100)
  }

  // Calculate grand total and section rubros together for better accuracy
  const { grandTotal, sectionRubros } = React.useMemo(() => {
    const total = Object.entries(data).reduce((total, [_, items]) => {
      if (!Array.isArray(items)) return total;
      return total + (items as TableItem[]).reduce((sectionTotal, item) =>
        sectionTotal + ((item.quantity || 0) * (item.unitPrice || 0)), 0
      );
    }, 0);

    const rubros = Object.entries(data).map(([_, items]) => {
      if (!Array.isArray(items)) return 0;

      const sectionTotal = (items as TableItem[]).reduce((sum, item) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        return sum + (itemTotal || 0);
      }, 0);

      return total > 0 ? (sectionTotal * 100 / total) : 0;
    });

    return { grandTotal: total, sectionRubros: rubros };
  }, [data]);

  // Calculate running total (IACUM) for each section
  const sectionIacums = React.useMemo(() => {
    let runningTotal = 0;
    return sectionRubros.map(rubro => {
      runningTotal += (rubro || 0); // Ensure we handle null/undefined values
      return Number(runningTotal.toFixed(2)); // Round to 2 decimal places
    });
  }, [sectionRubros]);

  // Update the scroll detection useEffect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial scroll position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // -----------------------------
  //   Delete section
  // -----------------------------
  const handleDeleteSection = (tag: string) => {
    setData(prev => {
      const newData = { ...prev };
      delete newData[tag];
      return newData;
    });
    // Also remove from newSections if it was a newly added section
    setNewSections(prev => {
      const updated = new Set(prev);
      updated.delete(tag);
      return updated;
    });
  };

  // -----------------------------
  //   Render
  // -----------------------------
  return (
    <div className='flex items-start justify-center gap-8 relative'>
      <div className='flex flex-col gap-2 mb-16'>
        {!display && (
          <AnimatePresence mode="wait">
            <Tabs defaultValue="tab-1" className={cn("sticky top-0 z-10 p-3 pt-5 -mt-5", isScrolled ? "-ml-20" : "w-1/2")}>
              {!isScrolled ? (
                <TabsList>
                  <motion.div
                    key="expanded"
                    className="bg-muted rounded-lg flex"
                  >
                    <span className='w-full'>
                      <TabsTrigger value="tab-1" className="py-2 w-full justify-start" asChild onClick={() => setPreviewVersion('false')}>
                        <motion.button
                          className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium outline-offset-2",
                            "transition-all hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
                            "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                            "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                            // custom
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
                              Modo Editable
                            </motion.span>
                          </motion.div>
                        </motion.button>
                      </TabsTrigger>
                    </span>
                    <span className='w-full'>
                      <TabsTrigger value="tab-2" className="py-2 w-full justify-start" asChild onClick={() => setPreviewVersion('true')}>
                        <motion.button
                          className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium outline-offset-2",
                            "transition-all hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
                            "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                            "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                            // custom
                            "gap-1.5 group relative",
                          )}>
                          <motion.div layoutId="icon-2" className="flex-shrink-0">
                            <BookIcon size={16} strokeWidth={2} aria-hidden="true" />
                          </motion.div>
                          <motion.div layoutId="text-2" className="flex-shrink-0">
                            <motion.span
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="ml-1.5"
                            >
                              Vista Previa (Total)
                            </motion.span>
                          </motion.div>
                        </motion.button>
                      </TabsTrigger>
                    </span>
                    <span className='w-full'>
                      <TabsTrigger value="tab-3" className="py-2 w-full justify-start" asChild onClick={() => setPreviewVersion('parcial')}>
                        <motion.button
                          className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium outline-offset-2",
                            "transition-all hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
                            "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                            "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                            // custom
                            "gap-1.5 group relative",
                          )}>
                          <motion.div layoutId="icon-3" className="flex-shrink-0">
                            <BookLockIcon size={16} strokeWidth={2} aria-hidden="true" />
                          </motion.div>
                          <motion.div layoutId="text-3" className="flex-shrink-0">
                            <motion.span
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="ml-1.5"
                            >
                              Vista Previa (Parcial)
                            </motion.span>
                          </motion.div>
                        </motion.button>
                      </TabsTrigger>
                    </span>
                    <span className='w-full'>

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
                            <TabsTrigger value="tab-1" className="py-3" asChild onClick={() => setPreviewVersion('false')}>
                              <motion.button
                                className={cn(
                                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium outline-offset-2",
                                  "transition-all hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
                                  "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                                  "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                                  // custom
                                  "gap-1.5 group relative",
                                )}>
                                <motion.div layoutId="icon-1" className="flex-shrink-0">
                                  <FilePenLine size={16} strokeWidth={2} aria-hidden="true" />
                                </motion.div>
                                <motion.div layoutId="text-1" className="flex-shrink-0 -mr-1.5">
                                  <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="hidden"
                                  />
                                </motion.div>
                              </motion.button>
                            </TabsTrigger>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="px-2 py-1 text-xs">
                          Modo Editable
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <TabsTrigger value="tab-2" className="py-3" asChild onClick={() => setPreviewVersion('true')}>
                              <motion.button
                                className={cn(
                                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium outline-offset-2",
                                  "transition-all hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
                                  "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                                  "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                                  // custom
                                  "gap-1.5 group relative",
                                )}>
                                <motion.div layoutId="icon-2" className="flex-shrink-0">
                                  <BookIcon size={16} strokeWidth={2} aria-hidden="true" />
                                </motion.div>
                                <motion.div layoutId="text-2" className="flex-shrink-0 -mr-1.5">
                                  <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="hidden"
                                  />
                                </motion.div>
                              </motion.button>
                            </TabsTrigger>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="px-2 py-1 text-xs">
                          Vista Previa (Total)
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <TabsTrigger value="tab-3" className="py-3" asChild onClick={() => setPreviewVersion('parcial')}>
                              <motion.button
                                className={cn(
                                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium outline-offset-2",
                                  "transition-all hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
                                  "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                                  "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                                  // custom
                                  "gap-1.5 group relative",
                                )}>
                                <motion.div layoutId="icon-3" className="flex-shrink-0">
                                  <BookLockIcon size={16} strokeWidth={2} aria-hidden="true" />
                                </motion.div>
                                <motion.div layoutId="text-3" className="flex-shrink-0 -mr-1.5">
                                  <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.15 }}
                                    animate={{ opacity: 0, width: 0 }}
                                    className="hidden"
                                  />
                                </motion.div>
                              </motion.button>
                            </TabsTrigger>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="px-2 py-1 text-xs">
                          Vista Previa (Parcial)
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <TabsTrigger value="tab-4" className="py-3" asChild onClick={() => setPreviewVersion('medicion')}>
                              <motion.button
                                className={cn(
                                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium outline-offset-2",
                                  "transition-all hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70",
                                  "disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground",
                                  "data-[state=active]:shadow-sm data-[state=active]:shadow-black/5",
                                  // custom
                                  "gap-1.5 group relative",
                                )}>
                                <motion.div layoutId="icon-4" className="flex-shrink-0">
                                  <FilePenLine size={16} strokeWidth={2} aria-hidden="true" />
                                </motion.div>
                                <motion.div layoutId="text-4" className="flex-shrink-0 -mr-1.5">
                                  <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.15 }}
                                    animate={{ opacity: 0, width: 0 }}
                                    className="hidden"
                                  />
                                </motion.div>
                              </motion.button>
                            </TabsTrigger>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="px-2 py-1 text-xs">
                          Medición
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                </TabsList>
              )}
            </Tabs>
          </AnimatePresence>
        )}

        {/* Global Search Dialog */}
        <SearchDialog
          isOpen={isGlobalSearchOpen}
          onOpenChange={setIsGlobalSearchOpen}
          onElementSelect={handleGlobalElementSelect}
          sections={Object.keys(data)}
          elements={storedElements}
        />

        <form onSubmit={handleSubmit} className="max-w-[1000px] min-w-[1000px] p-6 bg-white rounded-xl shadow-lg relative border">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Ministerio de Obras y Servicios Públicos
            </h1>
            <Card className="text-gray-600 flex flex-col justify-center items-start p-2 px-4">
              <p className="mb-2">{`Obra: `}
                <b>
                  {obraData?.nombre || 'Sin nombre'}
                  <span className="text-xs text-gray-500 ml-2">
                    ID: {obraId || 'N/A'}
                  </span>
                </b>
              </p>
              <p>{`Localidad: `}
                <b>
                  {obraData?.localidad || 'Sin ubicación'}
                </b>
              </p>
            </Card>

            <h2 className="mt-4 text-lg font-bold uppercase underline">
              Planilla de Presupuesto e Incidencias
            </h2>
          </div>

          {loading && <p className="text-center text-gray-600">Cargando...</p>}
          {error && <p className="text-center text-red-600">{error}</p>}

          {/* The main table */}
          {!loading && !error && (
            <div className="rounded-lg border-none border-gray-200 space-y-8">
              {Object.entries(data).map(([tag, items], tagIndex) => (
                <PresupuestoSection
                  key={tag}
                  tag={tag}
                  tagIndex={tagIndex}
                  items={items}
                  previewVersion={previewVersion}
                  grandTotal={grandTotal}
                  sectionRubros={sectionRubros}
                  sectionIacums={sectionIacums}
                  addElementToSection={addElementToSection}
                  updateData={updateData}
                  handleDeleteRow={handleDeleteRow}
                  handleDeleteSection={handleDeleteSection}
                  isNewSection={newSections.has(tag)}
                  allElements={storedElements}
                  display={display}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="text-sm text-center mt-2">
            <p>Página 1 de 1</p>
          </div>
        </form>
      </div>

      {!display && (
        <div className='flex flex-col justify-between gap-8 mt-16 sticky top-5 z-10'>
          <div className='flex flex-col gap-2'>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 w-full justify-start px-3"
                >
                  <FolderOpen className="w-4 h-4" />
                  Seleccionar Obra
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Seleccionar Obra</DialogTitle>
                </DialogHeader>

                <DialogFooter>
                  <Button type="button">
                    Confirmar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              type="button"
              variant="secondary"
              className="h-9 w-full justify-start px-3"
              onClick={() => setIsGlobalSearchOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Agregar Elemento
            </Button>
            <Dialog open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 w-full justify-start px-3"
                >
                  <FolderPlus className="w-4 h-4" />
                  Agregar Sección
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Nueva Sección</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSection} className="space-y-4">
                  <Input
                    placeholder="Nombre de la sección"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    autoFocus
                  />
                  <Button type="submit" className="w-full">
                    Agregar Sección
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Button
            type="submit"
            variant="default"
            className="h-9 w-full justify-start px-3"
            onClick={handleSubmit}
          >
            <Save className="w-4 h-4" />
            Guardar Presupuesto
          </Button>
        </div>
      )}
    </div>
  )
}
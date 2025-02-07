'use client'

import React, { useEffect, useState, useCallback, Suspense, memo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, House, PanelsTopLeft, Box, FolderPlus, Save, FilePenLine, BookLock, BookIcon, BookLockIcon, FolderOpen } from "lucide-react"
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
import { PresupuestoSection } from '@/components/presupuesto/PresupuestoSection'
import { SearchDialog } from '@/components/presupuesto/SearchDialog'
import { debounce } from 'lodash'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Remove SWR import and add localStorage helper functions
const CACHE_KEY_PREFIX = 'presupuesto_cache_'
const CACHE_DURATION = 1000 * 60 * 30 // 30 minutes

const getCacheKey = (ids: string[]) => `${CACHE_KEY_PREFIX}${ids.join(',')}`

const getFromCache = (key: string) => {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    const { data, timestamp } = JSON.parse(item)
    const now = new Date().getTime()

    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key)
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

const saveToCache = (key: string, data: any) => {
  try {
    const item = {
      data,
      timestamp: new Date().getTime()
    }
    localStorage.setItem(key, JSON.stringify(item))
  } catch (error) {
    console.error('Error saving to cache:', error)
  }
}

interface TagObject {
  tags: {
    name: string;
  };
}

interface TableItem {
  id: string | number
  name: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  price: number
  category: string
  accumulated?: string | number
  parcial?: string | number
  rubro?: string | number
  element_tags?: { tags: { name: string } }[]
  originalUnit?: string
  originalQuantity?: number
  originalUnitPrice?: number
  targetSection?: string
  nombre?: string // Add this for backward compatibility
}

interface GroupedData {
  [tag: string]: TableItem[]
}

interface AddSectionDialogProps {
  onAdd: (sectionName: string) => void
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

function PresupuestoContent() {
  const searchParams = useSearchParams()
  const idsParam = searchParams.get('selectedIds') ?? ''
  const ids = React.useMemo(() => idsParam.split(',').filter(Boolean), [idsParam])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<GroupedData>({})
  const [newSections, setNewSections] = useState<Set<string>>(new Set())
  const [allElements, setAllElements] = useState<TableItem[]>([])
  const [previewVersion, setPreviewVersion] = useState<string | boolean>('false')
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

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

  // Fetch all elements on mount
  useEffect(() => {
    const fetchElements = async () => {
      try {
        const response = await fetch('/api/presupuestos/tableData')
        if (!response.ok) throw new Error('Error al cargar los elementos.')
        const elements = await response.json()

        const elementsAsArray = Object.values(elements).flat()

        console.log('elementsAsArray', elementsAsArray)
        console.log('ids', ids)
        // Filter elements based on selectedIds
        const filteredElements = elementsAsArray.filter((element: any) => {
          return ids.includes(String(element.id));
        });

        // Transform only the filtered elements
        console.log('filteredElements', filteredElements)
        const transformedElements = filteredElements.map((element: any) => ({
          id: element.id,
          name: element.nombre || element.name || 'Sin descripción',
          unit: element.unidad || element.unit || '',
          quantity: element.cantidad || 0,
          unitPrice: element.precio || element.price || 0,
          totalPrice: (element.cantidad || 0) * (element.precio || 0),
          price: element.precio || element.price || 0,
          category: element.category || 'Sin categoría',
          parcial: 0,
          rubro: 0,
          accumulated: 0,
        }))

        // Group filtered elements by their tags
        const groupedElements = transformedElements.reduce((acc: GroupedData, element: TableItem) => {
          if (element.category) {
            const tagName = element.category
            if (!acc[tagName]) {
              acc[tagName] = []
            }
            acc[tagName].push(element)
          }
          return acc
        }, {})

        setAllElements(elementsAsArray as TableItem[])
        console.log('groupedElements', groupedElements)
        setData(groupedElements)
      } catch (err) {
        console.error('Error fetching elements:', err)
        setError('Error al cargar los elementos disponibles.')
      }
    }
    fetchElements()
  }, [ids])

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem('presupuesto_table_data')
    console.log('savedData', savedData)
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setData(parsedData)
      } catch (error) {
        console.error('Error loading data from localStorage:', error)
      }
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(data).length > 0) {
      localStorage.setItem('presupuesto_table_data', JSON.stringify(data))
    }
  }, [data])

  // -----------------------------
  //   Update Data in state
  // -----------------------------
  const updateData = (
    tag: string,
    itemId: string | number,
    key: keyof TableItem,
    newValue: string
  ) => {
    setData(prev => {
      const newData = { ...prev }
      const arr = newData[tag] || []
      const itemIndex = arr.findIndex(it => String(it.id) === String(itemId))
      if (itemIndex > -1) {
        const oldItem = arr[itemIndex]
        newData[tag] = [
          ...arr.slice(0, itemIndex),
          { ...oldItem, [key]: newValue },
          ...arr.slice(itemIndex + 1),
        ]
      }
      return newData
    })
  }

  // Add element to a section
  const addElementToSection = (tag: string, element: any) => {
    setData(prev => {
      const newData = { ...prev }
      if (!newData[tag]) {
        newData[tag] = []
      }
      newData[tag] = [
        ...newData[tag],
        {
          id: element.id,
          name: element.nombre || element.name || 'Sin descripción',
          unit: element.unidad || element.unit || '',
          quantity: element.cantidad || 0,
          unitPrice: element.precio || element.price || 0,
          totalPrice: (element.cantidad || 0) * (element.precio || 0),
          price: element.precio || element.price || 0,
          category: element.category || 'Sin categoría',
          parcial: 0,
          rubro: 0,
          accumulated: 0,
        },
      ]
      return newData
    })
  }

  // -----------------------------
  //   Delete row from a tag
  // -----------------------------
  const handleDeleteRow = (tag: string, itemId: string | number) => {
    setData(prev => {
      const newData = { ...prev }
      newData[tag] = newData[tag]?.filter(item => String(item.id) !== String(itemId)) || []
      return newData
    })
  }

  // -----------------------------
  //   Handle Form Submit
  // -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Assume 'data' is your form data state
    console.log('Original data:', data);

    // Inject obraId: 100 into the data
    const dataWithObraId = {
      data: { ...data },
      obraId: 781, // Adding default obraId
    };

    console.log('Data with obraId:', dataWithObraId);

    // Serialize the data to JSON
    const jsonData = JSON.stringify(dataWithObraId);
    console.log('Serialized JSON:', jsonData);

    try {
      const response = await fetch('/api/presupuestos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar los datos.');
      }

      const result = await response.json();
      console.log('Save successful:', result);
      // Optionally, show a success message to the user
      alert('Presupuesto creado exitosamente!');
    } catch (error) {
      console.error('Error saving data:', error);
      setError('Error al guardar los datos.');
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
    const total = Object.values(data).reduce((total, items) => {
      if (!Array.isArray(items)) return total;
      return total + items.reduce((sectionTotal, item) =>
        sectionTotal + ((item.quantity || 0) * (item.unitPrice || 0)), 0
      );
    }, 0);

    const rubros = Object.entries(data).map(([tag, items]) => {
      if (!Array.isArray(items)) return 0;

      const sectionTotal = items.reduce((sum, item) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        // Avoid division by zero and ensure proper percentage calculation
        return sum + (itemTotal || 0);
      }, 0);

      // Calculate percentage only if there's a valid total
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

  console.log('data', data)

  // -----------------------------
  //   Render
  // -----------------------------
  return (
    <div className='flex items-start justify-center gap-8 relative'>
      <div className='flex flex-col gap-2 mb-16'>
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
                    {/* <TabsTrigger value="tab-4" className="py-2 w-full justify-start" asChild onClick={() => setPreviewVersion('medicion')}>
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
                        <motion.div layoutId="text-4" className="flex-shrink-0">
                          <motion.span
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="ml-1.5"
                          >
                            Medición
                          </motion.span>
                        </motion.div>
                      </motion.button>
                    </TabsTrigger> */}
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

        {/* Global Search Dialog */}
        <SearchDialog
          isOpen={isGlobalSearchOpen}
          onOpenChange={setIsGlobalSearchOpen}
          onElementSelect={handleGlobalElementSelect}
          sections={Object.keys(data)}
          elements={allElements}
        />

        <form className="max-w-[1000px] min-w-[1000px] p-6 bg-white rounded-xl shadow-lg relative border">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Ministerio de Obras y Servicios Públicos
            </h1>
            <Card className="text-gray-600 flex flex-col justify-center items-start p-2 px-4">
              <p className="mb-2">{`Obra: `}
                <b>
                  COMISARIA LAGUNA BRAVA - Obra Nueva 1226
                </b>
              </p>
              <p>{`Ubicacion: `}
                <b>
                  CORRIENTES CAPITAL
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
                  isNewSection={newSections.has(tag)}
                  allElements={allElements}
                  highlightChanges={previewVersion === 'false'}
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
    </div>
  )
}

// Main component
export default function PresupuestoPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PresupuestoContent />
    </Suspense>
  )
}

/**
 * A simple inline-edit <input> cell that highlights the field if the user edits it
 * and shows a tooltip with the original value.
 *
 * The new prop `highlightChange` tells the component whether to highlight modifications.
 */
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



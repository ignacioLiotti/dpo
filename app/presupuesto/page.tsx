'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

import { Card } from '@/components/ui/card'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Box, House, PanelsTopLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PresupuestoSection } from '@/components/presupuesto/PresupuestoSection'

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
  element_tags?: TagObject[]
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

// Separate component for search params
function PresupuestoContent() {
  const searchParams = useSearchParams()
  const idsParam = searchParams.get('selectedIds') ?? ''
  const ids = React.useMemo(() => idsParam.split(',').filter(Boolean), [idsParam])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<GroupedData>({})
  const [newSections, setNewSections] = useState<Set<string>>(new Set())
  const [allElements, setAllElements] = useState<any[]>([])
  const [previewVersion, setPreviewVersion] = useState<string | boolean>('false')

  // Fetch all elements on mount
  useEffect(() => {
    const fetchElements = async () => {
      try {
        const response = await fetch('/api/presupuestos/tableData')
        if (!response.ok) throw new Error('Error al cargar los elementos.')
        const elements = await response.json()

        const combined = Object.values(elements).flat()
          .filter(element => element && typeof element === 'object')
        setAllElements(combined)
      } catch (err) {
        console.error('Error fetching elements:', err)
        setError('Error al cargar los elementos disponibles.')
      }
    }
    fetchElements()
  }, [])

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem('presupuesto_table_data')
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
      obraId: 15, // Adding default obraId
    };

    console.log('Data with obraId:', dataWithObraId);

    // Serialize the data to JSON
    const jsonData = JSON.stringify(dataWithObraId);
    console.log('Serialized JSON:', jsonData);

    try {
      const response = await fetch('/api/presupuestos/tableData', {
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

  // Calculate grand total (sum of all sections total price)
  const grandTotal = React.useMemo(() => {
    return Object.values(data).reduce((total, items) => {
      if (!Array.isArray(items)) return total;
      return total + items.reduce((sectionTotal, item) =>
        sectionTotal + ((item.quantity || 0) * (item.unitPrice || 0)), 0
      );
    }, 0);
  }, [data]);

  // Calculate Rubro totals for each section
  const sectionRubros = React.useMemo(() => {
    return Object.entries(data).map(([tag, items]) => {
      if (!Array.isArray(items)) return 0;
      const sectionTotal = items.reduce((sum, item) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        return sum + (grandTotal ? (itemTotal * 100 / grandTotal) : 0);
      }, 0);
      return sectionTotal;
    });
  }, [data, grandTotal]);

  // Calculate running total (IACUM) for each section
  const sectionIacums = React.useMemo(() => {
    let runningTotal = 0;
    return sectionRubros.map(rubro => {
      runningTotal += rubro;
      return runningTotal;
    });
  }, [sectionRubros]);

  // -----------------------------
  //   Render
  // -----------------------------
  return (
    <div className='flex items-start justify-center gap-4'>
      <Tabs defaultValue="tab-1" orientation="vertical" className="flex gap-2 mt-4">
        <TabsList className="flex-col">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild >
                <span>
                  <TabsTrigger value="tab-1" className="py-3" onClick={() => setPreviewVersion('false')}>
                    <House size={16} strokeWidth={2} aria-hidden="true" />
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
              <TooltipTrigger asChild >
                <span>
                  <TabsTrigger value="tab-2" className="group py-3" onClick={() => setPreviewVersion('true')}>
                    <span className="relative flex justify-center items-center gap-2">
                      <PanelsTopLeft size={16} strokeWidth={2} aria-hidden="true" />
                      {/* <Badge className="absolute -top-2.5 left-full min-w-5 justify-center -translate-x-1.5 border-background px-0.5 text-[10px]/[.875rem] transition-opacity group-data-[state=inactive]:opacity-50">
                        3
                      </Badge> */}
                      {/* Projects */}
                    </span>
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" className="px-2 py-1 text-xs" >
                Vista Previa (Total)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <TabsTrigger value="tab-3" className="py-3" onClick={() => setPreviewVersion('parcial')}>
                    <Box size={16} strokeWidth={2} aria-hidden="true" />
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent side="right" className="px-2 py-1 text-xs">
                Vista Previa (Parcial)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TabsList>
      </Tabs>
      <form onSubmit={handleSubmit} className="max-w-[1000px] min-w-[860px] p-6 bg-white rounded-xl shadow-lg relative">
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
            <AddSectionDialog onAdd={addNewSection} />

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
              />
            ))}
          </div>
        )}

        {/* Submit Button */}
        {!loading && !error && (
          <div className="mt-6">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg
                       transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Guardar Cambios
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-sm text-center mt-2">
          <p>Página 1 de 1</p>
        </div>
      </form>
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
 * A simple inline-edit <input> cell
 */
function EditableInput({
  value: initialValue,
  onChange,
  suffix = "",
  prefix = "",
}: {
  value: string | number
  onChange: (val: string) => void
  suffix?: string
  prefix?: string
}) {
  const [value, setValue] = useState(String(initialValue))

  useEffect(() => {
    setValue(String(initialValue))
  }, [initialValue])

  const handleBlur = () => {
    onChange(value)
  }

  return (
    <div className="flex items-center justify-center gap-1">
      {prefix && <span className="text-sm text-gray-700">{prefix}</span>}
      <input
        className="border-b border-transparent group-hover:border-gray-300 group-focus:border-gray-300 focus:outline-none bg-transparent w-[50px] text-right focus-within:border-gray-300"
        value={value}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
      />
      {suffix && <span className="text-sm text-gray-700">{suffix}</span>}
    </div>
  )
}

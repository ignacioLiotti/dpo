'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Check, Plus, Trash2, FilePenLine, BookIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { debounce } from 'lodash'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Box, House, PanelsTopLeft } from "lucide-react";
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Save } from "lucide-react"
import { PresupuestoSection } from '@/components/presupuesto/PresupuestoSection'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import dynamic from 'next/dynamic'
import { GroupedPresupuestoData, GroupedMedicionData, PresupuestoItem } from '../types'

// Dynamically import MedicionSection to prevent mixing of types
const MedicionSection = dynamic(() => import('./MedicionSection'), {
  loading: () => <div>Cargando medición...</div>
})

interface TableItem {
  id: string | number
  name: string
  unit: string
  price: number
  category: string
  accumulated?: string | number
  parcial?: string | number
  rubro?: string | number
  element_tags?: Array<{ tags: { name: string } }>
  quantity?: number
  unitPrice?: number
  totalPrice?: number
  anterior?: number
  presente?: number
  acumulado?: number
  originalUnit?: string
}

interface GroupedData {
  [tag: string]: TableItem[]
}

interface MedicionData {
  fecha: string
  items: {
    itemId: string | number
    anterior: number
    presente: number
    acumulado: number
  }[]
}

interface Medicion {
  id: number
  presupuestoId: number
  data: MedicionData
  createdAt: string
  updatedAt: string
}

const testData = {
  "MATERIALES ELECTRICOS": [
    {
      "id": 1,
      "name": "VIGUETAS Y LADRILLOS ",
      "unit": "NULL",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 2,
      "name": "Viguetas pretensadas serie 1 (SERIE ASTER 2 ml)",
      "unit": "C/U",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 3,
      "name": "Viguetas pretensadas serie 2 (SERIE ASTER 3 ml)",
      "unit": "C/U",
      "price": 0,
      "category": "Sin categoría",
      "parcial": "10",
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 5,
      "name": "Viguetas pretensadas serie 5 (SERIE \"C\" 5 ml)",
      "unit": "C/U",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 6,
      "name": "Viguetas pretensadas serie 7 (SERIE \"D\" 6ml)",
      "unit": "C/U",
      "price": 0,
      "category": "Sin categoría",
      "parcial": "10",
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 8,
      "name": "Ladrillos cer?micos de 9,5 x 25 x 40 cm",
      "unit": "C/U",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 9,
      "name": "Ladrillos cer?micos de 12,5 x 25 x 40 cm",
      "unit": "C/U",
      "price": 0,
      "category": "Sin categoría",
      "parcial": "10",
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 10,
      "name": "Ladrillos de poliest. expandido de 12 x 100 x 40 cm",
      "unit": "C/U",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    }
  ],
  "Disyuntores diferenciales": [
    {
      "id": 16,
      "name": "Arrancador para corriente alterna de 20 w",
      "unit": "c/u",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 17,
      "name": "Arrancador para corriente alterna de 40 w",
      "unit": "c/u",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    }
  ],
  "MATERIALES CA├æERIA CLOACAL Y AGUA": [
    {
      "id": 1,
      "name": "DEMOLICION Y RETIROS",
      "unit": "NULL",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 2,
      "name": "Demolici?n techo F?C? ",
      "unit": "m2",
      "price": 0,
      "category": "Sin categoría",
      "parcial": "10",
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 3,
      "name": "Demolici?n techo H?G? ",
      "unit": "m2",
      "price": 0,
      "category": "Sin categoría",
      "parcial": "10",
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 5,
      "name": "Demolici?n de pavimentos",
      "unit": "m3",
      "price": 0,
      "category": "Sin categoría",
      "parcial": "10",
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 6,
      "name": "Demolici?n tabique esp. 0,10",
      "unit": "m2",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 8,
      "name": "Demolici?n de piso de mosaicos",
      "unit": "m2",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 9,
      "name": "Demolici?n contrapiso de Hormig?n de cemento",
      "unit": "m2",
      "price": 0,
      "category": "Sin categoría",
      "parcial": "10",
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 10,
      "name": "Retiro de aberturas hasta 2.50 m2",
      "unit": "un",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    }
  ],
  "INSTALACION DE AIRE ACONDICIONADO": [
    {
      "id": 16,
      "name": "Retiro de aberturas > 2.50 m2",
      "unit": "un",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 17,
      "name": "Picado de mamposteria ",
      "unit": "m2",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 9,
      "name": "ampliacion aula",
      "unit": "",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 6,
      "name": "escuela nueva",
      "unit": "",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 10,
      "name": "NULL",
      "unit": "",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 8,
      "name": "refaccion max",
      "unit": "",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    }
  ],
  "CA├æO DE P.V.C. P/CLOACA Y VENTILACION": [
    {
      "id": 1,
      "name": "DEMOLICION Y RETIROS",
      "unit": "NULL",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 2,
      "name": "Demolici?n techo F?C? ",
      "unit": "m2",
      "price": 0,
      "category": "Sin categoría",
      "parcial": "510",
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 3,
      "name": "Demolici?n techo H?G? ",
      "unit": "m2",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 5,
      "name": "Demolici?n de pavimentos",
      "unit": "m3",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 6,
      "name": "Demolici?n tabique esp. 0,10",
      "unit": "m2",
      "price": 0,
      "category": "Sin categoría",
      "parcial": "310",
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 8,
      "name": "Demolici?n de piso de mosaicos",
      "unit": "m2",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 9,
      "name": "Demolici?n contrapiso de Hormig?n de cemento",
      "unit": "m2",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 10,
      "name": "Retiro de aberturas hasta 2.50 m2",
      "unit": "un",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 16,
      "name": "Retiro de aberturas > 2.50 m2",
      "unit": "un",
      "price": 0,
      "category": "Sin categoría",
      "parcial": "10",
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 17,
      "name": "Picado de mamposteria ",
      "unit": "m2",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    }
  ],
  "REVOQUES": [
    {
      "id": 5,
      "name": "caps",
      "unit": "",
      "price": 0,
      "category": "Sin categoría",
      "parcial": "120",
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 3,
      "name": "Medio Oficial",
      "unit": "",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 2,
      "name": "Oficial",
      "unit": "",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    },
    {
      "id": 1,
      "name": "Oficial Especializado",
      "unit": "",
      "price": 0,
      "category": "Sin categoría",
      "parcial": 0,
      "rubro": "",
      "accumulated": ""
    }
  ]
}

export default function PresupuestoPage() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<GroupedPresupuestoData>({})
  const [previewVersion, setPreviewVersion] = useState<'false' | 'medicion'>('false')
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const presupuestoResponse = await fetch(`/api/presupuestos/${params.id}`)
        if (!presupuestoResponse.ok) throw new Error('Error al cargar el presupuesto.')
        const presupuestoData = await presupuestoResponse.json()
        setData(presupuestoData.data)
        console.log('data', presupuestoData.data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Error al cargar los datos.')
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  // Update scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Transform presupuesto data to medicion data
  const transformToMedicionData = (): GroupedMedicionData => {
    const medicionData: GroupedMedicionData = {};

    Object.entries(data).forEach(([tag, items]) => {
      medicionData[tag] = items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category || '',
        anterior: 0,
        presente: 0,
        acumulado: 0
      }));
    });

    return medicionData;
  };

  // Calculate grand total and section rubros
  const { grandTotal, sectionRubros } = React.useMemo(() => {
    const total = Object.values(data).reduce((total, items) => {
      if (!Array.isArray(items)) return total;
      return total + items.reduce((sectionTotal, item) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        return sectionTotal + itemTotal;
      }, 0);
    }, 0);

    const rubros = Object.entries(data).map(([tag, items]) => {
      if (!Array.isArray(items)) return 0;

      const sectionTotal = items.reduce((sum, item) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        return sum + itemTotal;
      }, 0);

      return total > 0 ? (sectionTotal * 100 / total) : 0;
    });

    return { grandTotal: total, sectionRubros: rubros };
  }, [data]);

  // Calculate running total (IACUM) for each section
  const sectionIacums = React.useMemo(() => {
    let runningTotal = 0;
    return Object.entries(data).map(([tag, items]) => {
      if (!Array.isArray(items)) return 0;

      const sectionTotal = items.reduce((sum, item) => {
        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
        return sum + itemTotal;
      }, 0);

      runningTotal += sectionTotal;
      return grandTotal > 0 ? (runningTotal * 100 / grandTotal) : 0;
    });
  }, [data, grandTotal]);

  // Update data when a value changes
  const updateData = (tag: string, itemId: string | number, key: keyof PresupuestoItem, value: string) => {
    setData(prev => {
      const newData = { ...prev }
      const items = newData[tag] || []
      const itemIndex = items.findIndex(it => String(it.id) === String(itemId))

      if (itemIndex > -1) {
        const item = items[itemIndex]
        const numValue = Number(value) || 0

        // Create updated item with new value
        const updatedItem = { ...item, [key]: numValue }

        // Recalculate totalPrice if quantity or unitPrice changes
        if (key === 'quantity' || key === 'unitPrice') {
          updatedItem.totalPrice = (updatedItem.quantity || 0) * (updatedItem.unitPrice || 0)
        }

        // Update the item in the array
        newData[tag] = [
          ...items.slice(0, itemIndex),
          updatedItem,
          ...items.slice(itemIndex + 1),
        ]

        // Calculate new grand total
        const grandTotal = Object.values(newData).reduce((total, sectionItems) => {
          return total + sectionItems.reduce((sectionTotal, item) => {
            return sectionTotal + ((item.quantity || 0) * (item.unitPrice || 0))
          }, 0)
        }, 0)

        // Update parcial values for all sections
        Object.keys(newData).forEach(sectionTag => {
          const sectionTotal = newData[sectionTag].reduce((sum, item) => {
            return sum + ((item.quantity || 0) * (item.unitPrice || 0))
          }, 0)

          newData[sectionTag] = newData[sectionTag].map(item => {
            const itemTotal = (item.quantity || 0) * (item.unitPrice || 0)
            return {
              ...item,
              totalPrice: itemTotal,
              parcial: grandTotal > 0 ? (itemTotal * 100 / grandTotal) : 0,
              rubro: grandTotal > 0 ? (sectionTotal * 100 / grandTotal) : 0
            }
          })
        })
      }
      return newData
    })
  }

  if (loading) return <div>Cargando...</div>
  if (error) return <div>{error}</div>

  return (
    <div className='flex items-start justify-center gap-8 relative'>
      <div className='flex flex-col gap-2 mb-16'>
        <Tabs defaultValue="tab-1" className={cn("sticky top-0 z-10 p-3 pt-5 -mt-5", isScrolled ? "-ml-20" : "w-1/2")}>
          <TabsList>
            <motion.div className="bg-muted rounded-lg flex">
              <span className='w-full'>
                <TabsTrigger value="tab-1" className="py-2 w-full justify-start" asChild onClick={() => setPreviewVersion('false')}>
                  <motion.button className="inline-flex items-center justify-center gap-1.5">
                    <FilePenLine size={16} strokeWidth={2} />
                    <span>Vista Presupuesto</span>
                  </motion.button>
                </TabsTrigger>
              </span>
              <span className='w-full'>
                <TabsTrigger value="tab-2" className="py-2 w-full justify-start" asChild onClick={() => setPreviewVersion('medicion')}>
                  <motion.button className="inline-flex items-center justify-center gap-1.5">
                    <BookIcon size={16} strokeWidth={2} />
                    <span>Nueva Medición</span>
                  </motion.button>
                </TabsTrigger>
              </span>
            </motion.div>
          </TabsList>
        </Tabs>

        <div className="max-w-[1000px] min-w-[1000px] p-6 bg-white rounded-xl shadow-lg relative border">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Ministerio de Obras y Servicios Públicos
            </h1>
            <Card className="text-gray-600 flex flex-col justify-center items-start p-2 px-4">
              <p className="mb-2">Obra: <b>COMISARIA LAGUNA BRAVA - Obra Nueva 1226</b></p>
              <p>Ubicacion: <b>CORRIENTES CAPITAL</b></p>
            </Card>

            <h2 className="mt-4 text-lg font-bold uppercase underline">
              {previewVersion === 'medicion' ? 'Medición de Avance de Obra' : 'Planilla de Presupuesto'}
            </h2>
          </div>

          {/* Content */}
          {previewVersion === 'medicion' ? (
            <MedicionSection
              presupuestoId={params.id as string}
              initialData={transformToMedicionData()}
            />
          ) : (
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
                  updateData={(itemId, key, value) => updateData(tag, itemId, key, value)}
                  handleDeleteRow={() => { }}
                  allElements={[]}
                  highlightChanges={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * A simple inline-edit <input> cell
 */
function EditableInput({
  value: initialValue,
  onChange,
  suffix = "",
}: {
  value: string | number
  onChange: (val: string) => void
  suffix?: string
}) {
  const [value, setValue] = useState(String(initialValue))

  // Keep local state in sync if value changes externally
  useEffect(() => {
    setValue(String(initialValue))
  }, [initialValue])

  const handleBlur = () => {
    // Call parent onChange
    onChange(value)
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <input
        className="border-b border-transparent group-hover:border-gray-300 group-focus:border-gray-300 focus:outline-none bg-transparent w-[50px] text-right focus-within:border-gray-300"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
      />
      {suffix && <span className="text-sm text-gray-700 peer">{suffix}</span>}
    </div>
  )
}

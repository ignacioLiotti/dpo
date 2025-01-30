'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
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
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { debounce } from 'lodash'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Box, House, PanelsTopLeft } from "lucide-react";

interface TableItem {
  id: string | number
  name: string
  unit: string
  price: number
  category: string
  accumulated?: string | number
  parcial?: string | number
  rubro?: string | number
}

interface GroupedData {
  [tag: string]: TableItem[]
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extract the id from the URL
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // Initialize state for data
  const [data, setData] = useState<GroupedData>({});

  useEffect(() => {
    if (id) {
      // Fetch or manipulate data based on the id
      // For example, you might fetch data from an API
      fetchDataById(id);
    }
  }, [id]);

  const fetchDataById = async (id: string) => {
    setLoading(true);
    try {
      // Replace this with your actual data fetching logic
      const response = await fetch(`/api/presupuestos/${id}`);
      const result: GroupedData = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Error al cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  // For searching & adding new items
  const [searchOpen, setSearchOpen] = useState<{ [key: string]: boolean }>({})
  const [generalSearchOpen, setGeneralSearchOpen] = useState(false)
  const [allElements, setAllElements] = useState<any[]>([])
  const [filteredElements, setFilteredElements] = useState<any[]>([])
  const [searchValue, setSearchValue] = useState("")

  const serializeDataToJson = () => {
    return JSON.stringify(data);
  };

  // Function to initialize state from JSON
  const initializeDataFromJson = (jsonString: string) => {
    try {
      const parsedData: GroupedData = JSON.parse(jsonString);
      setData(parsedData);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      setError("Error al cargar los datos desde JSON.");
    }
  };

  // -----------------------------
  //   Debounced Search Setup
  // -----------------------------
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      if (searchTerm.length >= 4) {
        const filtered = allElements.filter(element =>
          element.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredElements(filtered)
      } else {
        setFilteredElements([])
      }
    }, 300),
    [allElements]
  )

  const handleSearch = (value: string) => {
    setSearchValue(value)
    debouncedSearch(value)
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

  // -----------------------------
  //   Add item to a section
  // -----------------------------
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
          name: element.name || 'Sin descripción',
          unit: element.unit || '',
          price: element.prices?.[0]?.price || 0,
          category: element.categories?.name || 'Sin categoría',
          parcial: element.prices?.[0]?.price || 0,
          rubro: '',
          accumulated: '',
        },
      ]
      return newData
    })
  }

  // For the "Agregar nuevo elemento" combobox
  const addGeneralElement = (element: any) => {
    const tag = element.element_tags?.[0]?.tags?.name || 'Sin Etiqueta'
    addElementToSection(tag, element)
    setGeneralSearchOpen(false)
    setSearchValue("")
    setFilteredElements([])
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Final data:', data);
    const jsonData = serializeDataToJson();
    console.log('Serialized JSON:', jsonData);
    // Additional logic ...
  };

  const [previewVersion, setPreviewVersion] = useState<string | boolean>(false)

  console.log(previewVersion)

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
          <div className="rounded-lg border border-gray-200">
            <Table>
              {/* <TableCaption className='hidden'>Elementos agrupados por sección (tag).</TableCaption> */}

              <TableHeader >
                <TableRow>
                  <TableHead className="w-[50px]">N°</TableHead>
                  <TableHead className="text-left">Nombre</TableHead>
                  <TableHead className="text-left">Unidad </TableHead>
                  <TableHead className="text-center">Parcial</TableHead>
                  {(previewVersion == 'parcial' || previewVersion == 'false') && (
                    <>
                      <TableHead className="text-center">Rubro</TableHead>
                      <TableHead className="text-center">IACUMUL</TableHead>
                    </>
                  )}

                  {previewVersion === 'false' && (
                    <TableHead className="text-center">Acciones</TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* If no data */}
                {Object.keys(data).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No hay datos disponibles.
                    </TableCell>
                  </TableRow>
                ) : (
                  /* For each tag, create a section header + items */
                  Object.entries(data).map(([tag, items], tagIndex) => (
                    <React.Fragment key={tag}>
                      {/* Section Header */}
                      <TableRow className="bg-stone-100 border-r border-l">
                        {/* 
                        We can style it however you like. 
                        colSpan = total number of columns in the table
                      */}
                        <TableCell colSpan={7} className="font-bold ">
                          {tagIndex + 1}. {tag.toUpperCase()}
                        </TableCell>
                      </TableRow>

                      {/* Rows for this tag */}
                      {items.map((item, rowIndex) => {
                        const rowNumber = `${tagIndex + 1}.${rowIndex + 1}`
                        return (
                          <TableRow key={item.id}>
                            {/* N° */}
                            <TableCell className="text-gray-600 border-r border-l">
                              {rowNumber}
                            </TableCell>
                            {/* Nombre */}
                            <TableCell className='border-r'>
                              {item.name}
                            </TableCell>
                            {/* Unidad */}
                            <TableCell className='border-r'>
                              {item.unit}
                            </TableCell>
                            {/* Parcial */}
                            <TableCell className="text-center border-r  group  cursor-text hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]  focus:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] focus-within:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]">
                              <EditableInput
                                value={String(item.parcial ?? '')}
                                onChange={(val) => updateData(tag, item.id, 'parcial', val)}
                                suffix="%"
                              />
                            </TableCell>
                            {(previewVersion === 'parcial' || previewVersion === 'false') && (
                              <>
                                <TableCell className="text-center border-r  group  cursor-text hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]  focus:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] focus-within:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]">
                                  <EditableInput
                                    value={String(item.rubro ?? '')}
                                    onChange={(val) => updateData(tag, item.id, 'rubro', val)}
                                    suffix="%"
                                  />
                                </TableCell>
                                {/* IACUMUL */}
                                <TableCell className="text-center border-r group cursor-text box-border hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]  focus:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)] focus-within:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]">
                                  <EditableInput
                                    value={String(item.accumulated ?? '')}
                                    onChange={(val) => updateData(tag, item.id, 'accumulated', val)}
                                    suffix="%"
                                  />
                                </TableCell>
                              </>
                            )}
                            {/* Rubro */}
                            {/* Delete Action */}
                            {previewVersion === 'false' && (

                              <TableCell className="text-center border-r">
                                <Button
                                  variant="destructive"
                                  className="flex items-center gap-1 h-6 w-7 p-0 mx-auto"
                                  onClick={() => handleDeleteRow(tag, item.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        )
                      })}

                      {/* Add new element to this tag */}
                      {previewVersion === 'false' && (
                        <TableRow className='group'>
                          <TableCell colSpan={7} className='group-hover:bg-white'>
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setSearchOpen(prev => ({ ...prev, [tag]: !prev[tag] }))
                                }
                                className="w-full px-4 py-2 text-left text-gray-600 border-2 border-dashed 
                                       border-gray-300 rounded-lg hover:bg-slate-50 transition-colors 
                                       duration-200 flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4 text-blue-500" />
                                <span>Agregar elemento a {tag}</span>
                              </button>

                              {searchOpen[tag] && (
                                <Popover
                                  open={searchOpen[tag]}
                                  onOpenChange={(open) => {
                                    setSearchOpen(prev => ({ ...prev, [tag]: open }))
                                  }}
                                >
                                  <PopoverTrigger asChild>
                                    <></>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0 mt-1">
                                    <Command>
                                      <CommandInput
                                        placeholder="Buscar elementos (mínimo 4 caracteres)..."
                                        value={searchValue}
                                        onValueChange={handleSearch}
                                      />
                                      <CommandEmpty>
                                        {searchValue.length < 4
                                          ? "Ingrese al menos 4 caracteres para buscar"
                                          : "No se encontraron elementos"}
                                      </CommandEmpty>
                                      <CommandGroup>
                                        <CommandList>
                                          {filteredElements
                                            .filter(
                                              element =>
                                                Array.isArray(element.element_tags) &&
                                                element.element_tags.some(
                                                  (tagObj: any) => tagObj.tags?.name === tag
                                                ) &&
                                                !items.some(
                                                  existing => existing.id === element.id
                                                )
                                            )
                                            .map((element, idx) => (
                                              <CommandItem
                                                key={`${element.id}-${idx}`}
                                                value={element.name}
                                                onSelect={() => {
                                                  addElementToSection(tag, element)
                                                  setSearchOpen(prev => ({ ...prev, [tag]: false }))
                                                  setSearchValue("")
                                                  setFilteredElements([])
                                                }}
                                              >
                                                <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                                                {element.name}
                                              </CommandItem>
                                            ))}
                                        </CommandList>
                                      </CommandGroup>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>

              {/* <TableFooter>
              <TableRow>
                <TableCell colSpan={7} className="text-right">
                  If you want a summary or total, put it here
                </TableCell>
              </TableRow>
            </TableFooter> */}
            </Table>
          </div>
        )}

        {/* General Add Element Button */}
        {!loading && !error && previewVersion === false && (
          <div className="mt-6">
            <Popover open={generalSearchOpen} onOpenChange={setGeneralSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  role="combobox"
                  aria-expanded={generalSearchOpen}
                  className="w-full justify-between"
                >
                  <span>Agregar nuevo elemento</span>
                  <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Buscar elementos (mínimo 4 caracteres)..."
                    value={searchValue}
                    onValueChange={handleSearch}
                  />
                  <CommandEmpty>
                    {searchValue.length < 4
                      ? "Ingrese al menos 4 caracteres para buscar"
                      : "No se encontraron elementos"}
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandList>
                      {filteredElements.map((element, index) => (
                        <CommandItem
                          key={`${element.id}-${index}`}
                          value={element.name}
                          onSelect={() => addGeneralElement(element)}
                        >
                          <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                          {element.name}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
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

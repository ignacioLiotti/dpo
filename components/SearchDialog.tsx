'use client'

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Loader2 } from "lucide-react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { TableItem } from "@/types"

interface SearchDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onElementSelect: (elements: TableItem[]) => void
  sections: string[]
  elements: TableItem[]
}

interface DBItem {
  id: string
  nombre: string
  unidad: string
  categoria: string
  precios: Array<{
    precio: number
    fecha: string
  }>
}

interface APIResponse {
  items: DBItem[]
  total: number
  page: number
  limit: number
  pageCount: number
  hasMore: boolean
}

// Function to fetch items from the API
async function fetchItems({ pageParam = 0, searchQuery = "" }): Promise<APIResponse> {
  const response = await fetch(`/api/items?page=${pageParam}&limit=20&search=${encodeURIComponent(searchQuery)}`)
  if (!response.ok) throw new Error('Failed to fetch items')
  return response.json()
}

export function SearchDialog({
  isOpen,
  onOpenChange,
  onElementSelect,
  sections,
  elements
}: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSection, setSelectedSection] = useState<string>("")
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customElement, setCustomElement] = useState<Partial<TableItem>>({
    name: "",
    unit: "",
    unitPrice: 0,
    quantity: 1,
  })
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch items with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ['items', debouncedSearch],
    queryFn: ({ pageParam }) => fetchItems({ pageParam: pageParam as number, searchQuery: debouncedSearch }),
    getNextPageParam: (lastPage: APIResponse) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: isOpen && !showCustomForm,
    initialPageParam: 0,
  })

  // Reset states when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
      setSelectedSection("")
      setShowCustomForm(false)
      setCustomElement({
        name: "",
        unit: "",
        unitPrice: 0,
        quantity: 1,
      })
    }
  }, [isOpen])

  // Handle element selection
  const handleElementSelect = (element: DBItem) => {
    const targetSection = selectedSection || element.categoria || sections[0]

    // Convert database item to TableItem format
    const tableItem: TableItem = {
      id: element.id,
      name: element.nombre,
      unit: element.unidad,
      unitPrice: element.precios?.[0]?.precio || 0,
      quantity: 1,
      price: element.precios?.[0]?.precio || 0,
      totalPrice: element.precios?.[0]?.precio || 0,
      category: element.categoria,
      parcial: 0,
      rubro: 0,
      accumulated: 0,
      targetSection,
    }

    onElementSelect([tableItem])
    onOpenChange(false)
  }

  // Handle custom element creation
  const handleCustomElementCreate = () => {
    if (!selectedSection || !customElement.name || !customElement.unit) {
      return
    }

    const newElement: TableItem = {
      id: `custom-${Date.now()}`,
      name: customElement.name,
      unit: customElement.unit,
      unitPrice: Number(customElement.unitPrice) || 0,
      quantity: Number(customElement.quantity) || 1,
      price: Number(customElement.unitPrice) || 0,
      totalPrice: (Number(customElement.quantity) || 1) * (Number(customElement.unitPrice) || 0),
      category: selectedSection,
      parcial: 0,
      rubro: 0,
      accumulated: 0,
      targetSection: selectedSection,
    }

    onElementSelect([newElement])
    onOpenChange(false)
  }

  // Get all items from all pages
  const allItems = data?.pages.flatMap(page => page.items) || []

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Buscar o Crear Elemento</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Section Selection */}
          <Select
            value={selectedSection}
            onValueChange={setSelectedSection}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar sección" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((section) => (
                <SelectItem key={section} value={section}>
                  {section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!showCustomForm ? (
            <>
              {/* Search Elements */}
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar elementos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomForm(true)}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Nuevo
                  </Button>
                </div>

                <div className="border rounded-md h-[300px] overflow-y-auto max-w-[800px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : isError ? (
                    <div className="p-4 text-center text-red-500">
                      Error al cargar los elementos
                    </div>
                  ) : allItems.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No se encontraron elementos
                    </div>
                  ) : (
                    <div className="grid gap-1 p-1  max-w-[80%]">
                      {allItems.map((element) => (
                        <Button
                          key={element.id}
                          variant="ghost"
                          className="w-full justify-start font-normal "
                          onClick={() => handleElementSelect(element)}
                        >
                          <div className="flex flex-col items-start ">
                            <span className="max-w-[600px] truncate">{element.nombre}</span>
                            <span className="text-xs text-muted-foreground">
                              {element.unidad} - ${element.precios?.[0]?.precio || 0}
                            </span>
                          </div>
                        </Button>
                      ))}
                      {hasNextPage && (
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => fetchNextPage()}
                          disabled={isFetchingNextPage}
                        >
                          {isFetchingNextPage ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            "Cargar más"
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Custom Element Form */}
              <div className="space-y-4">
                <h3 className="font-medium">Crear Nuevo Elemento</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="name">Nombre</label>
                    <Input
                      id="name"
                      value={customElement.name}
                      onChange={(e) => setCustomElement(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nombre del elemento"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="unit">Unidad</label>
                    <Input
                      id="unit"
                      value={customElement.unit}
                      onChange={(e) => setCustomElement(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="Unidad de medida"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="unitPrice">Precio Unitario</label>
                    <Input
                      id="unitPrice"
                      type="number"
                      value={customElement.unitPrice}
                      onChange={(e) => setCustomElement(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                      placeholder="Precio por unidad"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="quantity">Cantidad</label>
                    <Input
                      id="quantity"
                      type="number"
                      value={customElement.quantity}
                      onChange={(e) => setCustomElement(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      placeholder="Cantidad"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          {showCustomForm ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowCustomForm(false)}
              >
                Volver
              </Button>
              <Button
                onClick={handleCustomElementCreate}
                disabled={!selectedSection || !customElement.name || !customElement.unit}
              >
                Crear y Agregar
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
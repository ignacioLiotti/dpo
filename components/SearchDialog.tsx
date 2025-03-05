'use client'

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Loader2, Check } from "lucide-react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { TableItem } from "@/types"
import { OnboardingStep } from "./Onboarding/OnboardingStep"
import { Checkbox } from "@/components/ui/checkbox"
import { useOnboarding } from "./Onboarding/OnboardingProvider"

interface SearchDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onElementSelect: (elements: TableItem[]) => void
  sections: string[]
  elements: TableItem[]
  children?: React.ReactNode
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
  elements,
  children
}: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSection, setSelectedSection] = useState<string>("")
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set())
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
      setSelectedElements(new Set())
      setCustomElement({
        name: "",
        unit: "",
        unitPrice: 0,
        quantity: 1,
      })
    }
  }, [isOpen])

  // Handle element toggle selection
  const handleElementToggle = (element: DBItem) => {
    setSelectedElements(prev => {
      const newSet = new Set(prev)
      if (newSet.has(element.id)) {
        newSet.delete(element.id)
      } else {
        newSet.add(element.id)
      }
      return newSet
    })
  }

  // Get all items from all pages
  const allItems = data?.pages.flatMap(page => page.items) || []

  const { nextStep } = useOnboarding()

  // Handle submit selected elements
  const handleSubmitSelected = () => {
    if (!selectedSection || selectedElements.size === 0) return

    const selectedItems: TableItem[] = allItems
      .filter((item: DBItem) => selectedElements.has(item.id))
      .map((element: DBItem): TableItem => ({
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
        targetSection: selectedSection,
      }))

    onElementSelect(selectedItems)
    nextStep()
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <OnboardingStep
          set="workflow"
          stepOrder={5}
          tooltipTitle="Buscar Elementos"
          tooltipContent="Ahora puedes buscar elementos en la base de datos. Da click en continuar."
          prevStepButton={false}
          exitButton={false}
          skippable={false}
          tooltipSide="left"
        >
          <DialogHeader>
            <DialogTitle>Buscar Elementos</DialogTitle>
            <DialogDescription>
              Busca y selecciona los elementos que deseas agregar al presupuesto
            </DialogDescription>
          </DialogHeader>

          {children}

          <div className="flex flex-col gap-4">
            {/* Section Selection */}
            <OnboardingStep
              set="workflow"
              stepOrder={6}
              tooltipTitle="Seleccionar Sección"
              tooltipContent="Selecciona la sección a la que quieras agregar el elemento. Para seguir con el ejemplo elige la sección que creaste en el paso 4. Luego da click en continuar."
              prevStepButton={false}
              exitButton={false}
              skippable={false}
              tooltipSide="left"
            >
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
            </OnboardingStep>

            {!showCustomForm ? (
              <>
                {/* Search Elements */}
                <OnboardingStep
                  set="workflow"
                  stepOrder={7}
                  tooltipTitle="Buscar Elementos"
                  tooltipContent="Busca y selecciona los elementos que deseas agregar al presupuesto. Luego da click en continuar."
                  prevStepButton={false}
                  exitButton={false}
                  skippable={false}
                  tooltipSide="left"
                >
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
                        <div className="grid gap-1 p-1 max-w-[80%]">
                          {allItems.map((element) => (
                            <div
                              key={element.id}
                              className="flex items-center gap-2 p-2 hover:bg-accent rounded-md group"
                            >
                              <Checkbox
                                checked={selectedElements.has(element.id)}
                                onCheckedChange={() => handleElementToggle(element)}
                                className="translate-y-[1px]"
                              />
                              <div className="flex flex-col flex-1" onClick={() => handleElementToggle(element)}>
                                <span className="max-w-[600px] truncate">{element.nombre}</span>
                                <span className="text-xs text-muted-foreground">
                                  {element.unidad} - ${element.precios?.[0]?.precio || 0}
                                </span>
                              </div>
                            </div>
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
                </OnboardingStep>
              </>
            ) : (
              <>
                {/* Custom Element Form */}
                <div className="space-y-4 border rounded-md p-4 border-dashed border-border">
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
              <div className="flex gap-2 justify-end w-full">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <OnboardingStep
                  set="workflow"
                  stepOrder={8}
                  tooltipTitle="Agregar Elementos"
                  tooltipContent="Y por ultimo agrega los elementos seleccionados al presupuesto haciendo click en el botón."
                  nextStepButton={false}
                  prevStepButton={false}
                  exitButton={false}
                  skippable={false}
                  tooltipSide="left"
                >
                  <Button
                    onClick={handleSubmitSelected}
                    disabled={!selectedSection || selectedElements.size === 0}
                  >
                    Agregar {selectedElements.size} elemento{selectedElements.size !== 1 ? 's' : ''}
                  </Button>
                </OnboardingStep>
              </div>
            )}
          </DialogFooter>
        </OnboardingStep>
      </DialogContent>
    </Dialog>
  )
} 
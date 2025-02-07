'use client'

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { debounce } from 'lodash'

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
  nombre?: string
}

interface SearchDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onElementSelect: (elements: TableItem[]) => void
  sections: string[]
  elements: TableItem[]
}

export function SearchDialog({
  isOpen,
  onOpenChange,
  onElementSelect,
  sections,
  elements
}: SearchDialogProps) {
  const [searchValue, setSearchValue] = useState('')
  const [filteredElements, setFilteredElements] = useState<TableItem[]>([])
  const [selectedElements, setSelectedElements] = useState<Set<string | number>>(new Set())
  const [elementSections, setElementSections] = useState<Record<string | number, string>>({})

  // Get default section from element tags
  const getDefaultSection = (element: TableItem) => {
    if (element.category && element.category.length > 0) {
      const tagName = element.category;
      if (sections.includes(tagName)) {
        return tagName;
      }
    }
    return '';
  }

  // Handle search
  const handleSearch = useCallback(
    (searchTerm: string) => {
      setSearchValue(searchTerm)
      if (searchTerm.length >= 2) {
        const filtered = elements.filter((element: TableItem) => {
          const searchLower = searchTerm.toLowerCase()
          const nameLower = (element.nombre || element.name || '').toLowerCase()
          return nameLower.includes(searchLower)
        })
        setFilteredElements(filtered)
      } else {
        setFilteredElements([])
      }
    },
    [elements]
  )

  // Handle section selection
  const handleSectionSelect = (elementId: string | number, sectionName: string) => {
    setElementSections(prev => ({
      ...prev,
      [elementId]: sectionName
    }))
  }

  // Handle element selection
  const handleElementToggle = (elementId: string | number, element: TableItem) => {
    const newSelected = new Set(selectedElements)
    if (newSelected.has(elementId)) {
      newSelected.delete(elementId)
      const { [elementId]: _, ...rest } = elementSections
      setElementSections(rest)
    } else {
      newSelected.add(elementId)
      // Set default section when selecting element
      const defaultSection = getDefaultSection(element)
      setElementSections(prev => ({
        ...prev,
        [elementId]: defaultSection // Set the default section even if empty
      }))
    }
    setSelectedElements(newSelected)
  }

  // Handle add selected elements
  const handleAddSelected = () => {
    const elementsToAdd = filteredElements
      .filter(element => selectedElements.has(element.id))
      .map(element => ({
        ...element,
        targetSection: elementSections[element.id]
      }))
      .filter(element => element.targetSection) // Only add elements with a section selected

    if (elementsToAdd.length > 0) {
      onElementSelect(elementsToAdd)
      setSearchValue('')
      setFilteredElements([])
      setSelectedElements(new Set())
      setElementSections({})
    }
  }

  // Check if all filtered elements are selected
  const allSelected = filteredElements.length > 0 &&
    filteredElements.every(element => selectedElements.has(element.id))

  // Handle select all
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedElements(new Set())
      setElementSections({})
    } else {
      const newSelected = new Set(filteredElements.map(e => e.id))
      setSelectedElements(newSelected)
    }
  }
  console.log(selectedElements)
  console.log(elementSections)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Agregar Elementos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border shadow-md p-4">
            <Input
              placeholder="Buscar elementos (mínimo 2 caracteres)..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <ScrollArea className="h-[200px]">
              {(!searchValue || searchValue.length < 2) ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <span className="text-sm text-muted-foreground">
                    Ingrese al menos 2 caracteres para buscar
                  </span>
                </div>
              ) : filteredElements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <span className="text-sm text-muted-foreground">
                    No se encontraron elementos
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 border-b">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      id="select-all"
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">
                      Seleccionar todos
                    </label>
                  </div>
                  {filteredElements.map((element) => (
                    <div
                      key={element.id}
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                    >
                      <Checkbox
                        checked={selectedElements.has(element.id)}
                        onCheckedChange={() => handleElementToggle(element.id, element)}
                        id={`element-${element.id}`}
                      />
                      <label
                        htmlFor={`element-${element.id}`}
                        className="flex-grow cursor-pointer"
                      >
                        {element.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedElements.size > 0 && (
            <div className="rounded-lg border shadow-md p-4">
              <h3 className="text-sm font-medium mb-2">Elementos Seleccionados</h3>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {filteredElements
                    .filter(element => selectedElements.has(element.id))
                    .map((element) => (
                      <div
                        key={element.id}
                        className="flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                      >
                        <span className="flex-grow">{element.name}</span>
                        <Select
                          value={elementSections[element.id]}
                          onValueChange={(value) => handleSectionSelect(element.id, value)}
                        >
                          <SelectTrigger
                            className={`w-[180px] ${elementSections[element.id]
                              ? 'border-green-500 bg-green-50 hover:bg-green-100'
                              : 'border-red-500 bg-red-50 hover:bg-red-100'
                              }`}
                          >
                            <SelectValue placeholder="Seleccionar sección" />
                          </SelectTrigger>
                          <SelectContent>
                            {sections.map((section) => (
                              <SelectItem
                                key={section}
                                value={section}
                                className="hover:bg-accent cursor-pointer"
                              >
                                {section}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        <DialogFooter>
          <div className="flex justify-between items-center w-full">
            <span className="text-sm text-muted-foreground">
              {selectedElements.size} elementos seleccionados
            </span>
            <Button
              onClick={handleAddSelected}
              disabled={selectedElements.size === 0 ||
                !Array.from(selectedElements).every(id => elementSections[id])}
            >
              Agregar Seleccionados
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
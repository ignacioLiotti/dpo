'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface GlobalSearchProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  searchValue: string
  onSearch: (value: string) => void
  filteredElements: TableItem[]
  onElementSelect: (element: TableItem) => void
  onSectionSelect: (elementId: string | number, section: string) => void
  sections: string[]
}

export function GlobalSearch({
  isOpen,
  onOpenChange,
  searchValue,
  onSearch,
  filteredElements,
  onElementSelect,
  onSectionSelect,
  sections
}: GlobalSearchProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Agregar Elemento</DialogTitle>
        </DialogHeader>
        <div className="rounded-lg border shadow-md p-4">
          <Input
            placeholder="Buscar elementos (mínimo 4 caracteres)..."
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            className="mb-4"
          />
          <ScrollArea className="h-[300px]">
            {(!searchValue || searchValue.length < 4) ? (
              <div className="flex flex-col items-center justify-center py-6">
                <span className="text-sm text-muted-foreground">
                  Ingrese al menos 4 caracteres para buscar
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
                {filteredElements.map((element) => (
                  <div
                    key={element.id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => onElementSelect(element)}
                  >
                    <span>{element.name}</span>
                    <Select
                      value={element.targetSection}
                      onValueChange={(value) => onSectionSelect(element.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
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
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
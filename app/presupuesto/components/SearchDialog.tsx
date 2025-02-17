'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TableItem } from '../types'

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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buscar Elementos</DialogTitle>
        </DialogHeader>
        {/* Add your search implementation here */}
      </DialogContent>
    </Dialog>
  )
} 
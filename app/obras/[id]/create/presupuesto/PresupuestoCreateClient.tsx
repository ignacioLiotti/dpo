'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, PanelsTopLeft, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSelectedItems } from '@/hooks/useQueries'
import { useObras } from '@/hooks/useObras'
import { usePresupuestos } from '@/hooks/usePresupuestos'
import { usePresupuestoData } from '@/hooks/usePresupuestoData'
import { PresupuestoEditor } from '@/components/editores/PresupuestoEditor'

interface AddSectionDialogProps {
  onAdd: (sectionName: string) => void;
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

export default function PresupuestoPageClient() {
  const searchParams = useSearchParams();
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeView, setActiveView] = useState<'presupuesto' | 'mediciones'>('presupuesto')

  // Get obra ID from URL path or fallback to first obra
  const pathObraId = window.location.pathname.split('/')[2]; // Extract ID from /obra/[id]/create/presupuesto
  const { data: obras, isLoading: isLoadingObras } = useObras();
  const obraId = pathObraId || obras?.[0]?.id;

  // Get presupuestos for the obra
  const { data: presupuestos, isLoading: isLoadingPresupuestos } = usePresupuestos(Number(obraId));
  // @ts-ignore
  const presupuestoId = presupuestos?.[0]?.id;

  // Get detailed presupuesto data
  const { presupuesto, items, isLoading: isLoadingPresupuesto } =
    usePresupuestoData(presupuestoId?.toString());

  // Get selected items data
  const selectedIds = searchParams.get('selectedIds')?.split(',') || [];
  const { data: selectedItemsData, isLoading: isLoadingSelected } = useSelectedItems(selectedIds);

  const isLoading = isLoadingObras || isLoadingPresupuestos || isLoadingPresupuesto || isLoadingSelected;

  // Add scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial scroll position

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[200px] bg-muted animate-pulse rounded" />
          <div className="h-[200px] bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!obras?.length) {
    return (
      <div className="container mx-auto p-4">
        <p>No obra available. Please create an obra first.</p>
      </div>
    );
  }

  if (!selectedItemsData && selectedIds.length > 0) {
    return (
      <div className="container mx-auto p-4">
        <p>No data available for the selected items.</p>
      </div>
    );
  }

  const pageData = selectedItemsData || {
    presupuestoData: {},
    allElements: [],
    mediciones: []
  };

  console.log('pageData', obras);

  return (
    <div className="container mx-auto p-4">
      <AnimatePresence mode="wait">
        {/* {activeView === 'presupuesto' ? ( */}
        <PresupuestoEditor
          key="presupuesto"
          presupuestoData={pageData.presupuestoData}
          allElements={pageData.allElements}
          obraId={obraId}
          obraData={obras?.[0]}
        />
      </AnimatePresence>
    </div>
  );
} 
'use client'

import React, { useState, useEffect } from 'react'

import { Button } from "@/components/ui/button"
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { cn } from "@/lib/utils"
import { useObra } from '@/app/providers/ObraProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, CalendarDaysIcon, Package } from "lucide-react"
import { EditableInput } from '@/components/Table/EditableInput'
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { TableItem, Medicion, MedicionSection } from '@/types'

interface PresupuestoItem {
  id: string
  name: string
  totalPrice: number
}

interface MedicionesEditorProps {
  medicion: Medicion
  presupuestoData: Record<string, TableItem[]>
  onUpdate?: (medicion: Medicion) => void
  display?: boolean
  obraId?: number
}

export function MedicionesEditor({
  medicion: initialMedicion,
  presupuestoData = {},
  onUpdate,
  display = false,
  obraId
}: MedicionesEditorProps) {
  const searchParams = useSearchParams()
  const urlPeriod = searchParams.get('periodo')
  const { state, dispatch } = useObra()
  const { mediciones } = state
  const [medicion, setMedicion] = useState<Medicion>(initialMedicion)
  const [error, setError] = useState<string | null>(null)
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (display) {
      setMedicion(initialMedicion)
      return
    }

    if (!mediciones) return

    const currentPeriod = urlPeriod || initialMedicion.periodo
    const [currentYear, currentMonth] = currentPeriod.substring(0, 7).split('-').map(Number)

    // Find closest previous medicion by comparing dates
    const previousMedicion = mediciones.reduce((closest: Medicion | null, m) => {
      const [mYear, mMonth] = m.periodo.substring(0, 7).split('-').map(Number)

      // Skip if medicion is in the future
      if (mYear > currentYear || (mYear === currentYear && mMonth >= currentMonth)) {
        return closest
      }

      // If no closest yet, use this one
      if (!closest) return m

      const [closestYear, closestMonth] = closest.periodo.substring(0, 7).split('-').map(Number)

      // Compare which date is closer
      const currentDiff = (currentYear - mYear) * 12 + (currentMonth - mMonth)
      const closestDiff = (currentYear - closestYear) * 12 + (currentMonth - closestMonth)

      return currentDiff < closestDiff ? m : closest
    }, null)

    // If we have a previous medicion, use its accumulated values
    if (previousMedicion) {
      const newSecciones = Object.entries(presupuestoData).map(([nombre, items]) => ({
        nombre,
        items: items.map(item => {
          const prevSection = previousMedicion.data.secciones.find(s => s.nombre === nombre)
          const prevItem = prevSection?.items.find(i => i.id === item.id)
          return {
            id: String(item.id),
            anterior: prevItem?.acumulado || 0,
            presente: 0,
            acumulado: prevItem?.acumulado || 0
          }
        })
      }))

      setMedicion({
        ...initialMedicion,
        periodo: currentPeriod,
        data: {
          secciones: newSecciones
        }
      })
    } else {
      // If no previous medicion, start fresh
      const newSecciones = Object.entries(presupuestoData).map(([nombre, items]) => ({
        nombre,
        items: items.map(item => ({
          id: String(item.id),
          anterior: 0,
          presente: 0,
          acumulado: 0
        }))
      }))

      setMedicion({
        ...initialMedicion,
        periodo: currentPeriod,
        data: {
          secciones: newSecciones
        }
      })
    }
  }, [mediciones, urlPeriod, initialMedicion, presupuestoData, display])

  // Calculate total budget
  const totalBudget = React.useMemo(() => {
    return Object.values(presupuestoData).reduce((total: number, items: TableItem[]) => {
      return total + items.reduce((sectionTotal: number, item: TableItem) => sectionTotal + Number(item.totalPrice || 0), 0)
    }, 0)
  }, [presupuestoData])

  // Calculate advancement totals
  const calculateAdvancementTotals = (medicion: Medicion) => {
    // If the medicion has the new columns, use them directly
    if (medicion.avanceMedicion !== undefined &&
      medicion.avanceAcumulado !== undefined &&
      medicion.presupuestoTotal !== undefined) {


      return {
        currentAdvancement: (Number(medicion.presupuestoTotal) * Number(medicion.avanceMedicion)) / 100,
        previousAdvancement: (Number(medicion.presupuestoTotal) * (Number(medicion.avanceAcumulado) - Number(medicion.avanceMedicion))) / 100,
        accumulatedAdvancement: (Number(medicion.presupuestoTotal) * Number(medicion.avanceAcumulado)) / 100,
        currentPercentage: Number(medicion.avanceMedicion),
        previousPercentage: Number(medicion.avanceAcumulado) - Number(medicion.avanceMedicion),
        accumulatedPercentage: Number(medicion.avanceAcumulado)
      }
    }

    // Otherwise, calculate them manually as before
    let currentTotal = 0
    let previousTotal = 0

    console.log('aca medicion', medicion)

    medicion.data?.secciones.forEach(section => {
      const sectionItems = presupuestoData[section.nombre] || []
      section.items.forEach(item => {
        const presupuestoItem = sectionItems.find(i => String(i.id) === item.id)
        if (presupuestoItem) {
          currentTotal += Number(presupuestoItem.totalPrice) * (Number(item.presente) / 100)
          previousTotal += Number(presupuestoItem.totalPrice) * (Number(item.anterior) / 100)
        }
      })
    })

    const accumulatedTotal = currentTotal + previousTotal

    return {
      currentAdvancement: currentTotal,
      previousAdvancement: previousTotal,
      accumulatedAdvancement: accumulatedTotal,
      currentPercentage: (currentTotal / Number(totalBudget)) * 100,
      previousPercentage: (previousTotal / Number(totalBudget)) * 100,
      accumulatedPercentage: (accumulatedTotal / Number(totalBudget)) * 100
    }
  }

  // Update measurement data
  const updateMedicion = (
    sectionName: string,
    itemId: string,
    presente: number
  ) => {
    if (display) return

    setMedicion(prevMedicion => {
      const newSecciones = prevMedicion.data.secciones.map(section => {
        if (section.nombre !== sectionName) return section

        return {
          ...section,
          items: section.items.map(item => {
            if (item.id !== itemId) return item
            return {
              ...item,
              presente,
              acumulado: item.anterior + presente
            }
          })
        }
      })

      // Calculate new totals
      let currentTotal = 0
      let previousTotal = 0

      newSecciones.forEach(section => {
        const sectionItems = presupuestoData[section.nombre] || []
        section.items.forEach(item => {
          const presupuestoItem = sectionItems.find(i => String(i.id) === item.id)
          if (presupuestoItem) {
            currentTotal += Number(presupuestoItem.totalPrice) * (Number(item.presente) / 100)
            previousTotal += Number(presupuestoItem.totalPrice) * (Number(item.anterior) / 100)
          }
        })
      })

      const accumulatedTotal = currentTotal + previousTotal
      const avanceMedicion = (currentTotal / Number(totalBudget)) * 100
      const avanceAcumulado = (accumulatedTotal / Number(totalBudget)) * 100

      const newMedicion = {
        ...prevMedicion,
        data: {
          ...prevMedicion.data,
          secciones: newSecciones
        },
        avanceMedicion,
        avanceAcumulado,
        presupuestoTotal: totalBudget
      }

      onUpdate?.(newMedicion)
      return newMedicion
    })
  }


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (display || !obraId) return

    try {
      const response = await fetch('/api/mediciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          obraId,
          periodo: medicion.periodo,
          data: medicion.data,
          presupuestoId: medicion.presupuesto_id || initialMedicion.presupuesto_id,
          avanceMedicion: medicion.avanceMedicion || initialMedicion.avanceMedicion,
          avanceAcumulado: medicion.avanceAcumulado || initialMedicion.avanceAcumulado,
          presupuestoTotal: medicion.presupuestoTotal || initialMedicion.presupuestoTotal
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar la medición')
      }

      const newMedicion = await response.json()

      dispatch({
        type: 'ADD_MEDICION',
        payload: newMedicion
      })

      router.push(`/obras/${obraId}`)
      alert('Medición guardada exitosamente!')
    } catch (error) {
      console.error('Error saving medicion:', error)
      setError(error instanceof Error ? error.message : 'Error al guardar la medición')
    }
  }

  const handlePeriodChange = (newDate: string) => {
    setMedicion(prev => ({
      ...prev,
      periodo: newDate
    }))
    setIsPeriodDialogOpen(false)
  }

  const renderMedicionPeriod = () => {
    const advancementTotals = calculateAdvancementTotals(medicion)

    return (
      <div key={medicion.id} className="border rounded-lg p-4">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Período: {medicion.periodo}
            </h3>
          </div>
          <div className="text-sm text-gray-600">
            Presupuesto Total: <span className="font-medium">${Number(totalBudget).toLocaleString('es-AR')}</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-600">Avance Anterior</h4>
            <p className="text-lg font-semibold">${advancementTotals.previousAdvancement.toLocaleString('es-AR')}</p>
            <p className="text-sm text-gray-500">{advancementTotals.previousPercentage.toFixed(2)}%</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-600">Avance del Período</h4>
            <p className="text-lg font-semibold">${advancementTotals.currentAdvancement.toLocaleString('es-AR')}</p>
            <p className="text-sm text-gray-500">{advancementTotals.currentPercentage.toFixed(2)}%</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-600">Avance Acumulado</h4>
            <p className="text-lg font-semibold">${advancementTotals.accumulatedAdvancement.toLocaleString('es-AR')}</p>
            <p className="text-sm text-gray-500">{advancementTotals.accumulatedPercentage.toFixed(2)}%</p>
          </div>
        </div>

        {medicion.data.secciones.map((section, sectionIndex) => (
          <motion.div
            key={section.nombre}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: sectionIndex * 0.1 }}
            className="mt-6 bg-white rounded-lg"
          >
            <h3 className={cn(
              "text-[14px] font-bold bg-input/20 rounded-lg p-2 pl-4 flex items-center justify-between gap-2",
              (!Array.isArray(section.items) || section.items.length === 0) && "text-muted-foreground"
            )}>
              <span className="flex items-center gap-2">
                <Package size={16} strokeWidth={2} aria-hidden="true" />
                {sectionIndex + 1}. {section.nombre.toUpperCase()}
              </span>
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] bg-white">N°</TableHead>
                    <TableHead className="text-left bg-white">Item</TableHead>
                    <TableHead className="text-center bg-white">Acumulado Anterior</TableHead>
                    <TableHead className="text-center bg-white">Avance Mensual</TableHead>
                    <TableHead className="text-center bg-white">Acumulado Actual</TableHead>
                    <TableHead className="text-center bg-white">Monto Actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.items.map((item, itemIndex) => {
                    const presupuestoItem = presupuestoData[section.nombre]?.find(i => String(i.id) === item.id)
                    const currentAmount = (presupuestoItem?.totalPrice || 0) * (Number(item.presente) / 100)
                    const rowNumber = `${sectionIndex + 1}.${itemIndex + 1}`

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-gray-600 border-r">{rowNumber}</TableCell>
                        <TableCell className="border-r">{presupuestoItem?.name}</TableCell>
                        <TableCell className="text-center border-r">{item.anterior}%</TableCell>
                        <TableCell className={cn("text-center group cursor-text border-r", !display && "hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]")}>
                          {display ? (
                            `${item.presente}%`
                          ) : (
                            <EditableInput
                              value={item.presente}
                              onChange={(val) => updateMedicion(
                                section.nombre,
                                item.id,
                                Number(val)
                              )}
                              suffix="%"
                              editable={!display}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center border-r">{item.acumulado}%</TableCell>
                        <TableCell className="text-center">${currentAmount.toLocaleString('es-AR')}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className='flex items-start justify-center gap-8 relative'>
      <div className='flex flex-col gap-2 mb-16'>
        <form onSubmit={handleSubmit} className="max-w-[1000px] flex-1 min-w-[50vw] p-6 bg-white rounded-xl shadow-lg relative border">
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
              Planilla de Mediciones
            </h2>
          </div>

          {error && <p className="text-center text-red-600">{error}</p>}

          {/* The main content */}
          <div className="rounded-lg border-none border-gray-200 space-y-8">
            {renderMedicionPeriod()}
          </div>

          {/* Footer */}
          <div className="text-sm text-center mt-2">
            <p>Página 1 de 1</p>
          </div>
        </form>
      </div>

      {!display && (
        <div className='flex flex-col justify-between gap-8 sticky top-5 z-10'>
          <div className='flex flex-col gap-2'>
            <Dialog open={isPeriodDialogOpen} onOpenChange={setIsPeriodDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  className="h-9 w-full justify-start px-3"
                >
                  <CalendarDaysIcon className="w-4 h-4 mr-2" />
                  Cambiar Periodo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Cambiar Periodo</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Input
                      type="month"
                      value={medicion.periodo.substring(0, 7)}
                      onChange={(e) => handlePeriodChange(e.target.value + "-01")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsPeriodDialogOpen(false)}>Cerrar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Button
            type="submit"
            variant="default"
            className="h-9 w-full justify-start px-3"
            onClick={handleSubmit}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Mediciones
          </Button>
        </div>
      )}
    </div>
  )
}
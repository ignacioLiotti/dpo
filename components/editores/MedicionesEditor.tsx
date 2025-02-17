'use client'

import React, { useState, useEffect } from 'react'
import { Save, CalendarDaysIcon, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { TableItem, GroupedData } from '../../app/presupuesto/types'
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMediciones, useSaveMedicion, Medicion } from '@/hooks/useMediciones'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from "@/lib/utils"
import { EditableInput } from '@/components/Table/EditableInput'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface PresupuestoItem {
  id: string
  name: string
  totalPrice: number
}

interface MedicionesEditorProps {
  medicion: Medicion
  presupuestoData: Record<string, PresupuestoItem[]>
  display: boolean
  obraId?: number
}

export function MedicionesEditor({
  medicion: initialMedicion,
  presupuestoData = {},
  display = false,
  obraId
}: MedicionesEditorProps) {
  const searchParams = useSearchParams()
  const urlPeriod = searchParams.get('periodo')
  const { data: mediciones } = useMediciones(obraId || 0)
  const [medicion, setMedicion] = useState<Medicion>(initialMedicion)

  console.log('presupuestoData', presupuestoData)

  useEffect(() => {
    if (display) {
      // When in display mode, use initialMedicion directly
      setMedicion(initialMedicion)
      return;
    }

    if (!mediciones) return;

    const currentPeriod = urlPeriod || initialMedicion.month || new Date().toISOString().slice(0, 10)

    const [currentYear, currentMonth] = currentPeriod.substring(0, 7).split('-').map(Number)

    // Find closest previous medicion by comparing dates
    const previousMedicion = mediciones.reduce((closest: Medicion | null, m) => {
      const [mYear, mMonth] = m.month.substring(0, 7).split('-').map(Number)


      // Skip if medicion is in the future
      if (mYear > currentYear || (mYear === currentYear && mMonth >= currentMonth)) {
        return closest
      }

      // If no closest yet, use this one
      if (!closest) return m

      const [closestYear, closestMonth] = closest.month.substring(0, 7).split('-').map(Number)

      // Compare which date is closer
      const currentDiff = (currentYear - mYear) * 12 + (currentMonth - mMonth)
      const closestDiff = (currentYear - closestYear) * 12 + (currentMonth - closestMonth)

      return currentDiff < closestDiff ? m : closest
    }, null)


    // If we have a previous medicion, use its accumulated values as the previous values
    if (previousMedicion) {
      setMedicion({
        ...initialMedicion,
        month: currentPeriod,
        measurements: Object.entries(presupuestoData).reduce((acc, [_, items]) => {
          items.forEach(item => {
            const prevMeasurement = previousMedicion.measurements[item.id]
            console.log('prevMeasurement', prevMeasurement)
            if (prevMeasurement) {
              acc[item.id] = {
                monthlyProgress: 0,
                cumulativePrevious: prevMeasurement.cumulativeCurrent,
                cumulativeCurrent: prevMeasurement.cumulativeCurrent
              }
            } else {
              acc[item.id] = {
                monthlyProgress: 0,
                cumulativePrevious: 0,
                cumulativeCurrent: 0
              }
            }
          })
          return acc
        }, {} as Record<string, { monthlyProgress: number; cumulativePrevious: number; cumulativeCurrent: number }>)
      })
    } else {
      setMedicion({
        ...initialMedicion,
        month: currentPeriod,
        measurements: Object.entries(presupuestoData).reduce((acc, [_, items]) => {
          items.forEach(item => {
            acc[item.id] = {
              monthlyProgress: 0,
              cumulativePrevious: 0,
              cumulativeCurrent: 0
            }
          })
          return acc
        }, {} as Record<string, { monthlyProgress: number; cumulativePrevious: number; cumulativeCurrent: number }>)
      })
    }
  }, [mediciones, urlPeriod, initialMedicion, presupuestoData, display])

  const [error, setError] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false)
  const saveMedicion = useSaveMedicion()
  const router = useRouter()

  // Calculate total budget (sum of all items' total prices)
  const totalBudget = React.useMemo(() => {
    return Object.values(presupuestoData).reduce((total: number, items: PresupuestoItem[]) => {
      return total + items.reduce((sectionTotal: number, item: PresupuestoItem) => sectionTotal + Number(item.totalPrice || 0), 0)
    }, 0)
  }, [presupuestoData])

  // Calculate advancement totals for a medicion
  const calculateAdvancementTotals = (medicion: Medicion) => {
    let currentTotal = 0
    let previousTotal = 0

    Object.entries(presupuestoData).forEach(([_, items]: [string, PresupuestoItem[]]) => {
      items.forEach(item => {
        const measurement = medicion.measurements[item.id]
        if (measurement) {
          currentTotal += Number(item.totalPrice) * (Number(measurement.monthlyProgress) / 100)
          previousTotal += Number(item.totalPrice) * (Number(measurement.cumulativePrevious) / 100)
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
    itemId: string,
    field: 'monthlyProgress' | 'cumulativePrevious' | 'cumulativeCurrent',
    value: number
  ) => {
    if (display) return;

    setMedicion(prevMedicion => {
      const existingMeasurement = prevMedicion.measurements[itemId] || {
        monthlyProgress: 0,
        cumulativePrevious: 0,
        cumulativeCurrent: 0
      };

      return {
        ...prevMedicion,
        measurements: {
          ...prevMedicion.measurements,
          [itemId]: {
            ...existingMeasurement,
            [field]: value,
            ...(field === 'monthlyProgress' && {
              cumulativeCurrent: existingMeasurement.cumulativePrevious + value
            })
          }
        }
      };
    });
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (display || !obraId) return;

    try {
      // Transform the data into the format expected by the API
      const formattedData = {
        secciones: Object.entries(presupuestoData).map(([nombre, items]) => ({
          nombre,
          items: items.map(item => {
            const measurement = medicion.measurements[item.id]
            return {
              id: String(item.id),
              anterior: measurement?.cumulativePrevious || 0,
              presente: measurement?.monthlyProgress || 0,
              acumulado: measurement?.cumulativeCurrent || 0
            }
          })
        }))
      }

      await saveMedicion.mutateAsync({
        obraId,
        periodo: medicion.month,
        data: formattedData
      });


      router.push(`/obras/${obraId}`)

      alert('Medición guardada exitosamente!')

    } catch (error) {
      console.error('Error saving medicion:', error)
      setError(error instanceof Error ? error.message : 'Error al guardar la medición')
    }
  }

  // Update scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handlePeriodChange = (newDate: string) => {
    setMedicion(prev => ({
      ...prev,
      month: newDate
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
              Período: {new Date(new Date(medicion.month).setMonth(new Date(medicion.month).getMonth() + 1)).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
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

        {Object.entries(presupuestoData).map(([section, items], sectionIndex) => (
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: sectionIndex * 0.1 }}
            className="mt-6 bg-white rounded-lg "
          >
            <h3 className={cn(
              "text-[14px] font-bold bg-input/20 rounded-lg p-2 pl-4 flex items-center justify-between gap-2",
              (!Array.isArray(items) || items.length === 0) && "text-muted-foreground"
            )}>
              <span className="flex items-center gap-2">
                <Package size={16} strokeWidth={2} aria-hidden="true" />
                {sectionIndex + 1}. {section.toUpperCase()}
              </span>

            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] bg-white">N°</TableHead>
                    <TableHead className="text-left bg-white">Item</TableHead>
                    <TableHead className="text-center bg-white">Acumulado Anterior </TableHead>
                    <TableHead className="text-center bg-white">Avance Mensual </TableHead>
                    <TableHead className="text-center bg-white">Acumulado Actual </TableHead>
                    <TableHead className="text-center bg-white">Monto Actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, itemIndex) => {
                    const measurement = medicion.measurements[item.id]
                    const currentAmount = Number(item.totalPrice) * (Number(measurement?.monthlyProgress) || 0) / 100
                    const rowNumber = `${sectionIndex + 1}.${itemIndex + 1}`

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-gray-600 border-r">{rowNumber}</TableCell>
                        <TableCell className="border-r">{item.name}</TableCell>
                        <TableCell className="text-center border-r">{measurement?.cumulativePrevious || 0}%</TableCell>
                        <TableCell className={cn("text-center group cursor-text border-r", !display && "hover:shadow-[inset_0px_0px_0px_2px_rgba(188,202,220,1)]")}>
                          {display ? (
                            `${measurement?.monthlyProgress || 0}%`
                          ) : (
                            <EditableInput
                              value={measurement?.monthlyProgress || 0}
                              onChange={(val) => updateMedicion(
                                String(item.id),
                                'monthlyProgress',
                                Number(val)
                              )}
                              suffix="%"
                              editable={!display}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center border-r">{measurement?.cumulativeCurrent || 0}%</TableCell>
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
        <form className="max-w-[1000px] min-w-[1000px] p-6 bg-white rounded-xl shadow-lg relative border">
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
                      value={medicion.month.substring(0, 7)}
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
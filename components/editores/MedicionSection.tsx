'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Package, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { motion, useInView } from 'framer-motion'
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface MedicionItem {
  id: number;
  nombre: string;
  unidad: string;
  anterior: number;
  presente: number;
  acumulado: number;
}

interface MedicionSection {
  nombre: string;
  items: MedicionItem[];
}

interface Medicion {
  id: number;
  obra_id: number;
  presupuesto_id: number;
  periodo: string;
  data: {
    secciones: MedicionSection[];
  };
}

interface PresupuestoItem {
  id: number | string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  price: number;
  category: string;
  parcial: number;
  rubro: number;
  accumulated: number;
}

interface MedicionSectionProps {
  presupuestoId: string;
  obraId: number;
  presupuestoData: Record<string, PresupuestoItem[]>;
}

export default function MedicionSection({ presupuestoId, obraId, presupuestoData }: MedicionSectionProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mediciones, setMediciones] = useState<Medicion[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isNewMedicionOpen, setIsNewMedicionOpen] = useState(false)
  const [creatingMedicion, setCreatingMedicion] = useState(false)

  useEffect(() => {
    async function fetchMediciones() {
      try {
        setLoading(true)
        const response = await fetch(`/api/mediciones?presupuestoId=${presupuestoId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch mediciones')
        }
        const data = await response.json()
        setMediciones(data)
      } catch (error) {
        console.error('Error fetching mediciones:', error)
        setError(error instanceof Error ? error.message : 'Error fetching mediciones')
      } finally {
        setLoading(false)
      }
    }

    if (presupuestoId) {
      fetchMediciones()
    }
  }, [presupuestoId])

  const handleCreateMedicion = async () => {
    if (!selectedDate) {
      return;
    }

    try {
      setCreatingMedicion(true)

      // Get the latest medicion to use its values as "anterior"
      const latestMedicion = mediciones[0]

      // Transform presupuesto data into medicion format
      const secciones = Object.entries(presupuestoData).map(([nombre, items]) => ({
        nombre,
        items: items.map(item => {
          // Find the item in the latest medicion if it exists
          const latestItem = latestMedicion?.data.secciones
            .find(s => s.nombre === nombre)?.items
            .find(i => i.id === item.id)

          const anterior = latestItem?.acumulado || 0
          const presente = 0
          const acumulado = anterior + presente

          return {
            id: item.id,
            nombre: item.name,
            unidad: item.unit,
            anterior,
            presente,
            acumulado
          }
        })
      }))

      const response = await fetch('/api/mediciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          obraId,
          presupuestoId,
          periodo: selectedDate.toISOString(),
          data: { secciones }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create medicion')
      }

      const newMedicion = await response.json()
      setMediciones(prev => [newMedicion, ...prev])
      setIsNewMedicionOpen(false)
      setSelectedDate(undefined)
    } catch (error) {
      console.error('Error creating medicion:', error)
      setError(error instanceof Error ? error.message : 'Error creating medicion')
    } finally {
      setCreatingMedicion(false)
    }
  }


  if (loading) return <div>Cargando mediciones...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (mediciones.length === 0) return <div>No hay mediciones registradas</div>

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mediciones</h3>
        <Dialog open={isNewMedicionOpen} onOpenChange={setIsNewMedicionOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 w-full justify-start px-3">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Medición
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nueva Medición</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateMedicion}
                disabled={!selectedDate || creatingMedicion}
              >
                {creatingMedicion ? 'Creando...' : 'Crear Medición'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {mediciones.map((medicion) => (
          <motion.div
            key={medicion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="border rounded-lg"
          >
            <div className="bg-gray-50 px-4 py-2 rounded-t-lg border-b">
              <h4 className="font-medium text-gray-700">
                Periodo: {new Date(medicion.periodo).toLocaleDateString('es-AR')}
              </h4>
            </div>
            <div className="p-4 space-y-6">
              {medicion.data.secciones.map((seccion, sectionIndex) => (
                <div key={seccion.nombre}>
                  <div className="bg-gray-50 px-4 py-2 rounded-lg border-b mb-4">
                    <h5 className="flex items-center gap-2 font-medium text-gray-700">
                      <Package size={16} strokeWidth={2} aria-hidden="true" />
                      {sectionIndex + 1}. {seccion.nombre.toUpperCase()}
                    </h5>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-white">
                          <TableHead className="w-[50px] bg-white">N°</TableHead>
                          <TableHead className="text-left bg-white">Item</TableHead>
                          <TableHead className="text-left bg-white">Unidad</TableHead>
                          <TableHead className="text-right bg-white">Anterior</TableHead>
                          <TableHead className="text-right bg-white">Presente</TableHead>
                          <TableHead className="text-right bg-white">Acumulado</TableHead>
                          <TableHead className="text-right bg-white">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {seccion.items.map((item, itemIndex) => {
                          const rowNumber = `${sectionIndex + 1}.${itemIndex + 1}`
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="text-gray-600">{rowNumber}</TableCell>
                              <TableCell>{item.nombre}</TableCell>
                              <TableCell>{item.unidad}</TableCell>
                              <TableCell className="text-right">{item.anterior.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{item.presente.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{item.acumulado.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                {((item.acumulado / 100) * 100).toFixed(2)}%
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {mediciones.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No hay mediciones registradas
          </div>
        )}
      </div>
    </div>
  )
} 
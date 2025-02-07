'use client'

import React from 'react'
import { BookIcon, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PresupuestoSection } from '@/components/presupuesto/PresupuestoSection'
import { useMedicion } from '@/lib/hooks/useMedicion'
import { GroupedMedicionData } from '../types'

interface MedicionSectionProps {
  presupuestoId: string | number
  initialData: GroupedMedicionData
}

export default function MedicionSection({ presupuestoId, initialData }: MedicionSectionProps) {
  const {
    data,
    mediciones,
    loading,
    error,
    resetToLatestMedicion,
    viewMedicionDetail,
    updateData,
    saveMedicion,
  } = useMedicion({
    presupuestoId,
    initialData,
  })

  if (loading) return <div>Cargando mediciones...</div>
  if (error) return <div>{error}</div>

  return (
    <div className='flex flex-col gap-8'>
      {/* Main content */}
      <div className="rounded-lg border-none border-gray-200 space-y-8">
        {Object.entries(data).map(([tag, items], tagIndex) => (
          <PresupuestoSection
            key={tag}
            tag={tag}
            tagIndex={tagIndex}
            items={items}
            previewVersion="medicion"
            grandTotal={0}
            sectionRubros={[]}
            sectionIacums={[]}
            updateData={(itemId, key, value) => updateData(tag, itemId, key, value)}
            handleDeleteRow={() => { }}
            allElements={[]}
            highlightChanges={false}
          />
        ))}
      </div>

      {/* Sidebar controls */}
      <div className='flex flex-col justify-between gap-8'>
        {mediciones.length > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 w-full justify-start px-3"
              >
                <BookIcon className="w-4 h-4 mr-2" />
                Ver Mediciones Anteriores
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Historial de Mediciones</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-end mb-4">
                  <Button
                    variant="outline"
                    onClick={resetToLatestMedicion}
                  >
                    Volver a Última Medición
                  </Button>
                </div>
                <div className="rounded-lg border shadow-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Elementos Medidos</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mediciones.map((medicion) => (
                        <TableRow key={medicion.id}>
                          <TableCell>
                            {new Date(medicion.data.fecha).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            {medicion.data.items.filter(item => item.presente > 0).length} elementos
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewMedicionDetail(medicion)}
                            >
                              Ver Detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        <Button
          type="button"
          variant="default"
          className="h-9 w-full justify-start px-3"
          onClick={saveMedicion}
        >
          <Save className="w-4 h-4 mr-2" />
          Guardar Medición
        </Button>
      </div>
    </div>
  )
} 
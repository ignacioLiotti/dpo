'use client';

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle, XCircle, AlertCircle, MapPin, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Machine {
  id: string
  name: string
  model: string
  status: 'available' | 'in_use' | 'maintenance' | 'repair'
  specifications: Record<string, any>
}

interface UsageRecord {
  id: string
  machine_id: string
  operator_id: string
  started_at: string
  location: string
  purpose: string
  returned: boolean | null
}

export function StatusPanel({ machineId }: { machineId: string }) {
  const [machine, setMachine] = useState<Machine | null>(null)
  const [currentUsage, setCurrentUsage] = useState<UsageRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchMachineData = async () => {
    try {
      const { data: machineData, error: machineError } = await supabase
        .from('machines')
        .select('*')
        .eq('id', machineId)
        .single()

      if (machineError) throw machineError

      const { data: usageData, error: usageError } = await supabase
        .from('usage_records')
        .select('*, operators(*)')
        .eq('machine_id', machineId)
        .is('returned', null)
        .single()

      if (usageError && usageError.code !== 'PGRST116') throw usageError

      setMachine(machineData)
      setCurrentUsage(usageData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMachineData()

    const machineSubscription = supabase
      .channel('machine-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'machines',
        filter: `id=eq.${machineId}`,
      }, () => {
        fetchMachineData()
      })
      .subscribe()

    const usageSubscription = supabase
      .channel('usage-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'usage_records',
        filter: `machine_id=eq.${machineId}`,
      }, () => {
        fetchMachineData()
      })
      .subscribe()

    return () => {
      machineSubscription.unsubscribe()
      usageSubscription.unsubscribe()
    }
  }, [machineId])

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      repair: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_use':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'maintenance':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'repair':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-500 flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          <span>Error al cargar los datos: {error}</span>
        </div>
      </Card>
    )
  }

  if (!machine) {
    return (
      <Card className="p-6">
        <div className="text-gray-500">Máquina no encontrada</div>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{machine.name}</h2>
          <Badge
            variant="secondary"
            className={`flex items-center gap-1.5 ${getStatusColor(machine.status)}`}
          >
            {getStatusIcon(machine.status)}
            {machine.status === 'available' ? 'Disponible' :
              machine.status === 'in_use' ? 'En uso' :
                machine.status === 'maintenance' ? 'En mantenimiento' : 'En reparación'}
          </Badge>
        </div>

        <div className="space-y-4">
          {currentUsage && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Ubicación actual: {currentUsage.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>En uso desde: {format(new Date(currentUsage.started_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <h3 className="font-medium text-gray-700">Modelo</h3>
              <p className="text-gray-600">{machine.model}</p>
            </div>
            {Object.entries(machine.specifications || {}).map(([key, value]) => (
              <div key={key}>
                <h3 className="font-medium text-gray-700">{key}</h3>
                <p className="text-gray-600">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  )
} 
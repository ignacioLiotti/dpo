'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import type { Machine, UsageRecord } from '../../types';
import {
  CalendarIcon,
  AlertCircleIcon,
  GaugeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowUpCircleIcon,
  BellIcon,
  Loader2Icon
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  machine: Machine;
  usage: UsageRecord[];
}

interface Reminder {
  id: string;
  machine_id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  completed_at?: string;
  completed_by?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  recurring_interval?: string;
  next_occurrence?: string;
}

export function StatusBoard({ machine, usage }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [fetchingReminders, setFetchingReminders] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Calculate total hours used
  const totalHours = usage.reduce((acc, record) => acc + (record.hours_used || 0), 0);

  // Fetch reminders
  useEffect(() => {
    async function fetchReminders() {
      try {
        const { data, error } = await supabase
          .from('machine_reminders')
          .select('*')
          .eq('machine_id', machine.id)
          .order('due_date', { ascending: true });

        if (error) throw error;
        setReminders(data || []);
      } catch (error) {
        console.error('Error fetching reminders:', error);
      } finally {
        setFetchingReminders(false);
      }
    }

    fetchReminders();

    // Set up real-time subscription
    const channel = supabase
      .channel('machine_reminders_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'machine_reminders',
          filter: `machine_id=eq.${machine.id}`
        },
        () => {
          fetchReminders();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [machine.id]);

  // Get the latest completed service and next pending service
  const latestService = reminders
    .filter(r => r.status === 'completed')
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];

  const nextService = reminders
    .filter(r => r.status === 'pending')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  // Helper function to get priority badge styling
  const getPriorityStyle = (priority: Reminder['priority']) => {
    const styles = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return styles[priority];
  };

  // Helper function to get status badge styling
  const getStatusStyle = (status: Reminder['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return styles[status];
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const reminder = {
      machine_id: machine.id,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      due_date: new Date(formData.get('due_date') as string).toISOString(),
      priority: formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent',
      status: 'pending' as const,
      recurring_interval: formData.get('recurring') ? `${formData.get('recurring_value')} ${formData.get('recurring_unit')}` : null
    };

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('machine_reminders')
        .insert([reminder]);

      if (error) throw error;

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error adding reminder:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Panel de Estado</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Agregar Recordatorio</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={onSubmit}>
              <DialogHeader>
                <DialogTitle>Nuevo Recordatorio</DialogTitle>
                <DialogDescription>
                  Configura un recordatorio para mantenimiento o tareas programadas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Título
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    className="col-span-3"
                    placeholder="Ej: Mantenimiento preventivo"
                    required
                  />
                </div>

                <div className="grid grid-cols-[100px,1fr] items-center gap-4">
                  <Label htmlFor="priority" className="text-right col-span-1">
                    Prioridad
                  </Label>
                  <select
                    id="priority"
                    name="priority"
                    className="col-span-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    required
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label htmlFor="due_date" className="text-right">
                    Fecha
                  </Label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="datetime-local"
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descripción
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    className="col-span-3"
                    placeholder="Detalles adicionales del recordatorio"
                  />
                </div>

                <div className="grid grid-cols-[150px,1fr] items-center gap-4">
                  <Label className="text-right">
                    Recurrente
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="recurring"
                      name="recurring"
                      className="h-4 w-4"
                    />
                    <Input
                      type="number"
                      id="recurring_value"
                      name="recurring_value"
                      className="w-20"
                      placeholder="1"
                      min="1"
                    />
                    <select
                      id="recurring_unit"
                      name="recurring_unit"
                      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="days">Días</option>
                      <option value="weeks">Semanas</option>
                      <option value="months">Meses</option>
                      <option value="years">Años</option>
                    </select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <GaugeIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Horas de Uso Total</p>
              <p className="text-2xl font-semibold">{totalHours}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Último Servicio</p>
              <p className="text-lg font-medium">
                {latestService ? (
                  format(new Date(latestService.completed_at!), "d 'de' MMMM, yyyy", { locale: es })
                ) : (
                  'Sin registros'
                )}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <AlertCircleIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Próximo Servicio</p>
              <p className="text-lg font-medium">
                {nextService ? (
                  format(new Date(nextService.due_date), "d 'de' MMMM, yyyy", { locale: es })
                ) : (
                  'Sin programar'
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <BellIcon className="w-4 h-4" />
            Recordatorios
          </h3>
          <Badge variant="outline" className="font-normal">
            {reminders.filter(r => r.status === 'pending').length} pendientes
          </Badge>
        </div>

        {fetchingReminders ? (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay recordatorios registrados
          </p>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {reminders
                .sort((a, b) => {
                  // Sort by status (pending first), then by due date
                  if (a.status === 'pending' && b.status !== 'pending') return -1;
                  if (a.status !== 'pending' && b.status === 'pending') return 1;
                  return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                })
                .map((reminder) => (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{reminder.title}</h4>
                        {reminder.description && (
                          <p className="text-sm text-muted-foreground">
                            {reminder.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityStyle(reminder.priority)}>
                          {reminder.priority}
                        </Badge>
                        <Badge className={getStatusStyle(reminder.status)}>
                          {reminder.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>
                          {format(new Date(reminder.due_date), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                        </span>
                      </div>
                      {reminder.recurring_interval && (
                        <div className="flex items-center gap-1">
                          <ArrowUpCircleIcon className="w-4 h-4" />
                          <span>Recurrente: {reminder.recurring_interval}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </motion.div>
  );
} 
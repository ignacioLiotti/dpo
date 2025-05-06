'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, AlertCircle, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Assignment {
  id: string;
  machine_id: string;
  operator_id: string;
  location: string;
  assigned_at: string;
  unassigned_at: string | null;
}

interface Operator {
  id: string;
  name: string;
}

interface Props {
  machineId: string;
  assignments: Assignment[];
}

export function LocationHistory({ machineId, assignments }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [location, setLocation] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // Fetch operators when component mounts
  useEffect(() => {
    async function fetchOperators() {
      const { data, error } = await supabase
        .from('operators')
        .select('id, name');

      if (error) {
        console.error('Error fetching operators:', error);
        return;
      }

      if (data) {
        setOperators(data);
      }
    }

    fetchOperators();
  }, []);

  // Get the current active assignment
  const currentAssignment = assignments.find(a => !a.unassigned_at);
  const sortedAssignments = [...assignments].sort((a, b) =>
    new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
  );

  // Calculate total time at current location if there is one
  const getTotalTime = (assignment: Assignment) => {
    const start = new Date(assignment.assigned_at);
    const end = assignment.unassigned_at ? new Date(assignment.unassigned_at) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${diffDays} días, ${diffHours} horas`;
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      if (currentAssignment) {
        await supabase
          .from('machine_assignments')
          .update({ unassigned_at: new Date().toISOString() })
          .eq('id', currentAssignment.id);
      }

      const newLocation = {
        machine_id: machineId,
        operator_id: selectedOperator,
        location: location,
        assigned_at: new Date().toISOString(),
      };

      console.log('Attempting to insert:', newLocation);

      const { error: insertError } = await supabase
        .from('machine_assignments')
        .insert([newLocation]);

      if (insertError) {
        console.error('Error inserting new location:', insertError);
        throw insertError;
      }

      await supabase
        .from('machines')
        .update({ location: newLocation.location })
        .eq('id', machineId);

      setOpen(false);
      setLocation('');
      setSelectedOperator('');
      router.refresh();
    } catch (error) {
      console.error('Error updating location:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
      data-location-history
    >
      {/* Header Section */}
      <div className="flex items-center justify-between ">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Última actualización: {currentAssignment ? new Date(currentAssignment.assigned_at).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Actualizar Ubicación</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={onSubmit}>
                <DialogHeader>
                  <DialogTitle>Nueva Ubicación</DialogTitle>
                  <DialogDescription>
                    Registra una nueva ubicación para esta máquina.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-right flex items-center justify-end gap-2">
                      <Label htmlFor="location">Ubicación</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px]">
                            <p>Ingresa una ubicación que pueda ser encontrada en un mapa:</p>
                            <ul className="list-disc pl-4 mt-2 space-y-1">
                              <li>Dirección completa (ej: "Av. Libertador 1234, Buenos Aires")</li>
                              <li>Ciudad y país (ej: "Monterrey, Mexico")</li>
                              <li>Punto de referencia conocido (ej: "Aeropuerto Internacional de la Ciudad de México")</li>
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Ingresa una dirección o lugar específico"
                        className="w-full"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        La ubicación debe ser lo suficientemente específica para ser encontrada en el mapa
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="operator" className="text-right">
                      Responsable
                    </Label>
                    <Select
                      value={selectedOperator}
                      onValueChange={setSelectedOperator}
                      required
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona un operador" />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((operator) => (
                          <SelectItem key={operator.id} value={operator.id}>
                            {operator.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
      </div>

      {/* Timeline Section */}
      <div className="space-y-4">
        {currentAssignment && (
          <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Tiempo total en última ubicación</span>
            </div>
            <span>{getTotalTime(currentAssignment)}</span>
          </div>
        )}

        <div className="relative">
          {sortedAssignments.map((assignment, index) => (
            <div key={assignment.id} className="flex gap-4 pb-8 relative">
              {/* Timeline line */}
              {index !== sortedAssignments.length - 1 && (
                <div className="absolute left-[15px] top-6 bottom-0 w-0.5 bg-border" />
              )}

              {/* Location dot and info */}
              <div className="flex-none">
                <div className={`w-8 h-8 rounded-full border-2 ${index === 0 ? 'bg-primary border-primary' : 'bg-background border-border'} flex items-center justify-center`}>
                  <MapPin className={`h-4 w-4 ${index === 0 ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <p className="font-medium">{assignment.location}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Responsable: {operators.find(op => op.id === assignment.operator_id)?.name || assignment.operator_id}</span>
                  <span>•</span>
                  <span>{new Date(assignment.assigned_at).toLocaleDateString()}</span>
                  {assignment.unassigned_at && (
                    <>
                      <span>•</span>
                      <span>{getTotalTime(assignment)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
} 
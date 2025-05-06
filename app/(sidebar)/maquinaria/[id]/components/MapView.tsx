'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { MapPin, Maximize2, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
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
import { cn } from '@/utils/utils';

interface Props {
  location: string;
  machineId: string;
  assignments?: Array<{
    id: string;
    location: string;
    assigned_at: string;
    unassigned_at: string | null;
  }>;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface Operator {
  id: string;
  name: string;
}

export function MapView({ location, machineId, assignments = [] }: Props) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [newLocation, setNewLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    async function getCoordinates() {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            location
          )}`
        );
        const data = await response.json();

        if (data && data[0]) {
          setCoordinates({
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
        }
      } catch (error) {
        console.error('Error getting coordinates:', error);
      } finally {
        setLoading(false);
      }
    }

    if (location) {
      getCoordinates();
    }
  }, [location]);

  // Function to format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  // Calculate time difference
  const getTimeSpent = (start: string, end: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${diffDays} días, ${diffHours} horas`;
  };

  // Handle location update
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const currentAssignment = assignments.find(a => !a.unassigned_at);

      if (currentAssignment) {
        await supabase
          .from('machine_assignments')
          .update({ unassigned_at: new Date().toISOString() })
          .eq('id', currentAssignment.id);
      }

      const newAssignment = {
        machine_id: machineId,
        operator_id: selectedOperator,
        location: newLocation,
        assigned_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('machine_assignments')
        .insert([newAssignment]);

      if (insertError) {
        console.error('Error inserting new location:', insertError);
        throw insertError;
      }

      await supabase
        .from('machines')
        .update({ location: newLocation })
        .eq('id', machineId);

      setDialogOpen(false);
      setNewLocation('');
      setSelectedOperator('');
      router.refresh();
    } catch (error) {
      console.error('Error updating location:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[85vh]"
    >
      <Card className="h-full">
        <div className="relative h-full">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Cargando mapa...</p>
            </div>
          ) : coordinates ? (
            <>
              {/* Top Controls */}
              <div className="absolute top-4 left-0 right-0 z-10 flex justify-center">
                <div className="flex gap-2">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="facha"
                      >
                        Actualizar Ubicación
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleSubmit}>
                        <DialogHeader>
                          <DialogTitle>Nueva Ubicación</DialogTitle>
                          <DialogDescription>
                            Registra una nueva ubicación para esta máquina.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">
                              Ubicación
                            </Label>
                            <Input
                              id="location"
                              value={newLocation}
                              onChange={(e) => setNewLocation(e.target.value)}
                              className="col-span-3"
                              placeholder="Ingresa una dirección o lugar específico"
                              required
                            />
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
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button variant="outline" size="icon" className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <MapPin className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Location History Panel */}
              <AnimatePresence>
                <motion.div
                  key="location-panel"
                  className="absolute bottom-4 left-4 right-4 z-10"
                >
                  <Card
                    className="bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 p-3 overflow-hidden cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h3 className="font-medium text-sm">Ubicación Actual</h3>
                          <p className="text-sm text-muted-foreground">{location}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-6 hover:bg-transparent"
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronUp className="h-5 w-5" />
                        </motion.div>
                      </Button>
                    </div>

                    {/* Location History */}
                    <motion.div
                      layout
                      initial={false}
                      animate={{
                        height: isExpanded ? "auto" : 0,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut"
                      }}
                      className="overflow-hidden"
                    >
                      <motion.div
                        className="space-y-4 mt-4"
                      >
                        {assignments.map((assignment, index) => (
                          <motion.div
                            key={assignment.id}
                            layout
                            className="flex items-start gap-3 py-2 border-t border-border first:border-t-0"
                          >
                            <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="text-sm">{assignment.location}</p>
                              <div className="flex gap-2 items-center text-xs text-muted-foreground">
                                <span>{formatDate(assignment.assigned_at)}</span>
                                <span>•</span>
                                <span>{getTimeSpent(assignment.assigned_at, assignment.unassigned_at)}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  </Card>
                </motion.div>
              </AnimatePresence>

              <iframe
                className="w-full h-full min-h-[500px] rounded-lg"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng - 0.01
                  }%2C${coordinates.lat - 0.01}%2C${coordinates.lng + 0.01}%2C${coordinates.lat + 0.01
                  }&layer=cyclemap&marker=${coordinates.lat}%2C${coordinates.lng}`}
              />
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No se pudo cargar el mapa para la ubicación especificada
              </p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

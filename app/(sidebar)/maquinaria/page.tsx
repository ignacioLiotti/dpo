import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/utils/supabase/server';
import { getMachines } from './actions';
import { AddMachineDialog } from './components/AddMachineDialog';
import { MapWrapper } from './components/MapWrapper';
import Link from 'next/link';
import { MapPin, Wrench, CheckCircle, AlertTriangle } from 'lucide-react';

export default async function MachineryPage() {
  // fetch data on server
  const machines = await getMachines();

  // compute stats by location
  const locationStats = machines.reduce((acc, machine) => {
    acc[machine.location] = (acc[machine.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // compute status stats
  const totalMachines = machines.length;
  const inUseCount = machines.filter(m => m.status === 'In Use').length;
  const availableCount = machines.filter(m => m.status === 'Available').length;
  const maintenanceCount = machines.filter(m => m.status === 'Maintenance').length;

  return (
    <main className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Seguimiento de Maquinaria</h1>
        <AddMachineDialog />
      </div>

      <Card className="grid grid-cols-1 lg:grid-cols-12 h-full">
        {/* Map Section with Floating Stats */}
        <div className="lg:col-span-7 relative">
          <div className="h-full relative">
            <MapWrapper machines={machines} />
            {/* Floating Stats */}
            <div className="absolute top-4 right-4 z-10 w-48 space-y-2">
              <Card className="bg-background/50 backdrop-blur-sm border shadow-lg">
                <CardContent className="p-4 py-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total</span>
                  </div>
                  <span className="text-lg font-bold">{totalMachines}</span>
                </CardContent>
              </Card>
              <Card className="bg-background/50 backdrop-blur-sm border shadow-lg">
                <CardContent className="p-4 py-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Disponibles</span>
                  </div>
                  <span className="text-lg font-bold">{availableCount}</span>
                </CardContent>
              </Card>
              <Card className="bg-background/50 backdrop-blur-sm border shadow-lg">
                <CardContent className="p-4 py-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">En Uso</span>
                  </div>
                  <span className="text-lg font-bold">{inUseCount}</span>
                </CardContent>
              </Card>
              <Card className="bg-background/50 backdrop-blur-sm border shadow-lg">
                <CardContent className="p-4 py-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Mantenimiento</span>
                  </div>
                  <span className="text-lg font-bold">{maintenanceCount}</span>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Machines Grid */}
        <div className="lg:col-span-5 p-6 border-l">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Maquinarias</h2>
            <ScrollArea className="h-full pr-4">
              <div className="grid grid-cols-1 gap-4">
                {machines.map(machine => (
                  <Link href={`/maquinaria/${machine.id}`} key={machine.id}>
                    <Card className="hover:bg-accent transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold">{machine.type}</h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              {machine.location}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {machine.specs}
                            </p>
                          </div>
                          <Badge
                            variant={
                              machine.status === 'Available' ? 'default' :
                                machine.status === 'In Use' ? 'secondary' :
                                  'destructive'
                            }
                          >
                            {machine.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </Card>
    </main>
  );
}
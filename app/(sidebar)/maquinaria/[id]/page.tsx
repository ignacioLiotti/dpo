import { getMachineById } from '../actions';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MachineProfile } from './components/MachineProfile';
import { LocationHistory } from './components/LocationHistory';
import { StatusBoard } from './components/StatusBoard';
import { Documents } from './components/Documents';
import { MapView } from './components/MapView';
import { UserIcon, FolderArchiveIcon } from 'lucide-react';

export default async function MachinePage({ params }: { params: { id: string } }) {
  const { machine, usage, assignments } = await getMachineById(params.id);

  // Get the most recent active location from assignments
  const currentLocation = machine.location;

  return (
    <Card className="grid grid-cols-1 lg:grid-cols-12 h-full p-4">
      {/* Main Content */}
      <div className="lg:col-span-7 space-y-6 max-w-[700px] min-w-[700px] mx-auto pt-6">
        <Tabs defaultValue="location" className="space-y-4">
          <TabsContent value="location" className="space-y-4">
            <MachineProfile machine={machine} />
            <StatusBoard machine={machine} usage={usage} />
            {/* <LocationHistory
              machineId={machine.id}
              assignments={assignments}
            /> */}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <MachineProfile machine={machine} />
            <Documents machineId={machine.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Side Panel with Map */}
      <div className="lg:col-span-5">
        <MapView
          location={currentLocation}
          machineId={machine.id}
          assignments={assignments}
        />
      </div>
    </Card>
  );
} 
'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import type { Machine } from '../../types';
import { UserIcon } from 'lucide-react';
import { FolderArchiveIcon } from 'lucide-react';
import { TabsList } from '@/components/ui/tabs';
import { TabsTrigger } from '@/components/ui/tabs';

interface Props {
  machine: Machine;
}

export function MachineProfile({ machine }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const updates = {
      type: formData.get('type') as string,
      specs: formData.get('specs') as string,
      location: formData.get('location') as string,
      image_url: formData.get('image_url') as string,
    };

    try {
      const supabase = createClient();
      await supabase.from('machines').update(updates).eq('id', machine.id);
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating machine:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b pb-4"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold">{machine.type}</h1>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${machine.status === 'Available' ? 'bg-green-100 text-green-700' :
              machine.status === 'In Use' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
              {machine.status}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {/* <span>ID: {machine.id}</span> */}
            {/* <span>•</span> */}
            <span>{machine.location}</span>

          </div>
        </div>
        <div className="flex items-end flex-col  gap-2">
          <TabsList className="grid w-40 grid-cols-2">
            <TabsTrigger value="location">
              <UserIcon className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FolderArchiveIcon className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Editar</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={onSubmit}>
                <DialogHeader>
                  <DialogTitle>Editar Máquina</DialogTitle>
                  <DialogDescription>
                    Modifica los detalles de la máquina aquí.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      Tipo
                    </Label>
                    <Input
                      id="type"
                      name="type"
                      defaultValue={machine.type}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="specs" className="text-right">
                      Especificaciones
                    </Label>
                    <Textarea
                      id="specs"
                      name="specs"
                      defaultValue={machine.specs}
                      className="col-span-3"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location" className="text-right">
                      Ubicación
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      defaultValue={machine.location}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="image_url" className="text-right">
                      URL de Imagen
                    </Label>
                    <Input
                      id="image_url"
                      name="image_url"
                      defaultValue={machine.image_url || ''}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

      </div>
    </motion.div>
  );
} 
'use client';
import Link from 'next/link';

import type { Folder } from '@/lib/schemas/document-schemas';
import FolderFront from '@/components/ui/FolderFront';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { createFolderAction } from '@/lib/actions/document-actions';

interface FolderGridProps {
  folders: Folder[];
  folderCounts: Record<string, number>;
  obraId: string;
}

export function FolderGrid({ folders, folderCounts, obraId }: FolderGridProps) {
  return (
    <>
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          documentCount={folderCounts[folder.id] || 0}
          obraId={obraId}
        />
      ))}
      <AddFolderCard obraId={obraId} />
    </>
  );
}

interface FolderCardProps {
  folder: Folder;
  documentCount: number;
  obraId: string;
}

function FolderCard({ folder, documentCount, obraId }: FolderCardProps) {
  return (
    <Link href={`/obras/${obraId}?folder=${folder.id}`} className=" w-28 h-28 group flex items-center justify-center rounded-2xl hover:bg-containerHollowBackground transition-colors">
      <div className="group cursor-pointer hover:bg-muted transition-colors">
        <div className="flex flex-col items-start gap-2 p-3 w-[90px] h-[50px] rounded-2xl hover:bg-muted transition-colors bg-gradient-to-b from-[#4F4F4F] to-[#3D3D3D] relative">
          {/* on hover tilt the top of the folder front with origin from bottom */}
          <FolderFront className="w-[100px] h-[65px] absolute -bottom-4 -left-1  transform origin-[50%_100%] group-hover:[transform:perspective(800px)_rotateX(-30deg)] transition-transform duration-300" />
        </div>
        <div className="flex flex-col items-center p-3 -mt-10 z-10 relative">
          <span className="text-sm font-medium text-white truncate" title={folder.name}>
            {folder.name.charAt(0).toUpperCase() + folder.name.slice(1)}
          </span>
          <span className="text-xs text-white/70">
            {documentCount} archivo{documentCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </Link>
  );
}

interface AddFolderCardProps {
  obraId: string;
}

export function AddFolderCard({ obraId }: AddFolderCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folderName.trim()) {
      toast.error('El nombre de la carpeta es requerido');
      return;
    }

    setIsLoading(true);

    try {
      const result = await createFolderAction({
        obra_id: obraId,
        name: folderName.trim(),
      });

      if (result?.data?.success) {
        toast.success('Carpeta creada correctamente');
        setFolderName('');
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error('Error al crear la carpeta');
      }
    } catch (error) {
      toast.error('Error al crear la carpeta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setIsOpen(false);
  };

  return (
    <>
      <button
        className=" w-28 h-28 group flex items-center justify-center rounded-2xl hover:bg-containerHollowBackground transition-colors group cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div className="group cursor-pointer">
          <div className="flex flex-col items-start gap-2 p-3 w-[90px] h-[50px] rounded-2xl hover:bg-muted transition-colors bg-gradient-to-b from-[#d8d8d8] to-[#f0f0f0] relative">
            <FolderFront className="w-[100px] h-[65px] absolute -bottom-4 -left-1 overflow-visible transform origin-[50%_100%] group-hover:[transform:perspective(800px)_rotateX(-30deg)] transition-transform duration-300" borderDashed={true} firstStopColor="#f8f8f8" secondStopColor="#F22424" />
          </div>
          <div className="flex flex-col items-center p-4 -mt-10 max-w-[90px] z-10 relative overflow-hidden break-words text-center ">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nueva Carpeta</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Nombre de la carpeta</Label>
              <Input
                id="folder-name"
                placeholder="Nombre de la carpeta..."
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !folderName.trim()}
              >
                {isLoading ? 'Creando...' : 'Crear Carpeta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 
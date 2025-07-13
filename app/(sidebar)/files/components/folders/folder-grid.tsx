'use client';
import Link from 'next/link';

import type { Folder } from '../../types';
import FolderFront from '@/components/ui/FolderFront';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, Bot } from 'lucide-react';
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
import { createFolderAction } from '../../actions/document-actions';
import { FolderSettingsDialog } from './folder-settings-dialog';

interface FolderGridProps {
  folders: Folder[];
  folderCounts: Record<string, number>;
}

export function FolderGrid({ folders, folderCounts }: FolderGridProps) {
  return (
    <>
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          documentCount={folderCounts[folder.id] || 0}
        />
      ))}
      <AddFolderCard />
    </>
  );
}

interface FolderCardProps {
  folder: Folder;
  documentCount: number;
}

function FolderCard({ folder, documentCount }: FolderCardProps) {
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSettings(true);
  };

  return (
    <>
      <div className="relative w-28 h-28 group">
        <Link href={`/files?folder=${folder.id}`} className="w-full h-full flex items-center justify-center rounded-2xl hover:bg-containerHollowBackground transition-colors">
          <div className="group cursor-pointer hover:bg-muted transition-colors">
            <div className="flex flex-col items-start gap-2 p-3 w-[90px] h-[50px] rounded-2xl hover:bg-muted transition-colors bg-gradient-to-b from-[#4F4F4F] to-[#3D3D3D] relative">
              {/* Extraction indicator */}
              {folder.extract_data && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center z-20">
                  <Bot className="w-2.5 h-2.5 text-white" />
                </div>
              )}

              {/* on hover tilt the top of the folder front with origin from bottom */}
              <FolderFront className="w-[100px] h-[65px] absolute -bottom-4 -left-1  transform origin-[50%_100%] group-hover:[transform:perspective(800px)_rotateX(-30deg)] transition-transform duration-300" />
            </div>
            <div className="flex flex-col items-center p-3 -mt-10 z-10 relative">
              <span className="text-sm font-medium text-white truncate" title={folder.name}>
                {folder.name.charAt(0).toUpperCase() + folder.name.slice(1)}
              </span>
              <span className="text-xs text-white/70">
                {documentCount} file{documentCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </Link>

        {/* Settings button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSettingsClick}
          className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-white border shadow-sm hover:bg-gray-50 z-30"
        >
          <Settings className="w-3 h-3" />
        </Button>
      </div>

      <FolderSettingsDialog
        folder={folder}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onUpdate={() => {
          // Refresh the page to update folder data
          window.location.reload();
        }}
      />
    </>
  );
}

interface AddFolderCardProps { }

export function AddFolderCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folderName.trim()) {
      toast.error('Folder name is required');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', folderName.trim());

      const result = await createFolderAction(formData);

      toast.success('Folder created successfully');
      setFolderName('');
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Create folder error:', error);
      toast.error(error instanceof Error ? error.message : 'Error creating folder');
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
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder name</Label>
              <Input
                id="folder-name"
                placeholder="Folder name..."
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !folderName.trim()}
              >
                {isLoading ? 'Creating...' : 'Create Folder'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 
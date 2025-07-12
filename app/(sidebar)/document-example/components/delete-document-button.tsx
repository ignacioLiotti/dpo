'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteDocumentButtonProps {
  documentId: string;
  documentTitle: string;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function DeleteDocumentButton({ documentId, documentTitle, deleteAction }: DeleteDocumentButtonProps) {
  const handleSubmit = (e: React.FormEvent) => {
    const confirmed = confirm(`Are you sure you want to delete "${documentTitle}"?`);
    if (!confirmed) {
      e.preventDefault();
    }
  };

  return (
    <form action={deleteAction} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={documentId} />
      <Button variant="destructive" type="submit">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
    </form>
  );
}
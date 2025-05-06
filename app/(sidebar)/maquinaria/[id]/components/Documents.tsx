'use client';

import { useState } from 'react';
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
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { FileIcon, UploadIcon, TrashIcon, XIcon } from 'lucide-react';

interface Props {
  machineId: string;
}

interface Document {
  id: string;
  machine_id: string;
  name: string;
  type: 'invoice' | 'review' | 'certificate';
  url: string;
  created_at: string;
}

const sampleDocuments: Document[] = [
  {
    id: '1',
    machine_id: '',
    name: 'Factura de Compra',
    type: 'invoice',
    url: '/documents/invoice1.pdf',
    created_at: '2024-03-15T10:00:00Z'
  },
  {
    id: '2',
    machine_id: '',
    name: 'Certificado de Garantía',
    type: 'certificate',
    url: '/documents/cert1.pdf',
    created_at: '2024-03-14T15:30:00Z'
  },
  {
    id: '3',
    machine_id: '',
    name: 'Revisión Técnica Anual',
    type: 'review',
    url: '/documents/review1.pdf',
    created_at: '2024-03-13T09:15:00Z'
  },
  {
    id: '4',
    machine_id: '',
    name: 'Manual de Mantenimiento',
    type: 'certificate',
    url: '/documents/manual1.pdf',
    created_at: '2024-03-12T14:20:00Z'
  },
  {
    id: '5',
    machine_id: '',
    name: 'Historial de Reparaciones',
    type: 'review',
    url: '/documents/history1.pdf',
    created_at: '2024-03-11T11:45:00Z'
  }
];

const getDocumentContent = (type: Document['type']) => {
  switch (type) {
    case 'invoice':
      return {
        title: 'Factura',
        content: `
          FACTURA Nº: INV-2024-001
          Fecha: 15/03/2024
          
          Cliente: Empresa de Construcción S.A.
          NIF: B12345678
          
          Descripción:
          1. Maquinaria Industrial Modelo X-1000
          2. Instalación y configuración
          3. Garantía extendida 2 años
          
          Subtotal: 45,000.00€
          IVA (21%): 9,450.00€
          Total: 54,450.00€
          
          Forma de pago: Transferencia bancaria
          Cuenta: ES12 3456 7890 1234 5678 9012
        `
      };
    case 'certificate':
      return {
        title: 'Certificado',
        content: `
          CERTIFICADO DE GARANTÍA
          
          Por la presente se certifica que:
          
          La maquinaria modelo X-1000
          Número de serie: SN2024-001
          
          Ha sido fabricada según los estándares de calidad
          ISO 9001:2015 y cumple con todas las normativas
          de seguridad vigentes en la Unión Europea.
          
          Este certificado garantiza el correcto funcionamiento
          del equipo por un período de 24 meses desde la
          fecha de instalación.
          
          Fecha de emisión: 14/03/2024
          Inspector: Juan Pérez
          Número de certificado: CERT-2024-001
        `
      };
    case 'review':
      return {
        title: 'Informe de Revisión',
        content: `
          INFORME DE REVISIÓN TÉCNICA
          
          Fecha de inspección: 13/03/2024
          Técnico: María García
          
          Estado general: Excelente
          
          Puntos revisados:
          ✓ Sistema hidráulico
          ✓ Sistema eléctrico
          ✓ Sistema de seguridad
          ✓ Calibración
          ✓ Niveles de aceite
          
          Observaciones:
          - Se realizó mantenimiento preventivo
          - Se actualizó el software de control
          - Se reemplazaron filtros
          
          Próxima revisión: 13/09/2024
        `
      };
  }
};

export function Documents({ machineId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>(sampleDocuments);
  const [selectedDoc, setSelectedDoc] = useState<Document>(sampleDocuments[0]);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const file = formData.get('file') as File;
    const type = formData.get('type') as Document['type'];
    const name = formData.get('name') as string;

    try {
      const supabase = createClient();

      // Upload file to storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`${machineId}/${file.name}`, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert([{
          machine_id: machineId,
          name,
          type,
          url: fileData.path,
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error adding document:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteDocument(id: string, url: string) {
    try {
      const supabase = createClient();

      // Delete file from storage
      await supabase.storage.from('documents').remove([url]);

      // Delete document record
      await supabase.from('documents').delete().eq('id', id);

      router.refresh();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  }

  const currentDocIndex = documents.findIndex(doc => doc.id === selectedDoc.id);

  const goToNextDoc = () => {
    if (currentDocIndex < documents.length - 1) {
      setSelectedDoc(documents[currentDocIndex + 1]);
    }
  };

  const goToPrevDoc = () => {
    if (currentDocIndex > 0) {
      setSelectedDoc(documents[currentDocIndex - 1]);
    }
  };

  return (
    <div className="min-h-[600px] relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Documentos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UploadIcon className="w-4 h-4 mr-2" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={onSubmit}>
              <DialogHeader>
                <DialogTitle>Subir Documento</DialogTitle>
                <DialogDescription>
                  Sube facturas, revisiones, certificados u otros documentos relacionados.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tipo
                  </Label>
                  <select
                    id="type"
                    name="type"
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    required
                  >
                    <option value="invoice">Factura</option>
                    <option value="review">Revisión</option>
                    <option value="certificate">Certificado</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="file" className="text-right">
                    Archivo
                  </Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Subiendo...' : 'Subir'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div
        className="relative w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card className="p-8 shadow-xl">
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <FileIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">
                  {getDocumentContent(selectedDoc.type)?.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDoc.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDocument(selectedDoc.id, selectedDoc.url);
                }}
              >
                <TrashIcon className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <div className="min-h-[400px] whitespace-pre-line font-mono text-sm">
              {getDocumentContent(selectedDoc.type)?.content}
            </div>
          </div>
        </Card>

        {/* Document pagination */}
        <div className="absolute -bottom-20 left-0 right-0">
          <div className="flex justify-center gap-4">
            {documents.map((doc, index) => (
              <motion.div
                key={`preview-${doc.id}`}
                className="relative"
                initial={false}
                animate={{
                  scale: selectedDoc.id === doc.id ? 1.1 : 1
                }}
                transition={{
                  duration: 0.2
                }}
              >
                <Card
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-16 h-16 p-2 flex flex-col items-center justify-center cursor-pointer transition-all
                    ${selectedDoc.id === doc.id
                      ? 'ring-2 ring-primary shadow-lg'
                      : 'opacity-50 hover:opacity-100'
                    }`}
                >
                  <FileIcon className="w-4 h-4 text-primary mb-1" />
                  <p className="text-[10px] truncate w-full text-center">
                    {doc.name}
                  </p>
                </Card>
                {selectedDoc.id === doc.id && (
                  <motion.div
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    layoutId="documentIndicator"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="absolute inset-y-0 -left-4 -right-4 flex items-center justify-between pointer-events-none">
          <Button
            variant="ghost"
            size="icon"
            className={`pointer-events-auto ${currentDocIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
            onClick={goToPrevDoc}
            disabled={currentDocIndex === 0}
          >
            <motion.div
              initial={{ x: 10 }}
              animate={{ x: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              ←
            </motion.div>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`pointer-events-auto ${currentDocIndex === documents.length - 1 ? 'opacity-0' : 'opacity-100'}`}
            onClick={goToNextDoc}
            disabled={currentDocIndex === documents.length - 1}
          >
            <motion.div
              initial={{ x: -10 }}
              animate={{ x: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              →
            </motion.div>
          </Button>
        </div>
      </motion.div>
    </div>
  );
} 
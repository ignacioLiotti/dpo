'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Plus, Bot } from 'lucide-react';
import { createDefaultFieldDefinitions, getFolderFieldDefinitions } from '../actions/folder-extraction-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Folder } from '../types';

interface FolderFieldSetupProps {
  folder: Folder;
  fieldCount: number;
  className?: string;
}

export function FolderFieldSetup({ folder, fieldCount, className }: FolderFieldSetupProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  const handleCreateDefaults = async () => {
    setIsCreating(true);
    
    try {
      const result = await createDefaultFieldDefinitions(folder.id);
      
      if (result.message) {
        toast.success(result.message);
      } else {
        toast.success('Campos por defecto creados exitosamente');
      }
      
      router.refresh(); // Refresh to show the new field definitions
    } catch (error) {
      console.error('Error creating default fields:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear campos por defecto');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCheckFields = async () => {
    setIsChecking(true);
    
    try {
      const result = await getFolderFieldDefinitions(folder.id);
      
      console.log('Field definitions check result:', result);
      toast.info(`Found ${result.fields?.length || 0} field definitions (check console for details)`);
    } catch (error) {
      console.error('Error checking field definitions:', error);
      toast.error(error instanceof Error ? error.message : 'Error al verificar campos');
    } finally {
      setIsChecking(false);
    }
  };

  // Show if folder has extraction enabled (regardless of field count for debugging)
  if (!folder.extract_data) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-500" />
          {fieldCount === 0 ? 'Configuración Requerida' : 'Configuración de Extracción'}
        </CardTitle>
        <CardDescription>
          {fieldCount === 0 
            ? 'Esta carpeta tiene extracción de datos habilitada pero no tiene campos configurados.'
            : `Esta carpeta tiene ${fieldCount} campo${fieldCount !== 1 ? 's' : ''} configurado${fieldCount !== 1 ? 's' : ''} para extracción.`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          Para que la extracción de datos funcione, necesitas definir qué campos extraer de los documentos.
        </div>
        
        <div className="flex flex-col gap-2">
          {fieldCount === 0 ? (
            <Button
              onClick={handleCreateDefaults}
              disabled={isCreating}
              size="sm"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? 'Creando...' : 'Crear Campos Por Defecto'}
            </Button>
          ) : (
            <Button
              onClick={handleCheckFields}
              disabled={isChecking}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              {isChecking ? 'Verificando...' : 'Verificar Campos'}
            </Button>
          )}
          
          <div className="text-xs text-muted-foreground">
            {fieldCount === 0 
              ? 'Los campos por defecto incluyen: tipo de documento, número, fecha, monto y proveedor.'
              : 'Click para verificar la configuración actual en la consola.'
            }
          </div>
        </div>

        <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-start gap-2">
            <Bot className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <strong>Tip:</strong> Una vez que configures los campos, los documentos se procesarán automáticamente cuando los subas a esta carpeta.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
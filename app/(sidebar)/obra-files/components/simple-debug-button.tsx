'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';
import { toast } from 'sonner';

interface SimpleDebugButtonProps {
  folderId: string;
}

export function SimpleDebugButton({ folderId }: SimpleDebugButtonProps) {
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    
    try {
      // Run both debug APIs
      const [debugResponse, testResponse] = await Promise.all([
        fetch(`/api/debug/folder-extraction/${folderId}`),
        fetch('/api/test-extraction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderId })
        })
      ]);
      
      const debugData = await debugResponse.json();
      const testData = await testResponse.json();
      
      console.log('🔍 FOLDER DEBUG RESULTS:', debugData);
      console.log('🧪 EXTRACTION TEST RESULTS:', testData);
      
      const fieldCount = debugData.fieldDefinitions?.length || 0;
      const extractedCount = debugData.extractedDataRecords?.length || 0;
      const activeFieldCount = testData.testData?.activeFieldsCount || 0;
      
      // Summary message
      toast.info(`Campos totales: ${fieldCount}, Activos: ${activeFieldCount}, Datos: ${extractedCount}`, {
        duration: 8000
      });
      
      // Detailed analysis
      if (fieldCount === 0) {
        console.log('❌ ISSUE: No field definitions found');
        toast.error('No hay definiciones de campos configuradas');
      } else if (activeFieldCount === 0) {
        console.log('❌ ISSUE: Field definitions exist but none are active');
        toast.error('Campos existen pero ninguno está activo');
      } else if (extractedCount === 0) {
        console.log('❌ ISSUE: Active field definitions exist but no extracted data');
        toast.warning('Campos activos configurados pero no hay datos extraídos');
        console.log('🔧 RECOMMENDATION:', testData.recommendations);
      } else {
        console.log('✅ Field definitions and extracted data both exist');
        toast.success('Campos y datos extraídos encontrados correctamente');
      }
      
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Error en debug: ' + (error instanceof Error ? error.message : 'Unknown'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={runDebug}
      disabled={loading}
      size="sm"
      variant="outline"
      className="w-full"
    >
      <Bug className="w-4 h-4 mr-2" />
      {loading ? 'Analizando...' : 'Debug Completo'}
    </Button>
  );
}
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  PresupuestoData,
  PresupuestoItem,
  GroupedPresupuestoData,
  MedicionData,
  MedicionItem,
} from '@/lib/types/presupuesto';

interface PresupuestoContextType {
  // Presupuesto data
  presupuesto: PresupuestoData | null;
  presupuestoItems: GroupedPresupuestoData;
  updatePresupuestoItem: (
    tag: string,
    itemId: string,
    key: keyof PresupuestoItem,
    value: string
  ) => void;
  addItemToSection: (tag: string, item: PresupuestoItem) => void;
  removeItemFromSection: (tag: string, itemId: string) => void;
  calculateTotals: () => { total: number; sectionTotals: { [key: string]: number } };

  // Mediciones
  mediciones: MedicionData[];
  currentMedicion: GroupedPresupuestoData | null;
  updateMedicionItem: (
    tag: string,
    itemId: string,
    presente: number
  ) => void;
  saveMedicion: () => Promise<void>;
  loadMedicion: (medicionId: number) => void;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

// Helper type for items in currentMedicion
type CurrentMedicionItem = PresupuestoItem & {
  anterior: number;
  presente: number;
  acumulado: number;
  completedAmount: number;
};

type CurrentMedicionData = {
  [key: string]: CurrentMedicionItem[];
};

const PresupuestoContext = createContext<PresupuestoContextType | undefined>(undefined);

export function PresupuestoProvider({
  children,
  initialPresupuesto,
}: {
  children: ReactNode;
  initialPresupuesto?: PresupuestoData;
}) {
  const [presupuesto, setPresupuesto] = useState<PresupuestoData | null>(
    initialPresupuesto || null
  );
  const [presupuestoItems, setPresupuestoItems] = useState<GroupedPresupuestoData>(
    initialPresupuesto?.data || {}
  );
  const [mediciones, setMediciones] = useState<MedicionData[]>([]);
  const [currentMedicion, setCurrentMedicion] = useState<CurrentMedicionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate totals for presupuesto
  const calculateTotals = useCallback(() => {
    const sectionTotals: { [key: string]: number } = {};
    let total = 0;

    Object.entries(presupuestoItems).forEach(([tag, items]) => {
      const sectionTotal = items.reduce((acc, item) => acc + (item.total || 0), 0);
      sectionTotals[tag] = sectionTotal;
      total += sectionTotal;
    });

    return { total, sectionTotals };
  }, [presupuestoItems]);

  // Update presupuesto item
  const updatePresupuestoItem = useCallback((
    tag: string,
    itemId: string,
    key: keyof PresupuestoItem,
    value: string
  ) => {
    setPresupuestoItems(prev => {
      const newItems = { ...prev };
      const itemIndex = newItems[tag].findIndex(item => item.id === itemId);

      if (itemIndex === -1) return prev;

      const item = { ...newItems[tag][itemIndex] };
      (item[key] as any) = value;

      // Recalculate total if quantity or unitPrice changes
      if (key === 'quantity' || key === 'unitPrice') {
        item.total = (parseFloat(item.quantity.toString()) || 0) *
          (parseFloat(item.unitPrice.toString()) || 0);
      }

      newItems[tag][itemIndex] = item;
      return newItems;
    });
  }, []);

  // Add item to section
  const addItemToSection = useCallback((tag: string, item: PresupuestoItem) => {
    setPresupuestoItems(prev => ({
      ...prev,
      [tag]: [...(prev[tag] || []), item],
    }));
  }, []);

  // Remove item from section
  const removeItemFromSection = useCallback((tag: string, itemId: string) => {
    setPresupuestoItems(prev => ({
      ...prev,
      [tag]: prev[tag].filter(item => item.id !== itemId),
    }));
  }, []);

  // Update medicion item with fixed types
  const updateMedicionItem = useCallback((
    tag: string,
    itemId: string,
    presente: number
  ) => {
    if (!currentMedicion) return;

    setCurrentMedicion(prev => {
      if (!prev) return prev;

      const newItems = { ...prev };
      const itemIndex = newItems[tag].findIndex(item => item.id === itemId);

      if (itemIndex === -1) return prev;

      const item = newItems[tag][itemIndex];
      const anterior = item.anterior;

      // Validation: New percentage can't be less than previous
      if (presente < anterior) {
        setError(`El porcentaje no puede ser menor al anterior (${anterior}%)`);
        return prev;
      }

      // Validation: Can't exceed 100%
      if (presente > 100) {
        setError("El porcentaje no puede superar el 100%");
        return prev;
      }

      newItems[tag][itemIndex] = {
        ...item,
        presente,
        acumulado: presente,
        completedAmount: (item.total * presente) / 100,
      };

      return newItems;
    });
  }, [currentMedicion]);

  // Save medicion with fixed types
  const saveMedicion = useCallback(async () => {
    if (!presupuesto || !currentMedicion) return;

    try {
      setIsLoading(true);
      setError(null);

      // Calculate totals
      let totalCompleted = 0;
      let totalAmount = 0;

      Object.values(currentMedicion).forEach(items => {
        items.forEach(item => {
          totalCompleted += item.completedAmount;
          totalAmount += item.total;
        });
      });

      const completedPercentage = (totalCompleted / totalAmount) * 100;

      // Save medicion
      const response = await fetch(`/api/presupuestos/${presupuesto.id}/mediciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presupuestoId: presupuesto.id,
          totalCompleted,
          completedPercentage,
          data: currentMedicion,
        }),
      });

      if (!response.ok) throw new Error('Error al guardar la medición');

      const newMedicion = await response.json();
      setMediciones(prev => [newMedicion, ...prev]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la medición');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [presupuesto, currentMedicion]);

  // Load medicion
  const loadMedicion = useCallback(async (medicionId: number) => {
    if (!presupuesto) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/presupuestos/${presupuesto.id}/mediciones/${medicionId}`);
      if (!response.ok) throw new Error('Error al cargar la medición');

      const medicion = await response.json();
      setCurrentMedicion(medicion.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la medición');
    } finally {
      setIsLoading(false);
    }
  }, [presupuesto]);

  return (
    <PresupuestoContext.Provider
      value={{
        presupuesto,
        presupuestoItems,
        updatePresupuestoItem,
        addItemToSection,
        removeItemFromSection,
        calculateTotals,
        mediciones,
        currentMedicion,
        updateMedicionItem,
        saveMedicion,
        loadMedicion,
        isLoading,
        error,
      }}
    >
      {children}
    </PresupuestoContext.Provider>
  );
}

export function usePresupuesto() {
  const context = useContext(PresupuestoContext);
  if (context === undefined) {
    throw new Error('usePresupuesto must be used within a PresupuestoProvider');
  }
  return context;
} 
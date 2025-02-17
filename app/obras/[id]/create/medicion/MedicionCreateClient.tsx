"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MedicionesEditor } from "@/components/editores/MedicionesEditor";
import type { Medicion } from "@/hooks/useMediciones";
import { format, addMonths, isBefore, isAfter, startOfMonth, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface PresupuestoItem {
  id: number;
  name: string;
  unit: string;
  price: number;
  rubro: number;
  quantity?: number;
  totalPrice?: number;
}

interface MedicionCreateClientProps {
  obraId: string;
  obraName: string;
  presupuestoData: Record<string, PresupuestoItem[]>;
  fechaInicio: string;
  fechaFin: string;
}

export default function MedicionCreateClient({
  obraId,
  obraName,
  presupuestoData,
  fechaInicio,
  fechaFin,
}: MedicionCreateClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const urlPeriod = searchParams.get('periodo');
    if (urlPeriod) {
      // Parse the date string and adjust for timezone
      const [year, month, day] = urlPeriod.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-based in JS Date
      return date;
    }
    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);
    const today = startOfMonth(new Date());

    // If today is within the range, use it
    if (isBefore(today, endDate) && isAfter(today, startDate)) {
      return today;
    }
    // Otherwise use the start date
    return startDate;
  });

  // Create an empty medicion structure
  const emptyMedicion: Medicion = {
    id: 0,
    month: currentDate.toISOString(),
    measurements: {},
  };

  if (!presupuestoData) {
    return <div>No se encontró presupuesto</div>;
  }

  // Get all months between start and end date
  const getMonthsInRange = () => {
    const months = [];
    let currentMonth = startOfMonth(new Date(fechaInicio));
    const endDate = startOfMonth(new Date(fechaFin));

    while (isBefore(currentMonth, endDate) || isSameMonth(currentMonth, endDate)) {
      months.push(new Date(currentMonth));
      currentMonth = addMonths(currentMonth, 1);
    }
    return months;
  };

  const monthsInRange = getMonthsInRange();

  0  // Transform presupuestoData into the format expected by MedicionesEditor
  const transformedPresupuestoData = Object.entries(presupuestoData).reduce(
    (acc, [sectionName, items]) => {
      // Skip empty sections or the 'categoria' section if it's empty
      console.log('items', items)
      if (!items || items.length === 0 || (sectionName === 'categoria' && items.length === 1 && items[0].name === 'item')) {
        return acc;
      }

      acc[sectionName] = items.map((item) => ({
        id: String(item.id),
        name: item.name,
        totalPrice: item.price * (item.quantity || 1), // Use quantity if available, default to 1
      }));
      return acc;
    },
    {} as Record<string, { id: string; name: string; totalPrice: number }[]>
  );

  const handleMonthChange = (newDate: Date) => {
    setCurrentDate(newDate);
    const formattedDate = format(newDate, 'yyyy-MM-dd');
    const params = new URLSearchParams(searchParams.toString());
    params.set('periodo', formattedDate);
    router.push(`?${params.toString()}`);
  };

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Seleccione un período:
        </h3>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <div className="flex p-4 gap-2">
            {monthsInRange.map((date, index) => {
              const isSelected = isSameMonth(date, currentDate);
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleMonthChange(date)}
                  className={`
                    inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                    transition-colors min-w-[50px] justify-center
                    ${isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }
                  `}
                >
                  {format(date, 'MMMM yyyy', { locale: es })}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <MedicionesEditor
        medicion={{
          ...emptyMedicion,
          month: currentDate.toISOString(),
        }}
        presupuestoData={transformedPresupuestoData}
        display={false}
        obraId={Number(obraId)}
      />
    </div>
  );
} 
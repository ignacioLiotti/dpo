"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MedicionesEditor } from "@/components/editores/MedicionesEditor";
import type { Medicion, MedicionItem, MedicionSection, TableItem } from "@/types";
import { format, addMonths, isBefore, isAfter, startOfMonth, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useObra } from "@/app/providers/ObraProvider";

interface MedicionCreateClientProps {
  obraId: string;
  obraName: string;
  presupuestoData: Record<string, TableItem[]>;
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

  const { state } = useObra();
  const { mediciones } = state;

  // Create an empty medicion structure with previous data if available
  const emptyMedicion: Medicion = useMemo(() => {
    const currentPeriod = currentDate.toISOString();
    const [currentYear, currentMonth] = currentPeriod.substring(0, 7).split('-').map(Number);

    // Find closest previous medicion by comparing dates
    const previousMedicion = mediciones?.reduce((closest: Medicion | null, m: Medicion) => {
      const [mYear, mMonth] = m.periodo.substring(0, 7).split('-').map(Number);

      // Skip if medicion is in the future
      if (mYear > currentYear || (mYear === currentYear && mMonth >= currentMonth)) {
        return closest;
      }

      // If no closest yet, use this one
      if (!closest) return m;

      const [closestYear, closestMonth] = closest.periodo.substring(0, 7).split('-').map(Number);

      // Compare which date is closer
      const currentDiff = (currentYear - mYear) * 12 + (currentMonth - mMonth);
      const closestDiff = (currentYear - closestYear) * 12 + (currentMonth - closestMonth);

      return currentDiff < closestDiff ? m : closest;
    }, null);

    // Create sections with previous data if available
    const secciones: MedicionSection[] = Object.entries(presupuestoData).map(([name, items]) => {
      const prevSection = previousMedicion?.data.secciones.find(s => s.nombre === name);
      return {
        nombre: name,
        items: items.map(item => {
          const prevItem = prevSection?.items.find(i => String(i.id) === item.id);
          return {
            id: item.id,
            anterior: prevItem?.acumulado || 0,
            presente: 0,
            acumulado: prevItem?.acumulado || 0
          };
        })
      };
    });

    return {
      id: 0,
      periodo: currentDate.toISOString(),
      obra_id: Number(obraId),
      presupuesto_id: 0,
      data: {
        secciones
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }, [currentDate, mediciones, presupuestoData, obraId]);

  console.log('aca emptyMedicion', emptyMedicion);

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
                      : 'bg-containerHollowBackground hover:bg-containerHollowBackground/80 text-muted-foreground'
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
        medicion={emptyMedicion}
        presupuestoData={presupuestoData}
        display={false}
        obraId={Number(obraId)}
      />
    </div>
  );
} 
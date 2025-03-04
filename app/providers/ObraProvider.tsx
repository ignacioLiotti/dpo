'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Obra, Presupuesto, Medicion, Certificado } from '@/types';

// Remove the local interface definitions since we're importing them
interface ObraState {
  obra: Obra | null;
  presupuestos: Presupuesto[];
  mediciones: Medicion[];
  certificados: Certificado[];
  loading: boolean;
  error: string | null;
}

type ObraAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_OBRA'; payload: Obra }
  | { type: 'SET_PRESUPUESTOS'; payload: Presupuesto[] }
  | { type: 'SET_MEDICIONES'; payload: Medicion[] }
  | { type: 'SET_CERTIFICADOS'; payload: Certificado[] }
  | { type: 'UPDATE_OBRA'; payload: Partial<Obra> }
  | { type: 'ADD_PRESUPUESTO'; payload: Presupuesto }
  | { type: 'ADD_MEDICION'; payload: Medicion }
  | { type: 'ADD_CERTIFICADO'; payload: Certificado };

// Context
const ObraContext = createContext<{
  state: ObraState;
  dispatch: React.Dispatch<ObraAction>;
  refetchAll: () => Promise<void>;
} | null>(null);

// Reducer
function obraReducer(state: ObraState, action: ObraAction): ObraState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_OBRA':
      return { ...state, obra: action.payload };
    case 'SET_PRESUPUESTOS':
      return { ...state, presupuestos: action.payload };
    case 'SET_MEDICIONES':
      return { ...state, mediciones: action.payload };
    case 'SET_CERTIFICADOS':
      return { ...state, certificados: action.payload };
    case 'UPDATE_OBRA':
      return { ...state, obra: { ...state.obra, ...action.payload } as Obra };
    case 'ADD_PRESUPUESTO':
      return { ...state, presupuestos: [...state.presupuestos, action.payload] };
    case 'ADD_MEDICION':
      return { ...state, mediciones: [...state.mediciones, action.payload] };
    case 'ADD_CERTIFICADO':
      return { ...state, certificados: [...state.certificados, action.payload] };
    default:
      return state;
  }
}

// Provider Component
export function ObraProvider({
  children,
  obraId,
}: {
  children: React.ReactNode;
  obraId: string | number;
}) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(obraReducer, {
    obra: null,
    presupuestos: [],
    mediciones: [],
    certificados: [],
    loading: true,
    error: null,
  });

  // Fetch obra data
  const { data: obra, isLoading: isLoadingObra, error: obraError } = useQuery({
    queryKey: ['obra', obraId],
    queryFn: async () => {
      const response = await fetch(`/api/obras/${obraId}`);
      if (!response.ok) throw new Error('Failed to fetch obra');
      return response.json();
    },
    staleTime: Infinity, // Keep the data fresh indefinitely
    refetchOnWindowFocus: false,
  });

  // Fetch presupuestos
  const { data: presupuestos, isLoading: isLoadingPresupuestos, error: presupuestosError } = useQuery({
    queryKey: ['presupuestos', obraId],
    queryFn: async () => {
      const response = await fetch(`/api/presupuestos?obraId=${obraId}`);
      if (!response.ok) throw new Error('Failed to fetch presupuestos');
      return response.json();
    },
    staleTime: Infinity, // Keep the data fresh indefinitely
    refetchOnWindowFocus: false,
  });

  // Fetch mediciones
  const { data: mediciones, isLoading: isLoadingMediciones, error: medicionesError } = useQuery({
    queryKey: ['mediciones', obraId],
    queryFn: async () => {
      const response = await fetch(`/api/mediciones?obraId=${obraId}`);
      if (!response.ok) throw new Error('Failed to fetch mediciones');
      return response.json();
    },
    staleTime: Infinity, // Keep the data fresh indefinitely
    refetchOnWindowFocus: false,
  });

  // Fetch certificados
  const { data: certificados, isLoading: isLoadingCertificados, error: certificadosError } = useQuery({
    queryKey: ['certificados', obraId],
    queryFn: async () => {
      const response = await fetch(`/api/certificados?obraId=${obraId}`);
      if (!response.ok) throw new Error('Failed to fetch certificados');
      return response.json();
    },
    staleTime: Infinity, // Keep the data fresh indefinitely
    refetchOnWindowFocus: false,
  });

  // Update loading state
  useEffect(() => {
    const isLoading = isLoadingObra || isLoadingPresupuestos || isLoadingMediciones || isLoadingCertificados;
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, [isLoadingObra, isLoadingPresupuestos, isLoadingMediciones, isLoadingCertificados]);

  // Update error state
  useEffect(() => {
    const error = obraError || presupuestosError || medicionesError || certificadosError;
    if (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'An error occurred' });
    } else {
      dispatch({ type: 'SET_ERROR', payload: null });
    }
  }, [obraError, presupuestosError, medicionesError, certificadosError]);

  // Update state when data changes
  useEffect(() => {
    if (obra) dispatch({ type: 'SET_OBRA', payload: obra });
    if (presupuestos) dispatch({ type: 'SET_PRESUPUESTOS', payload: presupuestos });
    if (mediciones) dispatch({ type: 'SET_MEDICIONES', payload: mediciones });
    if (certificados) dispatch({ type: 'SET_CERTIFICADOS', payload: certificados });

    // Log the entire state after updates
    console.log('ObraProvider State:', {
      obra,
      presupuestos,
      mediciones,
      certificados,
      loading: isLoadingObra || isLoadingPresupuestos || isLoadingMediciones || isLoadingCertificados,
      error: obraError || presupuestosError || medicionesError || certificadosError
    });
  }, [obra, presupuestos, mediciones, certificados, isLoadingObra, isLoadingPresupuestos, isLoadingMediciones, isLoadingCertificados, obraError, presupuestosError, medicionesError, certificadosError]);

  // Function to refetch all data
  const refetchAll = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['obra', obraId] }),
        queryClient.invalidateQueries({ queryKey: ['presupuestos', obraId] }),
        queryClient.invalidateQueries({ queryKey: ['mediciones', obraId] }),
        queryClient.invalidateQueries({ queryKey: ['certificados', obraId] }),
      ]);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh data' });
    }
  };

  return (
    <ObraContext.Provider value={{ state, dispatch, refetchAll }}>
      {children}
    </ObraContext.Provider>
  );
}

// Custom hook to use the context
export function useObra() {
  const context = useContext(ObraContext);
  if (!context) {
    throw new Error('useObra must be used within an ObraProvider');
  }
  return context;
} 
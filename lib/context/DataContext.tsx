"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { DataType } from "@/app/controllers/data.controller";

type DataContextType = {
  data: Record<string, any>;
  loading: boolean;
  error: string | null;
  fetchData: (type: DataType, id?: number) => Promise<any>;
  createData: (type: DataType, data: any) => Promise<any>;
  updateData: (type: DataType, id: number, data: any) => Promise<any>;
  deleteData: (type: DataType, id: number) => Promise<any>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (type: DataType, id?: number) => {
    try {
      setLoading(true);
      setError(null);
      const url = new URL("/api/data", window.location.origin);
      url.searchParams.set("type", type);
      if (id) url.searchParams.set("id", id.toString());

      const response = await fetch(url.toString());
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al obtener datos");
      }

      const key = id ? `${type}-${id}` : type;
      setData(prev => ({ ...prev, [key]: result }));
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createData = useCallback(async (type: DataType, newData: any) => {
    try {
      setLoading(true);
      setError(null);
      const url = new URL("/api/data", window.location.origin);
      url.searchParams.set("type", type);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al crear datos");
      }

      // Actualizar el cache local
      setData(prev => ({ ...prev, [`${type}-${result.id}`]: result }));
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateData = useCallback(async (type: DataType, id: number, updateData: any) => {
    try {
      setLoading(true);
      setError(null);
      const url = new URL("/api/data", window.location.origin);
      url.searchParams.set("type", type);
      url.searchParams.set("id", id.toString());

      const response = await fetch(url.toString(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar datos");
      }

      // Actualizar el cache local
      setData(prev => ({ ...prev, [`${type}-${id}`]: result }));
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteData = useCallback(async (type: DataType, id: number) => {
    try {
      setLoading(true);
      setError(null);
      const url = new URL("/api/data", window.location.origin);
      url.searchParams.set("type", type);
      url.searchParams.set("id", id.toString());

      const response = await fetch(url.toString(), {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al eliminar datos");
      }

      // Eliminar del cache local
      setData(prev => {
        const newData = { ...prev };
        delete newData[`${type}-${id}`];
        return newData;
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <DataContext.Provider
      value={{
        data,
        loading,
        error,
        fetchData,
        createData,
        updateData,
        deleteData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData debe ser usado dentro de un DataProvider");
  }
  return context;
} 
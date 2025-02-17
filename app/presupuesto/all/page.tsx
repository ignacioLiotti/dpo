'use client'
import Link from 'next/link';
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// Assuming you have a function to fetch all presupuestos
const fetchPresupuestos = async () => {
  const response = await fetch('/api/presupuestos');
  if (!response.ok) {
    throw new Error('Failed to fetch presupuestos');
  }
  return response.json();
};

const PresupuestoList = () => {
  const { data: presupuestos = [], isLoading, error } = useQuery({
    queryKey: ['presupuestos'],
    queryFn: fetchPresupuestos,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {presupuestos.map((presupuesto: { id: string | number }) => (
        <li key={presupuesto.id}>
          <Link href={`/presupuesto/${presupuesto.id}`}>
            presupuesto {presupuesto.id}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default PresupuestoList;

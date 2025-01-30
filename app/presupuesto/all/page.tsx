'use client'
import Link from 'next/link';
import React from 'react';

// Assuming you have a function to fetch all presupuestos
const fetchPresupuestos = async () => {
  try {
    const response = await fetch('/api/presupuestos');
    if (!response.ok) {
      throw new Error('Failed to fetch presupuestos');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching presupuestos:', error);
    return [];
  }
};

const PresupuestoList = () => {
  const [presupuestos, setPresupuestos] = React.useState([]);

  React.useEffect(() => {
    const loadPresupuestos = async () => {
      const data = await fetchPresupuestos();
      console.log(data);
      setPresupuestos(data);
    };
    loadPresupuestos();
  }, []);

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

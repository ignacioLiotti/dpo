import React from 'react';
import { Card } from '@/components/ui/card';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  obra: string;
  ubicacion: string;
}

export function PageHeader({ title, subtitle, obra, ubicacion }: PageHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        {title}
      </h1>
      <Card className="text-gray-600 flex flex-col justify-center items-start p-2 px-4">
        <p className="mb-2">Obra: <b>{obra}</b></p>
        <p>Ubicacion: <b>{ubicacion}</b></p>
      </Card>

      <h2 className="mt-4 text-lg font-bold uppercase underline">
        {subtitle}
      </h2>
    </div>
  );
} 
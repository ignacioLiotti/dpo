'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { Machine } from '../types';
import MapComponent from './MapComponent';

interface Props {
  machines: Machine[];
}

export function MapWrapper({ machines }: Props) {
  return (
    <div className="h-full rounded-lg overflow-hidden">
      <Suspense fallback={
        <div className="w-full h-[600px] bg-secondary animate-pulse rounded-lg" />
      }>
        <MapComponent machines={machines} />
      </Suspense>
    </div>
  );
} 
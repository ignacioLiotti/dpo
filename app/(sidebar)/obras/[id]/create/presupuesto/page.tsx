import { Suspense } from 'react'
import PresupuestoPageClient from './PresupuestoCreateClient'

export default function PresupuestoPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4 space-y-4">
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[200px] bg-muted animate-pulse rounded" />
          <div className="h-[200px] bg-muted animate-pulse rounded" />
        </div>
      </div>
    }>
      <PresupuestoPageClient />
    </Suspense>
  )
}



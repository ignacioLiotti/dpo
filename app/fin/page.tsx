'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

export default function FinPage() {
  return (
    <div className="flex flex-col items-center justify-start mt-12">
      <div className="flex flex-col items-center justify-start mt-12 bg-containerHollowBackground rounded-2xl p-8">
        <Image src="/qr.png" alt="QR" width={400} height={400} />
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client' // Use browser client
import { Button, type ButtonProps } from "@/components/ui/button" // Import ButtonProps
import { useToast } from "@/components/ui/use-toast"

// Extend ButtonProps to inherit variant, className, etc.
interface SignOutButtonProps extends ButtonProps {
  // Add any specific props you might need, e.g., custom styling
}

export default function SignOutButton({ children, ...props }: SignOutButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    setLoading(false)

    if (error) {
      console.error('Sign out error:', error)
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      })
    } else {
      // Force refresh to ensure middleware redirects to login or layout updates
      router.refresh()
      // Optionally show a success toast, though redirecting might be enough
      // toast({ title: "Success", description: "Signed out successfully." })
    }
  }

  return (
    <Button
      onClick={handleSignOut}
      disabled={loading}
      {...props} // Spread other button props like variant, className, etc.
    >
      {loading ? 'Signing Out...' : children || 'Sign Out'}
    </Button>
  )
} 
'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client' // Use browser client
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function ChangePasswordForm() {
  const { toast } = useToast()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" })
      return
    }
    if (newPassword.length < 6) { // Example minimum length check
      setError("Password must be at least 6 characters long")
      toast({ title: "Error", description: "Password must be at least 6 characters long", variant: "destructive" })
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)
    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    setLoading(false)

    if (updateError) {
      console.error('Password update error:', updateError)
      setError(updateError.message)
      toast({
        title: "Password Update Failed",
        description: updateError.message,
        variant: "destructive",
      })
    } else {
      setSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      toast({
        title: "Success!",
        description: "Password updated successfully.",
      })
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Enter a new password for your account below.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleChangePassword}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              required
              minLength={6} // Enforce minimum length in browser
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
          {success && (
            <p className="text-sm font-medium text-green-600">Password updated successfully!</p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client' // Use browser client
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import Link from 'next/link'

export default function SignUpForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Optional: Add confirm password state if desired
  // const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Optional: Add password confirmation check
    // if (password !== confirmPassword) {
    //   setError("Passwords do not match");
    //   toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
    //   return;
    // }
    setLoading(true)
    setError(null)
    const supabase = createClient()

    // By default, Supabase sends a confirmation email.
    // You might want to disable this in Supabase settings for development
    // or provide options for email confirmation.
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Optional: You can add additional user metadata here
        // data: {
        //   first_name: 'John',
        //   age: 30,
        // },
        // Optional: Specify where the confirmation email should redirect
        // emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (signUpError) {
      console.error('Sign up error:', signUpError)
      setError(signUpError.message)
      toast({
        title: "Sign Up Failed",
        description: signUpError.message,
        variant: "destructive",
      })
    } else {
      // Clear form or show success message
      setEmail('')
      setPassword('')
      // setConfirmPassword('')
      toast({
        title: "Sign Up Successful!",
        description: "Please check your email to confirm your account.",
        // You might want to make this `variant: "success"` if you have that defined
      })
      // Optionally redirect to a page telling them to check their email
      // Or redirect to login if email confirmation is disabled
      // router.push('/check-email')
      router.push('/sign-in') // Redirect to sign-in after successful sign-up
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your details to create an account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignUp}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          {/* Optional: Add Confirm Password Field */}
          {/* <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div> */}
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </Button>
          <div className="text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
} 
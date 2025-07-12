"use client";

import { signInAction } from "@/app/actions/sign";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";

interface SignInFormProps {
  searchParams: Message;
}

export function SignInForm({ searchParams }: SignInFormProps) {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Check if we have a success message
  useEffect(() => {
    if ("success" in searchParams) {
      setIsSuccess(true);
      
      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [searchParams, router]);

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col min-w-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 rounded-lg border bg-card">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <h1 className="text-2xl font-medium text-center">Sign In Successful!</h1>
          <p className="text-sm text-muted-foreground text-center">
            Welcome back! You will be redirected to the home page in{" "}
            <span className="font-mono font-bold">{countdown}</span> seconds.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing your dashboard...
          </div>
          <Link 
            href="/" 
            className="text-sm text-primary hover:underline"
          >
            Continue immediately →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <p className="text-sm text-foreground">
        Don't have an account?{" "}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          Sign up
        </Link>
      </p>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="you@example.com" required />
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
          <Link
            className="text-xs text-foreground underline"
            href="/forgot-password"
          >
            Forgot Password?
          </Link>
        </div>
        <Input
          type="password"
          name="password"
          placeholder="Your password"
          required
        />
        <SubmitButton pendingText="Signing In..." formAction={signInAction}>
          Sign in
        </SubmitButton>
        <FormMessage message={searchParams} />
      </div>
    </form>
  );
}
'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useUserRole } from '@/hooks/useUserRole';
import { RoleGuard } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ShieldPlus, AlertCircle, CheckCircle } from 'lucide-react';

export default function PromoteUserPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [promoted, setPromoted] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setPromoted(false);

    try {
      // Look up the user by email
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('You must be logged in to perform this action');
        return;
      }

      // Using our edge function to promote the user
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/promote-user-by-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ email, newRole: 'admin' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to promote user');
      }

      const result = await response.json();

      if (result.success) {
        toast.success(`User successfully promoted to admin`);
        setPromoted(true);
        setEmail('');
      } else {
        toast.error(result.message || 'Failed to promote user');
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // <RoleGuard requiredRole="admin" redirectTo="/unauthorized">
    <div className="container max-w-md py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldPlus className="h-5 w-5 text-primary" />
            <CardTitle>Promote User to Admin</CardTitle>
          </div>
          <CardDescription>
            Grant administrator privileges to a user by email
          </CardDescription>
        </CardHeader>

        <form onSubmit={handlePromote}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                The user must have an existing account in the system
              </p>
            </div>

            {promoted && (
              <div className="bg-success/10 border border-success/20 text-success rounded-md p-3 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <h4 className="font-medium">User Promoted Successfully</h4>
                  <p className="text-sm">The user now has admin privileges.</p>
                </div>
              </div>
            )}

            <div className="bg-warning/10 border border-warning/20 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <h4 className="font-medium text-warning-foreground">Important Security Notice</h4>
                <p className="text-sm text-muted-foreground">
                  Admin users have complete access to the application including user management.
                  Only promote users you trust completely.
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="submit"
              disabled={isLoading || !email}
              className="gap-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShieldPlus className="h-4 w-4" />
                  <span>Promote to Admin</span>
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
    // </RoleGuard>
  );
} 
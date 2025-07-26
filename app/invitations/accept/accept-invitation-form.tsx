'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { acceptOrganizationInvitation } from '@/app/actions/invitations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AcceptInvitationFormProps {
  token?: string;
}

export function AcceptInvitationForm({ token }: AcceptInvitationFormProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    organizationName?: string;
    role?: string;
  } | null>(null);

  const handleAccept = async () => {
    if (!token) {
      toast.error('Invalid invitation link');
      return;
    }

    setIsAccepting(true);
    try {
      const response = await acceptOrganizationInvitation({ token });
      
      if (response?.data) {
        setResult({
          success: true,
          message: response.data.message,
          organizationName: response.data.organizationName,
          role: response.data.role,
        });
        
        toast.success(response.data.message);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/files');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      setResult({
        success: false,
        message: error?.message || 'Failed to accept invitation',
      });
      toast.error(error?.message || 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Invalid invitation link. Please check your email for the correct link.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (result?.success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle>Invitation Accepted!</CardTitle>
          <CardDescription>
            You've successfully joined {result.organizationName} as a {result.role}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Redirecting you to the dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept Invitation</CardTitle>
        <CardDescription>
          Click the button below to accept your invitation and join the organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result?.success === false && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
        
        <Button
          onClick={handleAccept}
          disabled={isAccepting}
          className="w-full"
          size="lg"
        >
          {isAccepting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Accepting invitation...
            </>
          ) : (
            'Accept Invitation'
          )}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          By accepting, you agree to join this organization and abide by its policies.
        </p>
      </CardContent>
    </Card>
  );
}
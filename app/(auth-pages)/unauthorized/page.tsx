import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Unauthorized Access',
  description: 'You do not have permission to access this page',
};

export default function UnauthorizedPage() {
  return (
    <div className="container mx-auto max-w-md py-16">
      <Card className="border-destructive/50">
        <CardHeader className="bg-destructive/10 border-b border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </div>
          <CardDescription className="text-destructive/70">
            You do not have permission to access the requested page
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="mb-4 text-muted-foreground">
            The page you are trying to access requires a higher permission level than your current user role.
          </p>
          <p className="text-muted-foreground">
            If you believe you should have access to this page, please contact your administrator.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end gap-4 border-t pt-4">
          <Button variant="outline" asChild>
            <Link href="/">Go to Homepage</Link>
          </Button>
          <Button asChild>
            <Link href="/profile">Go to Profile</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
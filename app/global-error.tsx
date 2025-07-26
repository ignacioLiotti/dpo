'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  React.useEffect(() => {
    // Log the error to console in development
    if (isDevelopment) {
      console.error('Global error caught:', error);
    }
    
    // In production, you might want to log to an error reporting service
    // logErrorToService(error);
  }, [error, isDevelopment]);

  const handleReportBug = () => {
    // You can implement bug reporting here
    // For now, we'll just copy error details to clipboard
    if (navigator.clipboard) {
      const errorInfo = `
Error: ${error.message}
Digest: ${error.digest || 'N/A'}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}

Stack Trace:
${error.stack}
      `.trim();
      
      navigator.clipboard.writeText(errorInfo);
      alert('Error details copied to clipboard');
    }
  };

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Application Error</CardTitle>
              <CardDescription>
                We're sorry, but something went wrong with the application. 
                This error has been logged and will be investigated.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={reset} 
                  size="lg" 
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/'} 
                  variant="outline" 
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go to Homepage
                </Button>
                
                <Button 
                  onClick={handleReportBug}
                  variant="secondary" 
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Report Bug
                </Button>
              </div>

              {error.digest && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error ID:</strong> {error.digest}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      Please include this ID when reporting the issue.
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {isDevelopment && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Development Error Details:</strong>
                    <div className="mt-2 p-3 bg-red-50 rounded border">
                      <p className="font-mono text-sm mb-2">{error.message}</p>
                      <details className="text-xs">
                        <summary className="cursor-pointer font-medium mb-2">
                          Stack Trace
                        </summary>
                        <pre className="whitespace-pre-wrap break-all bg-white p-2 rounded border">
                          {error.stack}
                        </pre>
                      </details>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-center text-sm text-muted-foreground">
                <p>If this problem persists, please contact support.</p>
                <p className="mt-1">
                  Time: {new Date().toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
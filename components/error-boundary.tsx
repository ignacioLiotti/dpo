'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
  resetKeys?: Array<string | number>;
}

// Default error fallback component
export function DefaultErrorFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 justify-center">
            <Button onClick={resetError} variant="default" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
          
          {isDevelopment && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm">
                <strong>Dev Error:</strong> {error.message}
                <details className="mt-2">
                  <summary className="cursor-pointer">Stack Trace</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap break-all">
                    {error.stack}
                  </pre>
                </details>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Feature-specific error fallbacks
export function FileErrorFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  return (
    <div className="p-6 text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Error loading files</h3>
      <p className="text-muted-foreground mb-4">
        There was a problem loading your files. This might be due to a network issue or server problem.
      </p>
      <Button onClick={resetError} className="flex items-center gap-2 mx-auto">
        <RefreshCw className="h-4 w-4" />
        Retry Loading Files
      </Button>
    </div>
  );
}

export function ObraErrorFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  return (
    <div className="p-6 text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Error loading obras</h3>
      <p className="text-muted-foreground mb-4">
        There was a problem loading your construction projects. Please try again.
      </p>
      <Button onClick={resetError} className="flex items-center gap-2 mx-auto">
        <RefreshCw className="h-4 w-4" />
        Retry Loading Obras
      </Button>
    </div>
  );
}

// Main ErrorBoundary class component
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && resetKeys !== prevProps.resetKeys) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }, 50);
  };

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  render() {
    const { hasError, error } = this.state;
    const { children, fallback: Fallback = DefaultErrorFallback, resetKeys } = this.props;

    if (hasError && error) {
      return <Fallback error={error} resetError={this.resetErrorBoundary} resetKeys={resetKeys} />;
    }

    return children;
  }
}

// Convenience wrapper components
export function FileErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={FileErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}

export function ObraErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={ObraErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}

// Hook for imperative error boundary reset
export function useErrorBoundary() {
  const [, setError] = React.useState<Error | null>(null);
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
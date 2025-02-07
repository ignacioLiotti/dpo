import { Loader2 } from "lucide-react";

export function LoadingSpinner() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}

export function LoadingPage() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
} 
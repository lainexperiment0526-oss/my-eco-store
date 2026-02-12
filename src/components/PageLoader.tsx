import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  label?: string;
  fullscreen?: boolean;
}

export function PageLoader({ label = 'Loading...', fullscreen = true }: PageLoaderProps) {
  const content = (
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );

  if (!fullscreen) {
    return <div className="flex items-center justify-center py-8">{content}</div>;
  }

  return <div className="flex min-h-screen items-center justify-center bg-background">{content}</div>;
}

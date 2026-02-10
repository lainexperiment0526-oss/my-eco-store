import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  isHiding?: boolean;
}

export function SplashScreen({ isHiding = false }: SplashScreenProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-400',
        'bg-[radial-gradient(900px_600px_at_50%_-20%,rgba(0,122,255,0.18),transparent_60%),radial-gradient(700px_500px_at_80%_120%,rgba(30,196,140,0.16),transparent_60%)]',
        'dark:bg-[radial-gradient(900px_600px_at_50%_-20%,rgba(0,122,255,0.26),transparent_60%),radial-gradient(700px_500px_at_80%_120%,rgba(30,196,140,0.2),transparent_60%)]',
        isHiding ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
      role="presentation"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="animate-[splash-pop_900ms_ease-out]">
          <Logo size="lg" className="h-20 w-20 drop-shadow-[0_10px_30px_rgba(0,0,0,0.18)]" />
        </div>
        <div className="animate-[splash-fade_900ms_ease-out] text-3xl font-semibold tracking-tight text-foreground">
          OpenApp
        </div>
      </div>
    </div>
  );
}

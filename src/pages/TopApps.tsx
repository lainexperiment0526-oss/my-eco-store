import { Header } from '@/components/Header';
import { AppCard, SectionHeader } from '@/components/AppCard';
import { usePopularApps } from '@/hooks/useApps';
import { Skeleton } from '@/components/ui/skeleton';

export default function TopApps() {
  const { data: popularApps, isLoading } = usePopularApps();

  const sorted = popularApps
    ? [...popularApps].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
    : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <SectionHeader title="Top Apps" href="/" />
        {isLoading && (
          <div className="space-y-4 mt-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && sorted.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No top apps yet</div>
        )}
        {sorted.length > 0 && (
          <div className="divide-y divide-border mt-4">
            {sorted.map((app) => (
              <AppCard key={app.id} app={app} variant="list" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

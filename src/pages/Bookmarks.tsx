import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AppCard } from '@/components/AppCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { App, Category, Screenshot } from '@/types/app';

type BookmarkRow = {
  id: string;
  created_at: string;
  app: (App & { category?: Category; screenshots?: Screenshot[] }) | null;
};

export default function Bookmarks() {
  const { user } = useAuth();

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as BookmarkRow[];
      const { data, error } = await supabase
        .from('app_bookmarks')
        .select('id, created_at, app:apps(*, category:categories(*), screenshots:app_screenshots(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BookmarkRow[];
    },
    enabled: !!user?.id,
  });

  const apps = (bookmarks || []).map(row => row.app).filter(Boolean) as (App & {
    category?: Category;
    screenshots?: Screenshot[];
  })[];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">Favorites</h1>
        </div>
        <p className="text-muted-foreground mb-4">Your bookmarked apps are saved here.</p>

        {!user && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-3">Sign in to view your bookmarked apps.</p>
            <Link to="/auth" className="text-primary font-medium hover:underline">Sign in</Link>
          </div>
        )}

        {user && isLoading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
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

        {user && !isLoading && apps.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No favorites yet. Tap the bookmark icon on an app to save it here.
          </div>
        )}

        {user && apps.length > 0 && (
          <div className="divide-y divide-border">
            {apps.map(app => (
              <AppCard key={app.id} app={app} variant="list" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

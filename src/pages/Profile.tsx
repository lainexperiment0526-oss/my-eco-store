import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { usePiNetwork } from '@/hooks/usePiNetwork';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/PageLoader';

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { piUser } = usePiNetwork();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, user, navigate]);

  const displayName = useMemo(() => {
    if (piUser?.username) return piUser.username;
    if (user?.user_metadata?.username) return String(user.user_metadata.username);
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  }, [piUser, user]);

  if (loading || !user) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-semibold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground truncate">{displayName}</h1>
              <p className="text-sm text-muted-foreground truncate">{user.email ?? 'Pi Network User'}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Account</p>
              <div className="mt-3 space-y-2 text-sm text-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-xs">{user.id}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Provider</span>
                  <span>{piUser ? 'Pi Network' : 'Supabase'}</span>
                </div>
              </div>
            </div>

            {piUser && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Pi Profile</p>
                <div className="mt-3 space-y-2 text-sm text-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Username</span>
                    <span>{piUser.username}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Pi UID</span>
                    <span className="font-mono text-xs">{piUser.uid}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="destructive" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
      </main>
    </div>
  );
}

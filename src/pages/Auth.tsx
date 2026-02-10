import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePiNetwork } from '@/hooks/usePiNetwork';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { AdInterstitial } from '@/components/AdInterstitial';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const { isPiReady, authenticateWithPi, piLoading } = usePiNetwork();
  const [showAd, setShowAd] = useState(true);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handlePiAuth = async () => {
    const piUser = await authenticateWithPi();
    if (piUser) {
      const piEmail = `${piUser.uid}@pi.user`;
      const piPassword = piUser.accessToken.slice(0, 20) + piUser.uid;

      const { error: signInError } = await signIn(piEmail, piPassword);
      if (signInError) {
        const { error: signUpError } = await signUp(piEmail, piPassword);
        if (signUpError) {
          toast.error('Failed to authenticate with Pi Network');
          return;
        }
      }
      toast.success(`Welcome, ${piUser.username}!`);
      navigate('/');
    } else {
      toast.error('Pi authentication failed. Make sure you are in Pi Browser.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {showAd && <AdInterstitial trigger="auth" onComplete={() => setShowAd(false)} />}
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">OpenApp</h1>
          <p className="mt-2 text-muted-foreground">Sign in to continue</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Discover trusted Pi apps, track your favorites, and manage your submissions in one place.
          </p>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-lg">
          <Button
            onClick={handlePiAuth}
            disabled={!isPiReady || piLoading}
            className="w-full mb-4 bg-[#0A84FF] hover:bg-[#0074E8] dark:bg-[#0A84FF] dark:hover:bg-[#0074E8] text-white font-semibold"
            size="lg"
          >
            {piLoading ? 'Connecting...' : 'Sign in with Pi Network'}
          </Button>

          {!isPiReady && (
            <p className="text-xs text-muted-foreground text-center mb-4">
              Pi sign-in requires Pi Browser
            </p>
          )}

          <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              <p>Secure sign-in with Pi Network. No email or password required.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              <p>Access your app listings, ads, and analytics across devices.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              <p>New here? Install Pi Browser to get started.</p>
            </div>
          </div>
        </div>

          <div className="mt-4 text-center text-xs text-muted-foreground space-x-3">
            <a href="/privacy" className="hover:text-foreground">Privacy</a>
            <span>&middot;</span>
            <a href="/terms" className="hover:text-foreground">Terms</a>
            <span>&middot;</span>
            <a href="/license" className="hover:text-foreground">License</a>
          </div>
        </div>
      </div>
    </>
  );
}

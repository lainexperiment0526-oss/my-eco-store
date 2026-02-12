import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePiNetwork } from '@/hooks/usePiNetwork';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { AdInterstitial } from '@/components/AdInterstitial';
import { PageLoader } from '@/components/PageLoader';

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

  const getStablePiPassword = (piUid: string) => `openapp_pi_auth_${piUid}`;
  const getLegacyPiPassword = (accessToken: string, piUid: string) => `${accessToken.slice(0, 20)}${piUid}`;
  const isAlreadyRegisteredError = (error: Error | null) => {
    if (!error?.message) return false;
    const message = error.message.toLowerCase();
    return message.includes('already registered') || message.includes('already been registered');
  };
  const isEmailNotConfirmedError = (error: Error | null) => {
    if (!error?.message) return false;
    return error.message.toLowerCase().includes('email not confirmed');
  };

  const ensurePiAccountServerSide = async (piUid: string, username: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('pi-auth', {
        body: { piUid, username },
      });

      if (error) {
        console.warn('pi-auth function invoke failed:', error.message);
        return null;
      }

      if (!data?.email || !data?.password) {
        console.warn('pi-auth function returned incomplete data');
        return null;
      }

      return {
        email: data.email as string,
        password: data.password as string,
      };
    } catch (err) {
      console.warn('pi-auth function unavailable, using client fallback:', err);
      return null;
    }
  };

  const handlePiAuth = async () => {
    const piUser = await authenticateWithPi();
    if (piUser) {
      const ensured = await ensurePiAccountServerSide(piUser.uid, piUser.username);
      const piEmail = ensured?.email ?? `${piUser.uid}@pi.user`;
      const stablePassword = ensured?.password ?? getStablePiPassword(piUser.uid);
      const legacyPassword = getLegacyPiPassword(piUser.accessToken, piUser.uid);

      // First try stable credentials so returning users can log in consistently.
      let { error: signInError } = await signIn(piEmail, stablePassword);

      // Backward compatibility for accounts created with the older token-derived password.
      if (signInError) {
        const { error: legacySignInError } = await signIn(piEmail, legacyPassword);
        if (!legacySignInError) {
          const { error: updatePasswordError } = await supabase.auth.updateUser({ password: stablePassword });
          if (updatePasswordError) {
            console.warn('Pi password migration failed:', updatePasswordError.message);
          }
          signInError = null;
        }
      }

      // If no existing account works, create one with stable credentials.
      if (signInError) {
        const { error: signUpError } = await signUp(piEmail, stablePassword);
        if (signUpError && !isAlreadyRegisteredError(signUpError)) {
          console.error('Pi sign-up failed:', signUpError.message);
          toast.error('Failed to authenticate with Pi Network');
          return;
        }

        // Account might already exist; retry sign-in with stable password once.
        const { error: retrySignInError } = await signIn(piEmail, stablePassword);
        if (retrySignInError) {
          if (isEmailNotConfirmedError(retrySignInError)) {
            toast.error('Pi account exists but is not confirmed. Deploy the pi-auth edge function and try again.');
            return;
          }
          console.error('Pi retry sign-in failed:', retrySignInError.message);
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
    return <PageLoader />;
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

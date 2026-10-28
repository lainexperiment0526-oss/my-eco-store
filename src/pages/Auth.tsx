import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePiNetwork } from '@/hooks/usePiNetwork';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { buildPiOAuthUrl } from '@/lib/piOAuth';
import { isPiBrowser } from '@/lib/piAds';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/';
  const { user, signIn, loading } = useAuth();
  const { authenticateWithPi, piLoading, showPiAd } = usePiNetwork();
  const [inPiBrowser, setInPiBrowser] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    setInPiBrowser(isPiBrowser());
  }, []);

  useEffect(() => {
    if (user && !loading && !authenticating) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, authenticating, navigate, redirectTo]);

  const handlePiAuth = async () => {
    if (authenticating) return;
    setAuthenticating(true);
    try {
      // Keep native authentication attached to the button gesture.
      const piUser = await authenticateWithPi();
      if (!piUser) {
        toast.error('Pi authentication failed. Please try again in Pi Browser.');
        return;
      }

      // The server verifies Pi and prepares returning/new accounts in one request.
      // Abort a stalled request instead of cascading through failed login/signup retries.
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      let credentials;
      try {
        const { data, error } = await supabase.functions.invoke('pi-auth', {
          body: { accessToken: piUser.accessToken },
          signal: controller.signal,
        });
        if (error || !data?.email || !data?.password) {
          throw new Error('Unable to finish Pi sign-in. Please try again.');
        }
        credentials = data;
      } finally {
        window.clearTimeout(timeout);
      }

      const { error } = await signIn(credentials.email, credentials.password);
      if (error) throw new Error('Unable to finish Pi sign-in. Please try again.');

      toast.success(`Welcome, ${piUser.username}!`);
      navigate(redirectTo, { replace: true });

      // Profile bookkeeping and native ad availability never hold the sign-in page open.
      void supabase.auth.getSession().then(({ data }) => {
        if (!data.session?.user.id) return;
        return supabase.from('profiles').update({ uses_openapp: true }).eq('id', data.session.user.id);
      }).catch(() => console.warn('Profile update unavailable'));
      void showPiAd('interstitial').catch(() => console.warn('Pi ad unavailable'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Pi sign-in failed. Please try again.');
    } finally {
      setAuthenticating(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Logo size="lg" className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">OpenApp</h1>
            <p className="mt-2 text-muted-foreground">Sign in to continue</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Discover trusted apps, track your favorites, and manage your submissions in one place.
            </p>
          </div>

          <Tabs defaultValue="pi" className="w-full">
            <TabsContent value="pi">
              <div className="rounded-2xl bg-card p-6 shadow-lg">
                <Button
                  onClick={handlePiAuth}
                  disabled={piLoading || authenticating}
                  className="w-full mb-4 bg-[#0A84FF] hover:bg-[#0074E8] dark:bg-[#0A84FF] dark:hover:bg-[#0074E8] text-white font-semibold"
                  size="lg"
                >
                  {piLoading || authenticating ? 'Connecting...' : 'Sign in with Pi Network'}
                </Button>

                {!inPiBrowser && (
                  <>
                    <Button
                      onClick={() => { window.location.href = buildPiOAuthUrl(); }}
                      variant="outline"
                      className="w-full mb-4 font-semibold"
                      size="lg"
                    >
                      Sign in with Pi (Web OAuth)
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mb-4">
                      Use "Web OAuth" outside Pi Browser. Inside Pi Browser, use the button above.
                    </p>
                  </>
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
                </div>
              </div>
            </TabsContent>

          </Tabs>


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

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageLoader } from '@/components/PageLoader';
import { toast } from 'sonner';

/**
 * Pi OAuth (implicit flow) callback.
 * Pi Developer Portal redirects here with `#access_token=...&token_type=...&expires_in=...`.
 * We verify the token via the pi-auth edge function (which calls /v2/me),
 * then sign the user in with the returned managed credentials.
 */
export default function PiCallback() {
  const navigate = useNavigate();
  const ran = useRef(false);
  const [status, setStatus] = useState<'working' | 'error'>('working');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const params = new URLSearchParams(hash);
        const search = new URLSearchParams(window.location.search);

        const err = params.get('error') || search.get('error');
        if (err) throw new Error(params.get('error_description') || err);

        const accessToken = params.get('access_token') || search.get('access_token');
        if (!accessToken) throw new Error('Missing access_token from Pi OAuth callback');

        const { data, error } = await supabase.functions.invoke('pi-auth', {
          body: { accessToken },
        });
        if (error) throw new Error(error.message || 'pi-auth invocation failed');
        if (!data?.email || !data?.password) throw new Error('pi-auth returned incomplete credentials');

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (signInError) throw signInError;

        toast.success(`Welcome, ${data.username || 'Pioneer'}!`);
        // Clear the hash and redirect home.
        window.history.replaceState({}, '', '/');
        navigate('/', { replace: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Pi sign-in failed';
        console.error('[Pi OAuth callback]', message);
        setErrorMessage(message);
        setStatus('error');
        toast.error(message);
      }
    })();
  }, [navigate]);

  if (status === 'working') return <PageLoader />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg text-center space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Pi Sign-In Failed</h1>
        <p className="text-sm text-muted-foreground break-words">{errorMessage}</p>
        <button
          onClick={() => navigate('/auth', { replace: true })}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 active:scale-[0.96] transition"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
}

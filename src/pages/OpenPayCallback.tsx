import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageLoader } from '@/components/PageLoader';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { OPENPAY_REDIRECT_URI } from '@/lib/openpay';
import { FunctionsHttpError } from '@supabase/supabase-js';

export default function OpenPayCallback() {
  const navigate = useNavigate();
  const ran = useRef(false);
  const [status, setStatus] = useState<'working' | 'error'>('working');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const search = new URLSearchParams(window.location.search);
        const err = search.get('error');
        if (err) throw new Error(search.get('error_description') || err);

        const code = search.get('code');
        if (!code) throw new Error('Missing authorization code from OpenPay');

        const returnedState = search.get('state');
        const savedState = sessionStorage.getItem('openpay_oauth_state');
        if (savedState && returnedState && savedState !== returnedState) {
          throw new Error('Invalid OAuth state — please try connecting again');
        }
        sessionStorage.removeItem('openpay_oauth_state');

        const { data, error } = await supabase.functions.invoke('openpay-payment', {
          body: { action: 'oauth-exchange', code, redirectUri: OPENPAY_REDIRECT_URI },
        });
        if (error) {
          const details = error instanceof FunctionsHttpError
            ? await error.context.json().catch(() => null)
            : null;
          throw new Error(details?.error || error.message || 'OpenPay connection failed');
        }
        if (!data?.success) throw new Error(data?.error || 'OpenPay connection failed');

        if (data.login_token_hash) {
          const { error: sessionError } = await supabase.auth.verifyOtp({
            token_hash: data.login_token_hash,
            type: 'magiclink',
          });
          if (sessionError) throw new Error(`OpenPay verified, but sign-in failed: ${sessionError.message}`);
        }

        const { data: authenticated } = await supabase.auth.getUser();
        if (!authenticated.user) throw new Error('OpenPay was verified, but no OpenApp session was created');

        toast.success(`Signed in with OpenPay${data.profile?.username ? ` as @${data.profile.username}` : ''}`);
        navigate('/', { replace: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'OpenPay connection failed';
        console.error('[OpenPay callback]', message);
        setErrorMessage(message);
        setStatus('error');
        toast.error(message);
      }
    })();
  }, [navigate]);

  if (status === 'working') return <PageLoader />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm w-full rounded-2xl border border-border bg-card p-6 text-center space-y-3">
        <h1 className="text-lg font-semibold text-foreground">Couldn't connect OpenPay</h1>
        <p className="text-sm text-muted-foreground break-words">{errorMessage}</p>
        <Button className="w-full" onClick={() => navigate('/developer-dashboard', { replace: true })}>
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}

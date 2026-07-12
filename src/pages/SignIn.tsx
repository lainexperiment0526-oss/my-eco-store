import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { PageLoader } from '@/components/PageLoader';
import { EmailAuth } from '@/components/EmailAuth';

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/';
  const { user, signIn, signUp, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) navigate(redirectTo, { replace: true });
  }, [user, loading, navigate, redirectTo]);

  const handleGoogle = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error('Google sign-in failed: ' + result.error.message);
        return;
      }
      if (result.redirected) return;
    } catch (err: any) {
      toast.error('Google sign-in failed: ' + (err?.message ?? 'Unknown error'));
    }
  };

  const handleEmailAuth = async (email: string, password: string, isSignUp: boolean) => {
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message.includes('already registered')
            ? 'An account with this email already exists. Try signing in instead.'
            : 'Failed to create account: ' + error.message);
          return;
        }
        toast.success('Account created! Check your email to verify your account.');
      } else {
        const { error } = await signIn(email, password);
        if (error) { toast.error('Failed to sign in: ' + error.message); return; }
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) {
          await supabase.from('profiles').update({
            uses_openapp: true, auth_method: 'email', email_verified: true,
          }).eq('id', u.id);
        }
        toast.success('Welcome back!');
        navigate(redirectTo, { replace: true });
      }
    } catch {
      toast.error('Authentication failed. Please try again.');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Sign in to OpenApp</h1>
          <p className="mt-2 text-muted-foreground">Continue with email or Google</p>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-lg space-y-4">
          <Button
            onClick={handleGoogle}
            variant="outline"
            size="lg"
            className="w-full font-semibold"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <EmailAuth onEmailAuth={handleEmailAuth} loading={loading} />

          <div className="text-center text-sm text-muted-foreground">
            Want to sign in with Pi Network?{' '}
            <Link to="/auth" className="text-primary hover:underline">Use Pi sign-in</Link>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground space-x-3">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <span>&middot;</span>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <span>&middot;</span>
          <Link to="/license" className="hover:text-foreground">License</Link>
        </div>
      </div>
    </div>
  );
}

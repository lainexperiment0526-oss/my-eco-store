import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePiNetwork } from '@/hooks/usePiNetwork';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';
import { Logo } from '@/components/Logo';
import { Separator } from '@/components/ui/separator';
import { AdInterstitial } from '@/components/AdInterstitial';

const emailSchema = z.string().email('Please enter a valid email');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const { isPiReady, authenticateWithPi, piLoading } = usePiNetwork();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAd, setShowAd] = useState(true);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    
    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back!');
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;
    
    setIsSubmitting(true);
    const { error } = await signUp(email, password);
    setIsSubmitting(false);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('An account with this email already exists');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created successfully!');
      navigate('/');
    }
  };

  const handlePiAuth = async () => {
    const piUser = await authenticateWithPi();
    if (piUser) {
      // Sign in or sign up with Pi credentials using email-based fallback
      const piEmail = `${piUser.uid}@pi.user`;
      const piPassword = piUser.accessToken.slice(0, 20) + piUser.uid;
      
      // Try sign in first
      const { error: signInError } = await signIn(piEmail, piPassword);
      if (signInError) {
        // If sign in fails, create account
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
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-lg">
          {/* Pi Network Auth Button */}
          <Button
            onClick={handlePiAuth}
            disabled={!isPiReady || piLoading}
            className="w-full mb-4 bg-[#7B2FF2] hover:bg-[#6B1FE2] dark:bg-[#9B59B6] dark:hover:bg-[#8E44AD] text-white font-semibold"
            size="lg"
          >
            {piLoading ? 'Connecting...' : 'Sign in with Pi Network'}
          </Button>
          
          {!isPiReady && (
            <p className="text-xs text-muted-foreground text-center mb-4">
              Pi sign-in requires Pi Browser
            </p>
          )}

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              or continue with email
            </span>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground space-x-3">
          <a href="/privacy" className="hover:text-foreground">Privacy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-foreground">Terms</a>
          <span>•</span>
          <a href="/license" className="hover:text-foreground">License</a>
        </div>
      </div>
    </div>
    </>
  );
}

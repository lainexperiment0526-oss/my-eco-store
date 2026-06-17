import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAffiliate } from '@/hooks/useAffiliate';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Share2, Gift, Rocket, DollarSign } from 'lucide-react';
import { PageLoader } from '@/components/PageLoader';


export default function Affiliate() {
  const { user, loading: authLoading } = useAuth();
  const {
    profile,
    rewards,
    listingRewards,
    totalEarnedUsd,
    loading,
  } = useAffiliate();


  if (authLoading) return <PageLoader />;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Sign in to earn</h1>
          <p className="text-muted-foreground mb-6">
            Create an account to get your unique invite link and start earning OpenPay credits.
          </p>
          <Link to="/auth"><Button>Sign In</Button></Link>
        </main>
      </div>
    );
  }

  const refCode = profile?.referral_code ?? '';
  const refLink = refCode
    ? `${window.location.origin}/?ref=${refCode}`
    : '';

  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error('Copy failed');
    }
  };

  const share = async () => {
    if (!refLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OpenApp — Pi Network App Store',
          text: 'Discover Pi Network apps. Use my invite link:',
          url: refLink,
        });
      } catch {}
    } else {
      copy(refLink, 'Invite link copied!');
    }
  };


  return (
    <div className="min-h-screen bg-background pb-12">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Gift className="h-7 w-7 text-primary" /> Affiliate Program
          </h1>
          <p className="text-muted-foreground mt-1">
            Invite friends to OpenApp and earn OpenPay credits.
          </p>
        </div>

        {/* Earnings cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Total Earned</p>
              <p className="text-2xl font-bold text-foreground">${totalEarnedUsd.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Rocket className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Apps Listed</p>
              <p className="text-2xl font-bold text-foreground">{listingRewards.length}</p>
              <p className="text-xs text-muted-foreground mt-1">$3 each</p>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>Earnings credit to your developer balance, withdrawable via OpenPay.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <Rocket className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">$3 per app listed</p>
                <p className="text-muted-foreground">When someone you invited submits an app and it gets approved on OpenApp.</p>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Invite link */}
        <Card>
          <CardHeader>
            <CardTitle>Your invite link</CardTitle>
            <CardDescription>Share this anywhere. Code: <span className="font-mono font-semibold text-foreground">{refCode || '...'}</span></CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input readOnly value={refLink} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(refLink, 'Link copied!')} disabled={!refLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={share} className="w-full" disabled={!refLink}>
              <Share2 className="h-4 w-4" /> Share invite link
            </Button>
          </CardContent>
        </Card>


        {/* Recent rewards */}
        <Card>
          <CardHeader>
            <CardTitle>Recent rewards</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <PageLoader fullscreen={false} label="Loading rewards..." />
            ) : rewards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No rewards yet. Share your link to start earning!
              </p>
            ) : (
              <div className="space-y-2">
                {rewards.slice(0, 20).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {r.reward_type === 'apk_install' ? 'Install' : 'App listed'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-semibold">
                      +${Number(r.amount_usd).toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

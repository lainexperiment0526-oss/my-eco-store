import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PhonePreview } from '@/components/PhonePreview';
import { EmailCaptureDisplay } from '@/components/EmailCaptureDisplay';
import { ProductDisplay } from '@/components/ProductDisplay';
import { MembershipGate } from '@/components/MembershipGate';
import { useMonetization } from '@/hooks/useMonetization';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ProfileData } from '@/types/profile';
import { MembershipTier, Product } from '@/types/features';
import { Button } from '@/components/ui/button';
import { Share2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { FooterNav } from '@/components/FooterNav';

export const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMembership, setHasMembership] = useState(false);
  const [memberTierId, setMemberTierId] = useState<string | null>(null);

  // Monetization hooks
  const { products, tiers, captureLead, createOrder } = useMonetization(profileId);
  const { logClickEvent } = useAnalytics(profileId);

  useEffect(() => {
    if (!username) return;
    const loadProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle();

        if (profile) {
          setProfile(profile as any as ProfileData);
          setProfileId(profile.id);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [username]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!profile) return <div className="p-8 text-center">Profile not found</div>;

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
  };

  const handleEmailCapture = async (email: string) => {
    await captureLead({
      profile_id: profileId || '',
      email,
      source: 'capture_block',
      metadata: {}
    });
  };

  const handleProductPurchase = async (productId: string, email: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      await createOrder({
        profile_id: profileId || '',
        product_id: productId,
        buyer_email: email,
        amount: product.price,
        currency: product.currency,
        status: 'paid',
        metadata: {}
      });
      // Log purchase event
      logClickEvent(productId, { event_type: 'click' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {/* Header */}
        <div className="text-center mb-8">
          {profile.logo && (
            <img
              src={profile.logo}
              alt={profile.businessName}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
            />
          )}
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            {profile.businessName}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            @{profile.username}
          </p>
          {profile.description && (
            <p className="text-slate-700 dark:text-slate-200 mb-6 max-w-md mx-auto">
              {profile.description}
            </p>
          )}
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="flex items-center gap-2 mx-auto"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Email Capture Block */}
          {tiers.length > 0 && (
            <EmailCaptureDisplay
              title="Get Exclusive Updates"
              description="Subscribe to stay in the loop"
              onSubmit={handleEmailCapture}
            />
          )}

          {/* Products */}
          {products.map(product => (
            <ProductDisplay
              key={product.id}
              product={product}
              onPurchase={handleProductPurchase}
            />
          ))}

          {/* Membership Tiers */}
          {tiers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Membership Tiers
              </h2>
              {tiers.map(tier => (
                <MembershipGate
                  key={tier.id}
                  requiredTier={tier}
                  hasAccess={hasMembership && memberTierId === tier.id}
                  onUnlock={() => {
                    // In a real app, this would show a payment modal
                    toast.info(`Subscribe to ${tier.name} tier`);
                  }}
                >
                  <div className="p-4 bg-gradient-to-r from-sky-500/10 to-blue-500/10 rounded-2xl">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {tier.name} Member Content
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {tier.description}
                    </p>
                  </div>
                </MembershipGate>
              ))}
            </div>
          )}

          {/* Social Links */}
          {profile.socialLinks?.some(l => l.url) && (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Follow Me
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {profile.socialLinks.map((link, i) => (
                  link.url && (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logClickEvent(`social-${link.type}`)}
                      className="p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-center font-medium transition"
                    >
                      {link.type}
                    </a>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Custom Links */}
          {profile.customLinks?.length > 0 && (
            <div className="space-y-3">
              {profile.customLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  onClick={() => logClickEvent(`custom-${link.title}`)}
                  className="block p-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
                >
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {link.title}
                  </h3>
                  {link.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {link.description}
                    </p>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Made with <span className="text-red-500">❤</span> on Droplink
          </p>
        </div>
      </div>

      {/* Footer Navigation */}
      <FooterNav />
    </div>
  );
};

export default PublicProfile;

import { useState, useEffect } from "react";
import { PhonePreview } from "@/components/PhonePreview";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { usePi } from "@/contexts/PiContext";
import { User } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";
import type { ProfileData, ThemeData, CustomLink, SocialLinks, Product, PaymentLink, ShortenedLink } from "@/types/profile";

const Profile = () => {
  const navigate = useNavigate();
  const { piUser, isAuthenticated, signIn: piSignIn } = usePi();
  const [linkingPi, setLinkingPi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    id: "",
    businessName: "",
    username: "",
    description: "",
    logo: "",
    email: "",
    youtubeVideoUrl: "",
    customLinks: [],
    products: [],
    theme: {
      primaryColor: "#38bdf8",
      backgroundColor: "#000000",
      backgroundType: "color",
      backgroundGif: "",
      backgroundVideo: "",
      iconStyle: "rounded",
      buttonStyle: "filled",
      textColor: "#ffffff",
    },
    wallets: undefined,
    hasPremium: false,
    piWalletAddress: "",
    piDonationMessage: "",
    showShareButton: true,
    storeUrl: "",
    showPiWalletTips: false,
    socialLinks: [],
    paymentLinks: [],
    shortenedLinks: [],
    linkLayoutType: "stack",
    piWalletQrUrl: "",
  });

  useEffect(() => {
    loadProfile();
  }, [piUser, isAuthenticated]);

  const loadProfile = async () => {
    try {
      if (!isAuthenticated || !piUser?.username) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", piUser.username)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
        return;
      }

      if (profile) {
        let safeTheme: ThemeData = {
          primaryColor: "#38bdf8",
          backgroundColor: "#000000",
          backgroundType: "color",
          backgroundGif: "",
          backgroundVideo: "",
          iconStyle: "rounded",
          buttonStyle: "filled",
          textColor: "#ffffff",
        };
        
        if (typeof profile.theme_settings === 'object' && profile.theme_settings !== null && !Array.isArray(profile.theme_settings)) {
          const t = profile.theme_settings as Record<string, unknown>;
          safeTheme = {
            primaryColor: typeof t.primaryColor === 'string' ? t.primaryColor : safeTheme.primaryColor,
            backgroundColor: typeof t.backgroundColor === 'string' ? t.backgroundColor : safeTheme.backgroundColor,
            backgroundType: t.backgroundType === 'color' || t.backgroundType === 'gif' || t.backgroundType === 'video' ? t.backgroundType : safeTheme.backgroundType,
            backgroundGif: typeof t.backgroundGif === 'string' ? t.backgroundGif : safeTheme.backgroundGif,
            backgroundVideo: typeof t.backgroundVideo === 'string' ? t.backgroundVideo : safeTheme.backgroundVideo,
            iconStyle: typeof t.iconStyle === 'string' ? t.iconStyle : safeTheme.iconStyle,
            buttonStyle: typeof t.buttonStyle === 'string' ? t.buttonStyle : safeTheme.buttonStyle,
            textColor: typeof t.textColor === 'string' ? t.textColor : safeTheme.textColor,
          };
        }
        
        let safeCustomLinks: CustomLink[] = [];
        if (
          typeof profile.theme_settings === 'object' &&
          profile.theme_settings !== null &&
          !Array.isArray(profile.theme_settings) &&
          'customLinks' in profile.theme_settings &&
          Array.isArray((profile.theme_settings as any).customLinks)
        ) {
          safeCustomLinks = (profile.theme_settings as any).customLinks as CustomLink[];
        }
        
        setProfileData(prev => ({
          ...prev,
          id: profile.id || "",
          businessName: profile.business_name || "",
          username: profile.username || "",
          description: profile.description || "",
          logo: profile.logo || "",
          email: "", // email column doesn't exist in profiles
          youtubeVideoUrl: profile.youtube_video_url || "",
          customLinks: safeCustomLinks,
          products: [],
          theme: safeTheme,
          wallets: undefined,
          hasPremium: !!profile.has_premium,
          piWalletAddress: profile.pi_wallet_address || "",
          piDonationMessage: profile.pi_donation_message || "",
          showShareButton: profile.show_share_button ?? true,
          storeUrl: "",
          showPiWalletTips: false,
          socialLinks: Array.isArray(profile.social_links) ? profile.social_links as unknown as SocialLinks : [],
          paymentLinks: [],
          shortenedLinks: [],
          linkLayoutType: "stack",
          piWalletQrUrl: "",
        }));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!isAuthenticated || !piUser?.username) {
        toast.error("You must be logged in with Pi");
        navigate("/auth");
        return;
      }

      if (!profileData.businessName || !profileData.username) {
        toast.error("Business name and username are required");
        setSaving(false);
        return;
      }

      const sanitizedUsername = profileData.username
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const { error } = await supabase
        .from("profiles")
        .update({
          business_name: profileData.businessName,
          username: sanitizedUsername,
          description: profileData.description,
          logo: profileData.logo,
        })
        .eq("username", piUser.username);

      if (error) {
        if (error.code === "23505") {
          toast.error("This username is already taken");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Profile updated successfully!");
      setProfileData({ ...profileData, username: sanitizedUsername });
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-400 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !piUser) {
    return (
      <div className="min-h-screen bg-sky-400 flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-white">You must sign in with Pi Network to access your profile.</p>
        <Button onClick={() => window.location.href = '/auth'}>Sign in with Pi Network</Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader 
        title="Profile" 
        description="Edit your profile and settings"
        icon={<User />}
      />
      <div className="min-h-screen bg-sky-400 pb-24 px-4 py-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start justify-center">
          
          {/* Edit Form */}
          <Card className="flex-1 w-full bg-white shadow-xl border-slate-200">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Business / Display Name</label>
                <Input
                  value={profileData.businessName}
                  onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                  placeholder="e.g. My Awesome Store"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Username (Unique)</label>
                <Input
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  placeholder="username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Bio / Description</label>
                <Textarea
                  value={profileData.description}
                  onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                  placeholder="Tell us about yourself or your business..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Logo URL</label>
                <Input
                  value={profileData.logo}
                  onChange={(e) => setProfileData({ ...profileData, logo: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="flex-shrink-0 mx-auto">
             <div className="sticky top-6">
               <h3 className="text-white text-center mb-4 font-semibold">Live Preview</h3>
               <PhonePreview profile={profileData} />
             </div>
          </div>

        </div>
      </div>
      <FooterNav />
    </>
  );
};

export default Profile;

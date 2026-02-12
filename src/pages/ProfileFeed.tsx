import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePi } from "@/contexts/PiContext";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GiftDialog } from "@/components/GiftDialog";
import { ExternalLink, Share2, Eye, UserPlus, UserMinus, Zap, Copy, Flag, Gift, VolumeX, Volume2, Play, Pause } from "lucide-react";
import { getSocialIcon as getSocialIconBase, getSocialLabel, extractSocialUsername, isDisplayableSocialUrl } from "@/utils/social-utils";
import type { ProfileData, SocialEmbedItem } from "@/types/profile";
import { toast } from "sonner";
import { isVerifiedUser, getVerifiedBadgeUrl } from "@/utils/verifiedUsers";
import ReactPlayer from "react-player";

const getSocialIcon = (platform?: string) => getSocialIconBase(platform);
const AFFILIATE_SHARE_IMAGE_PATH = "/affiliate-share.jpg";

const upsertMetaTag = (attribute: "name" | "property", key: string, content: string) => {
  if (typeof document === "undefined") return;
  let tag = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

const upsertCanonicalLink = (href: string) => {
  if (typeof document === "undefined") return;
  let linkTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!linkTag) {
    linkTag = document.createElement("link");
    linkTag.setAttribute("rel", "canonical");
    document.head.appendChild(linkTag);
  }
  linkTag.setAttribute("href", href);
};

const normalizeSocialFeed = (feed: any): SocialEmbedItem[] => {
  if (!Array.isArray(feed)) return [];
  return feed
    .filter((item) => item && (item.url || item.embedHtml || (item as any).embed_html))
    .map((item, idx) => ({
      id: item.id || `feed-${idx}-${Date.now()}`,
      platform: item.platform || item.type || item.source || "Social",
      url: item.url,
      embedHtml: item.embedHtml || (item as any).embed_html,
      title: item.title || item.caption || item.description,
      pinned: item.pinned ?? true,
      thumbnail: item.thumbnail || item.image,
    }));
};

const ProfileFeed = () => {
  const { username: rawUsername } = useParams();
  const navigate = useNavigate();
  const username = rawUsername?.startsWith("@") ? rawUsername.slice(1) : rawUsername;
  const { piUser, isAuthenticated: isPiAuthenticated, showRewardedAd, signOut } = usePi();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [socialFeedItems, setSocialFeedItems] = useState<SocialEmbedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [visitCount, setVisitCount] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isDirectVideoFileUrl = (url?: string | null) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|m4v|mov)(?:$|[?#])/i.test(url);
  };

  const getCachedProfileFromStorage = () => {
    if (typeof window === "undefined") return null;
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith("profile_"));
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const id = parsed?.profileId || parsed?.id;
        if (id) return { id } as { id: string };
      }
    } catch (error) {
      console.error("[PROFILE] Failed to read cached profile:", error);
    }
    return null;
  };

  // Keep cached profile ID in state for follow actions
  useEffect(() => {
    if (!currentUserProfileId) {
      const cached = getCachedProfileFromStorage();
      if (cached?.id) setCurrentUserProfileId(cached.id);
    }
  }, [currentUserProfileId]);

  const formatCompactNumber = (value: number) => {
    if (!Number.isFinite(value)) return "0";
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return value.toLocaleString();
  };

  const checkFollowStatus = async () => {
    if (!profileId) return false;
    const cached = getCachedProfileFromStorage();
    const followerProfileId = currentUserProfileId || cached?.id || null;
    if (!followerProfileId) return false;
    const { data } = await (supabase as any)
      .from("followers")
      .select("id")
      .eq("follower_profile_id", followerProfileId)
      .eq("following_profile_id", profileId)
      .maybeSingle();
    const following = !!data;
    setIsFollowing(following);
    return following;
  };

  const loadProfile = async () => {
    if (!username) return;
    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*, theme_settings")
        .eq("username", username)
        .maybeSingle();
      if (error || !profileData) {
        setNotFound(true);
        return;
      }

      setProfileId(profileData.id);
      const cached = getCachedProfileFromStorage();
      if (cached?.id) setCurrentUserProfileId(cached.id);

      const themeSettings = (profileData as any).theme_settings || {};
      const feed = normalizeSocialFeed(
        themeSettings.socialFeedItems ||
        (profileData as any).social_feed ||
        (profileData as any).pinned_posts
      );

      const isValidSocialUrl = (url?: string | null) => {
        if (!url) return false;
        const trimmed = String(url).trim();
        return /^https?:\/\//i.test(trimmed);
      };

      const socialLinksArr = Array.isArray(profileData.social_links)
        ? profileData.social_links
            .filter((l: any) => isValidSocialUrl(l?.url))
            .map((l: any) => ({ platform: l.type || l.platform, url: l.url }))
        : [];

      // Check if user is verified (special list or database flag)
      const isSpecialVerified = isVerifiedUser(profileData.username);

      setProfile({
        id: profileData.id,
        username: profileData.username,
        email: "",
        logo: profileData.logo,
        businessName: profileData.business_name,
        appLink: (profileData as any).app_link,
        appTitle: (profileData as any).app_title,
        appLogo: (profileData as any).app_logo,
        appDescription: (profileData as any).app_description || "",
        appLinks: (themeSettings as any).appLinks || [],
        description: profileData.description,
        youtubeVideoUrl: profileData.youtube_video_url,
        backgroundMusicUrl: (profileData as any).background_music_url,
        socialLinks: socialLinksArr,
        customLinks: (themeSettings as any).customLinks || [],
        imageLinkCards: (themeSettings as any).imageLinkCards || [],
        theme: {
          primaryColor: themeSettings.primaryColor || "#38bdf8",
          backgroundColor: themeSettings.backgroundColor || "#000000",
          backgroundType: themeSettings.backgroundType || "color",
          backgroundGif: themeSettings.backgroundGif || "",
          backgroundVideo: themeSettings.backgroundVideo || "",
          iconStyle: themeSettings.iconStyle || "rounded",
          buttonStyle: themeSettings.buttonStyle || "filled",
          glassMode: themeSettings.glassMode ?? false,
          coverImage: themeSettings.coverImage || "",
          textColor: themeSettings.textColor,
        },
        wallets: { crypto: [], bank: [] },
        hasPremium: profileData.has_premium || false,
        piWalletAddress: profileData.pi_wallet_address || "",
        piDonationMessage: profileData.pi_donation_message || "",
        showShareButton: (profileData as any).show_share_button !== false,
        storeUrl: `@${profileData.username}`,
        showPiWalletTips: themeSettings.showPiWalletTips ?? true,
        card_front_color: (profileData as any).card_front_color || "#2bbdee",
        card_back_color: (profileData as any).card_back_color || "#2bbdee",
        card_text_color: (profileData as any).card_text_color || "#000000",
        card_accent_color: (profileData as any).card_accent_color || "#fafafa",
        isVerified: (profileData as any).is_verified || isSpecialVerified,
      });
      setSocialFeedItems(feed);
      
      // Load follower count
      const followerQuery: any = (supabase as any)
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_profile_id', profileData.id);
      const { count: followerCount } = await followerQuery as any;
      setFollowerCount(followerCount || 0);
      
      // Load visit count
      const { count: visitCount } = await supabase
        .from('analytics')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileData.id)
        .eq('event_type', 'view');
      setVisitCount(visitCount || 0);
      // Check follow status if possible
      await checkFollowStatus();
    } catch (err) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Auto-follow after returning from auth (same workflow as PublicBio)
  useEffect(() => {
    const authAction = sessionStorage.getItem('authAction');
    const profileToFollow = sessionStorage.getItem('profileToFollow');
    if (
      authAction === 'follow' &&
      profileToFollow &&
      (profileToFollow === username || profileToFollow === profileId) &&
      currentUserProfileId &&
      profileId &&
      currentUserProfileId !== profileId &&
      !isFollowing
    ) {
      sessionStorage.removeItem('authAction');
      sessionStorage.removeItem('profileToFollow');
      handleFollow();
    }
  }, [username, profileId, currentUserProfileId, isFollowing]);

  const handleFollow = async () => {
    const cached = getCachedProfileFromStorage();
    const followerProfileId = currentUserProfileId || cached?.id || null;
    if (!followerProfileId || !profileId) {
      toast.error("Please sign in to follow");
      return;
    }
    if (followerProfileId === profileId) {
      toast.error("You cannot follow yourself");
      return;
    }
    try {
      // Re-check to avoid double follow
      const alreadyFollowing = isFollowing || (await checkFollowStatus());
      if (alreadyFollowing) {
        // Unfollow path
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_profile_id", followerProfileId)
          .eq("following_profile_id", profileId);
        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
        // Sync follow state across pages
        localStorage.setItem(`follow_status_${profileId}`, 'false');
      } else {
        const { error } = await supabase
          .from("followers")
          .insert({ follower_profile_id: followerProfileId, following_profile_id: profileId });
        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
        // Sync follow state across pages
        localStorage.setItem(`follow_status_${profileId}`, 'true');
      }
    } catch (error) {
      console.error("Follow error:", error);
      toast.error("Could not update follow status");
    }
  };

  const handlePiSignIn = async () => {
    try {
      sessionStorage.setItem('authAction', 'follow');
      sessionStorage.setItem('profileToFollow', profileId || '');
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
      toast.loading("Redirecting to sign in...");
      navigate('/', { state: { authAction: 'follow', profileToFollow: profileId } });
    } catch (error) {
      console.error("Pi sign in error:", error);
      toast.error("Failed to redirect to sign in");
    }
  };

  const handleSignUpToFollow = () => {
    sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
    sessionStorage.setItem('authAction', 'follow');
    sessionStorage.setItem('profileToFollow', username || '');
    window.location.href = 'https://www.droplink.space';
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (profileId) {
      checkFollowStatus();
    }
  }, [profileId, currentUserProfileId]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isVideoMuted;
    videoRef.current.volume = isVideoMuted ? 0 : 0.6;
  }, [isVideoMuted]);

  useEffect(() => {
    if (!profile || typeof window === "undefined") return;
    const baseUrl = window.location.origin;
    const feedUrl = `${baseUrl}/@${profile.username}/feed`;
    const shareImage = `${baseUrl}${AFFILIATE_SHARE_IMAGE_PATH}`;
    const usernameTag = `@${profile.username}`;
    const profileDescription = (profile.description || profile.appDescription || "Affiliate feed on Droplink")
      .replace(/\s+/g, " ")
      .trim();
    const shareTitle = `${usernameTag} Feed | Droplink Affiliate`;
    const shareDescription = `${profileDescription} | Feed by ${usernameTag} on Droplink`;

    document.title = shareTitle;
    upsertCanonicalLink(feedUrl);
    upsertMetaTag("name", "title", shareTitle);
    upsertMetaTag("name", "description", shareDescription);
    upsertMetaTag("property", "og:type", "website");
    upsertMetaTag("property", "og:url", feedUrl);
    upsertMetaTag("property", "og:title", shareTitle);
    upsertMetaTag("property", "og:description", shareDescription);
    upsertMetaTag("property", "og:image", shareImage);
    upsertMetaTag("property", "og:image:alt", `${usernameTag} Droplink Affiliate Feed`);
    upsertMetaTag("name", "twitter:card", "summary_large_image");
    upsertMetaTag("name", "twitter:url", feedUrl);
    upsertMetaTag("name", "twitter:title", shareTitle);
    upsertMetaTag("name", "twitter:description", shareDescription);
    upsertMetaTag("name", "twitter:image", shareImage);
  }, [profile]);

  const videoVolume = isVideoMuted ? 0 : 0.5;

  const bgStyle = useMemo(() => {
    if (!profile) return {};
    if (profile.theme?.backgroundType === "gif" && profile.theme.backgroundGif) {
      return { backgroundImage: `url(${profile.theme.backgroundGif})`, backgroundSize: "cover", backgroundPosition: "center" };
    }
    if (profile.theme?.backgroundType === "video" && profile.theme.backgroundVideo) {
      return {};
    }
    return { backgroundColor: profile.theme?.backgroundColor || "#000" };
  }, [profile]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading feed...</div>;
  if (notFound || !profile) return <div className="min-h-screen flex items-center justify-center text-white">Profile not found</div>;
  const shouldUseNativeBackgroundVideo =
    profile.theme?.backgroundType === "video" &&
    !!profile.theme.backgroundVideo &&
    isDirectVideoFileUrl(profile.theme.backgroundVideo);

  return (
    <div className="min-h-screen text-white" style={bgStyle}>
      {profile.theme?.backgroundType === "video" && profile.theme.backgroundVideo && (
        <div className="fixed inset-0 w-full h-full">
          {shouldUseNativeBackgroundVideo ? (
            <video
              ref={videoRef}
              src={profile.theme.backgroundVideo}
              autoPlay
              loop
              muted={isVideoMuted}
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              onLoadedData={() => setIsVideoPlaying(true)}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onError={(e) => console.log('Native video background error', e)}
            />
          ) : (
            <ReactPlayer
              url={profile.theme.backgroundVideo}
              playing={isVideoPlaying}
              loop={true}
              muted={isVideoMuted}
              volume={videoVolume}
              width="100%"
              height="100%"
              className="react-player"
              style={{ position: 'absolute', top: 0, left: 0 }}
              config={{
                youtube: {
                  playerVars: { showinfo: 0, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, rel: 0, modestbranding: 1 }
                },
                vimeo: {
                  playerOptions: { background: 1, controls: false, title: false, byline: false, portrait: false }
                },
                file: {
                  attributes: {
                    style: { width: '100%', height: '100%', objectFit: 'cover' },
                    playsInline: true,
                    crossOrigin: 'anonymous'
                  }
                }
              }}
              onReady={() => setIsVideoPlaying(true)}
              onError={(e) => console.log('Video background error', e)}
            />
          )}
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !isVideoMuted;
                setIsVideoMuted(next);
                if (shouldUseNativeBackgroundVideo && videoRef.current) {
                  videoRef.current.muted = next;
                  videoRef.current.volume = next ? 0 : 0.6;
                  if (!next && isVideoPlaying && videoRef.current.paused) {
                    void videoRef.current.play().catch(() => {});
                  }
                }
              }}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20"
              title={isVideoMuted ? "Unmute background video" : "Mute background video"}
            >
              {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (shouldUseNativeBackgroundVideo && videoRef.current) {
                  if (isVideoPlaying) {
                    videoRef.current.pause();
                  } else {
                    void videoRef.current.play().catch(() => {});
                  }
                } else {
                  if (isVideoPlaying) {
                    setIsVideoPlaying(false);
                  } else {
                    setIsVideoPlaying(true);
                  }
                }
              }}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20"
              title={isVideoPlaying ? "Pause background video" : "Play background video"}
            >
              {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
      <div className="relative z-10 flex flex-col items-center px-4 pb-16" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.9) 100%)" }}>
        {/* Share and Watch Ads Icons */}
        <div className="w-full max-w-3xl flex items-center justify-between pt-6 px-2">
          <Button
            onClick={() => setShowShareDialog(true)}
            variant="ghost"
            size="icon"
            className="hover:bg-white/10 transition-all duration-200"
          >
            <Share2 className="w-6 h-6 text-white hover:text-cyan-400" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:text-white/80 hover:bg-transparent"
            onClick={async () => {
              try {
                const watched = await showRewardedAd();
                if (watched) {
                  toast.success('Thanks for watching! 🎉');
                }
              } catch (error) {
                console.error('Ad error:', error);
              }
            }}
          >
            <Zap className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="w-full max-w-3xl text-center pt-6 space-y-4">
          {profile.logo && (
            <div className="mx-auto w-28 h-28 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20">
              <img src={profile.logo} alt={profile.businessName} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-4xl font-bold drop-shadow-lg">{profile.businessName || profile.username || username || 'user'}</h1>
              {profile.isVerified && (
                <img 
                  src={getVerifiedBadgeUrl(profile.username)} 
                  alt="Verified" 
                  className="w-7 h-7" 
                  title="Verified Account"
                />
              )}
            </div>
            <p className="text-white/80">@{profile.username || username || 'user'}</p>
            
            {/* Follower and View Count */}
            <div className="flex items-center justify-center gap-4 pt-2 text-white/70 text-sm">
              <div className="flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                <span>{formatCompactNumber(followerCount)} Followers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{formatCompactNumber(visitCount)} Views</span>
              </div>
            </div>
            {/* Primary Action Buttons - same styling as PublicBio */}
            <div className="flex flex-col gap-3 justify-center pt-4 max-w-md mx-auto w-full">
              {/* Sign In / Follow Button */}
              {!currentUserProfileId && isPiAuthenticated === false && typeof window !== 'undefined' && (window as any).Pi ? (
                <Button
                  onClick={handlePiSignIn}
                  className={`rounded-full gap-2 w-full py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300`}
                  style={{ 
                    backgroundColor: profile.theme.primaryColor,
                    color: '#fff',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <UserPlus className="w-5 h-5" />
                  Sign in to Follow
                </Button>
              ) : currentUserProfileId && currentUserProfileId !== profileId ? (
                <Button
                  onClick={handleFollow}
                  className={`rounded-full gap-2 w-full py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300`}
                  style={isFollowing ? { 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: `2px solid ${profile.theme.primaryColor}`,
                    color: '#fff',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                  } : { 
                    backgroundColor: profile.theme.primaryColor,
                    color: '#fff',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                  }}
                  variant={isFollowing ? "outline" : "default"}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-5 h-5" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Follow
                    </>
                  )}
                </Button>
              ) : null}
              {/* Gift Button */}
              {currentUserProfileId && currentUserProfileId !== profileId && (
                <Button
                  onClick={() => setShowGiftDialog(true)}
                  className={`rounded-full gap-2 w-full py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300`}
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    border: `2px solid ${profile.theme.primaryColor}`,
                    color: '#fff',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                  }}
                  variant="outline"
                >
                  <Gift className="w-5 h-5" />
                  Send Gift
                </Button>
              )}
              {/* Anonymous Follow Prompt */}
              {!currentUserProfileId && !(typeof window !== 'undefined' && (window as any).Pi && isPiAuthenticated === false) && (
                <div className="flex justify-center pt-2">
                  <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10 w-full">
                    <p className="text-sm text-white mb-3">Like this profile? Sign up to follow!</p>
                    <Button
                      onClick={handleSignUpToFollow}
                      className="rounded-full gap-2 w-full py-2.5 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ 
                        backgroundColor: profile.theme.primaryColor,
                        color: '#fff',
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      <UserPlus className="w-4 h-4" />
                      Sign up to Follow
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {(() => {
            const appLinks = Array.isArray(profile.appLinks) && profile.appLinks.length > 0
              ? profile.appLinks
              : profile.appLink
                ? [{
                    id: "primary",
                    title: profile.appTitle || "Check out my App",
                    url: profile.appLink,
                    logo: profile.appLogo,
                    description: profile.appDescription
                  }]
                : [];
            if (appLinks.length === 0) return null;
            return (
              <div className="w-full max-w-xl mx-auto pt-4 pb-2 space-y-4">
                {appLinks.map((link: any) => (
                  <a
                    key={link.id || link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-3xl p-5 sm:p-6 transition-all hover:scale-[1.02]"
                  >
                    {link.logo ? (
                      <img
                        src={link.logo}
                        alt={link.title || "App"}
                        className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                        <Zap className="w-9 h-9 text-white" />
                      </div>
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="text-white font-bold text-xl mb-1 truncate">{link.title || "Check out my App"}</h3>
                      {link.description && (
                        <p className="text-white/80 text-sm mb-2 line-clamp-2">{link.description}</p>
                      )}
                      <span className="text-white/90 text-sm flex items-center gap-1">
                        Open App <ExternalLink className="w-4 h-4" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            );
          })()}

          <div className="flex flex-wrap justify-center gap-3">
  {(profile.socialLinks || [])
    .filter((link) => isDisplayableSocialUrl(link?.url))
    .map((link) => {
      const platformId = link.platform || link.type || link.icon || "";
      const username = extractSocialUsername(platformId, link.url);
      const followers = Number(link.verified_followers ?? link.followers ?? 0);
      const label = getSocialLabel(platformId);
      return (
        <a
          key={platformId || link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1"
          title={label}
        >
          <span className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition">
            <span className="text-white text-lg">{getSocialIcon(platformId)}</span>
          </span>
          <span className="text-[11px] text-white/85 max-w-[88px] truncate">
            {username ? `@${username}` : label}
          </span>
          {followers > 0 && (
            <span className="text-[10px] text-white/60">
              {formatCompactNumber(followers)} followers
            </span>
          )}
        </a>
      );
    })}
</div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Button
              variant="ghost"
              className="gap-2 text-white/90 border border-white/20 bg-white/5 hover:bg-white/10"
              onClick={() => navigate(`/@${profile.username}`)}
            >
              <Share2 className="w-4 h-4" />
              Public Bio
            </Button>
            <Button
              variant="ghost"
              className="gap-2 text-white/80 border border-white/20 bg-white/0 hover:bg-white/10"
              onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success("Feed link copied"))}
            >
              <ExternalLink className="w-4 h-4" />
              Copy Feed Link
            </Button>
          </div>
        </div>

        <div className="w-full max-w-3xl mt-10 space-y-4">
          {socialFeedItems.length === 0 && (
            <div className="border border-dashed border-white/20 rounded-xl p-4 text-center text-white/70 bg-white/5">
              No feed posts yet.
            </div>
          )}
          {socialFeedItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/15 bg-black/30 backdrop-blur-sm p-4 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white text-xl">
                  {getSocialIcon(item.platform)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80">{item.platform || "Social"}</p>
                  <p className="text-white font-semibold truncate">{item.title || item.url || "Pinned post"}</p>
                </div>
                {item.pinned && (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/15 text-white/80 border border-white/20">Pinned</span>
                )}
              </div>
              {item.embedHtml ? (
                <div
                  className="rounded-lg overflow-hidden bg-white/5 border border-white/10"
                  dangerouslySetInnerHTML={{ __html: item.embedHtml }}
                />
              ) : (
                <div className="rounded-lg overflow-hidden bg-white/5 border border-white/10">
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt={item.title || "post"} className="w-full h-56 object-cover" />
                  )}
                  <div className="p-3 flex items-center justify-between gap-3">
                    <div className="text-white/80 text-sm truncate">{item.url || "No link available"}</div>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20"
                      >
                        Open
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Report Button in Footer */}
      <div className="text-center py-6">
        <button
          className="bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 rounded-full p-3 shadow-lg border border-red-400/40 inline-flex items-center gap-2 px-6 transition-all duration-200 backdrop-blur"
          title="Report unwanted content"
          onClick={() => setShowReportModal(true)}
        >
          <Flag className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300 font-semibold">Report Unwanted Content</span>
        </button>
      </div>

      {/* Droplink Branding Footer */}
      {profile && !profile.hasPremium && (
        <div className="text-center py-6">
          <button
            onClick={() => window.location.href = "https://www.droplink.space"}
            className="text-white/70 text-xs font-semibold hover:text-cyan-400 transition-all duration-200 cursor-pointer group"
          >
            JOIN <span className="text-cyan-400 group-hover:text-cyan-300">DROPLINK</span> BY <span className="text-white/80">MRWAIN ORGANIZATION</span>
          </button>
        </div>
      )}

      {/* Footer Links */}
      <div className="text-center py-4">
        <div className="flex flex-wrap justify-center gap-2 text-xs text-white/60">
          <a
            href="https://www.droplink.space/cookies"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/80 transition-colors"
          >
            Cookie Preferences
          </a>
          <span>·</span>
          <button
            onClick={() => setShowReportModal(true)}
            className="hover:text-white/80 transition-colors"
          >
            Report
          </button>
          <span>·</span>
          <button
            onClick={() => navigate('/privacy')}
            className="hover:text-white/80 transition-colors"
          >
            Privacy
          </button>
          <span>·</span>
          <button
            onClick={() => navigate('/terms')}
            className="hover:text-white/80 transition-colors"
          >
            Terms
          </button>
          <span>·</span>
          <button
            onClick={() => navigate('/search-users')}
            className="hover:text-white/80 transition-colors"
          >
            Discover
          </button>
        </div>
      </div>

      {profile.piWalletAddress && profile.showPiWalletTips !== false && (
        <div className="fixed bottom-4 right-4 bg-black/70 border border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-xl backdrop-blur">
          <QRCodeSVG value={profile.piWalletAddress} size={64} bgColor="#fff" fgColor="#2563eb" />
          <div className="space-y-1">
            <p className="text-xs text-white/70">Send DROP / Pi</p>
            <p className="text-sm text-white font-semibold">{profile.piWalletAddress.slice(0, 6)}...{profile.piWalletAddress.slice(-4)}</p>
          </div>
        </div>
      )}
      
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-[500px] md:max-w-[550px] rounded-xl overflow-visible p-6">
          {/* Header with Icon */}
          <div className="flex items-center gap-3 mb-6 mt-2">
            <div className="bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 p-3 rounded-lg">
              <Share2 className="size-5" />
            </div>
            <DialogTitle className="text-xl font-semibold">Share Feed</DialogTitle>
          </div>
          
          {/* Body Content */}
          <div className="space-y-6 py-2">
            {/* QR Code Display */}
            <div className="flex justify-center">
              <QRCodeSVG
                value={window.location.href}
                size={200}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Scan QR code to view feed</p>
          </div>
          
          {/* Footer with Action Button */}
          <div className="flex gap-2 justify-end border-t pt-4 mt-4">
            <Button
              className="w-full bg-sky-500 hover:bg-sky-600 text-white h-11"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Feed link copied to clipboard!');
                setShowShareDialog(false);
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Copy Feed Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-xs w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowReportModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex flex-col items-center gap-3">
              <Flag className="w-8 h-8 text-red-500 mb-2" />
              <h2 className="text-lg font-bold text-red-600">Report Unwanted Content</h2>
              <p className="text-sm text-gray-700 text-center mb-2">If you see inappropriate, abusive, or unwanted content on this feed, please report it. Your feedback helps keep Droplink safe for everyone.</p>
              <a
                href="https://www.droplink.space/report-abuse"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold shadow hover:bg-red-600 transition"
              >
                Go to Report Page
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Gift Dialog */}
      {profileId && currentUserProfileId && (
        <GiftDialog
          open={showGiftDialog}
          onOpenChange={setShowGiftDialog}
          receiverProfileId={profileId}
          senderProfileId={currentUserProfileId}
          receiverName={profile?.businessName || profile?.username || ""}
        />
      )}
    </div>
  );
};

export default ProfileFeed;







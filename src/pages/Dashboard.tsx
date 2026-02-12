import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhonePreview } from "@/components/PhonePreview";
import { Analytics } from "@/components/Analytics";
import { DesignCustomizer } from "@/components/DesignCustomizer";
import { CustomLinksManager } from "@/components/CustomLinksManager";
import { PiAdBanner } from "@/components/PiAdBanner";
import { AdGatedFeature } from "@/components/AdGatedFeature";
import { PlanGate } from "@/components/PlanGate";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";
import { useMonetization } from "@/hooks/useMonetization";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ProductManager } from "@/components/ProductManager";
import { ImageLinkCardManager } from "@/components/ImageLinkCardManager";
import { SocialMediaManager } from "@/components/SocialMediaManager";
import { MembershipManager } from "@/components/MembershipManager";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
// Removed duplicate Dialog imports to fix duplicate identifier errors
import { useAutoSave } from "@/hooks/useAutoSave";
import { saveProfileToSupabase } from "@/lib/realtimeSync";
import { supabase } from "@/integrations/supabase/client";
import { usePi } from "@/contexts/PiContext";
import { uploadMessageImage } from "@/lib/supabase-storage";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { performCompleteSignOut } from "@/lib/auth-utils";
import { UserPreferencesManager } from "@/components/UserPreferencesManager";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { AboutModal } from "@/components/AboutModal";
import { RandomAvatarGenerator } from "@/components/RandomAvatarGenerator";
import { FutureFeaturesDashboard } from "@/components/FutureFeaturesDashboard";
import { DropTokenManager } from "@/components/DropTokenManager";
import PiAdNetwork from "../components/PiAdNetwork";
import PiPayments from "@/components/PiPayments";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import SubscriptionStatus from "@/components/SubscriptionStatus";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import VotingSystem from "@/components/VotingSystem";
import { ProfileData, SocialEmbedItem, AppLinkItem } from "@/types/profile";
import LinkManager from "@/components/LinkManager";
import { PiAuthTest } from "@/components/PiAuthTest";
import { AccountDeletion } from "@/components/AccountDeletion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import { BioTemplate, DEFAULT_TEMPLATE } from "@/config/bioTemplates";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import {
  Upload, 
  Twitter, 
  Instagram, 
  Youtube, 
  Music, 
  Facebook, 
  Linkedin, 
  Twitch, 
  Globe,
  LogOut,
  Eye,
  EyeOff,
  Settings,
  Palette,
  BarChart3,
  QrCode,
  Share2,
  Menu,
  LayoutGrid,
  Wallet,
  Users,
  User,
  Bot,
  Info,
  Droplets,
  TrendingUp,
  PlayCircle,
  CreditCard,
  Crown,
  Store,
  Mail,
  Moon,
  Sun,
  Home,
  Plus,
  X,
  Search,
  Image,
  ExternalLink,
  Lock,
  AlertTriangle,
  Download,
} from "lucide-react";
import { 
  FaTwitter, 
  FaInstagram, 
  FaYoutube, 
  FaSpotify, 
  FaFacebook, 
  FaLinkedin, 
  FaTwitch, 
  FaTiktok
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";
import { isVerifiedUser, getVerifiedBadgeUrl } from "@/utils/verifiedUsers";
import { DroplinkSpinner } from "@/components/DroplinkSpinner";
import { QRCodeDialog } from "@/components/QRCodeDialog";

// Utility: Check if running in Pi Browser
function isPiBrowserMobile() {
  if (typeof window === 'undefined' || !window.navigator) return false;
  const ua = window.navigator.userAgent || '';
  return /PiBrowser/i.test(ua) && /Mobile/i.test(ua);
}

const buildPollinationsUrl = (prompt: string, size = 512) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${size}&height=${size}&nologo=true&seed=${Date.now()}`;

interface PaymentLink {
  id: string;
  amount: number;
  description: string;
  type: 'product' | 'donation' | 'tip' | 'subscription' | 'group';
  url: string;
  created: Date;
  active: boolean;
  totalReceived: number;
  transactionCount: number;
}

type DashboardProps = {
  initialTab?: string;
  hideTabNavigation?: boolean;
};

const tabAliases: Record<string, string> = {
  droppay: "monetization",
};

const routeTabs = new Set([
  "profile",
  "design",
  "analytics",
  "ad-network",
  "monetization",
  "memberships",
  "subscription",
  "preferences",
  "payments",
]);

const getTabFromPath = (pathname: string) => {
  if (!pathname.startsWith("/dashboard")) return null;
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "dashboard") return null;
  const rawTab = parts[1];
  if (!rawTab) return null;
  const normalized = tabAliases[rawTab] ?? rawTab;
  return routeTabs.has(normalized) ? normalized : null;
};

const Dashboard = ({ initialTab, hideTabNavigation }: DashboardProps) => {
  const [showPlanModal, setShowPlanModal] = useState(false);
  // AI Logo Generation State (fix ReferenceError)
  // Greeting state
  const [greeting, setGreeting] = useState("");
  const [aiLogoPrompt, setAiLogoPrompt] = useState("");
  const [aiLogoLoading, setAiLogoLoading] = useState(false);
  const [aiLogoError, setAiLogoError] = useState("");
  const [showFooter, setShowFooter] = useState(true);
  const lastScrollYRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hooks must be called unconditionally
  const piContext = usePi();
  const { piUser, isAuthenticated, signIn, signOut: piSignOut, loading: piLoading, getCurrentWalletAddress } = piContext;
  const [showPiAuthModal, setShowPiAuthModal] = useState(false);
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();

  // Scroll detection for footer navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      const lastScrollY = lastScrollYRef.current;

      if (currentScrollY < 10) {
        setShowFooter(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past threshold - hide footer
        setShowFooter(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show footer
        setShowFooter(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Pi Auth is optional - removed enforcement to allow dashboard access without Pi Browser
  // useEffect(() => {
  //   if (!isAuthenticated || !piUser) {
  //     setShowPiAuthModal(true);
  //   } else {
  //     setShowPiAuthModal(false);
  //   }
  // }, [isAuthenticated, piUser]);

  const handlePiAuth = async () => {
    try {
      await signIn(["username", "payments", "wallet_address"]);
      setShowPiAuthModal(false);
      toast.success("Pi authentication complete! Dashboard unlocked.");
    } catch (error) {
      toast.error("Pi authentication failed. Please try again in Pi Browser.");
    }
  };

  // Set greeting based on time
  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
    };
    setGreeting(getGreeting());
  }, []);

  const subscription = useActiveSubscription();
  const { plan, expiresAt, loading: subscriptionLoading, profileId: subscriptionProfileId, refetch: refetchSubscription } = subscription;
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [cancelingPlan, setCancelingPlan] = useState(false);
  
  // State declarations (must come before any hooks that use them)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    id: "",
    username: "",
    logo: "",
    businessName: "",
    appLink: "",
    appTitle: "",
    appLogo: "",
    appDescription: "",
    appLinks: [],
    storeUrl: "",
    description: "",
    email: "",
    youtubeVideoUrl: "",
    backgroundMusicUrl: "",
    socialLinks: [
      { type: "dropshare", url: "", icon: "dropshare", followers: 0 },
      { type: "twitter", url: "", icon: "twitter", followers: 0 },
      { type: "instagram", url: "", icon: "instagram", followers: 0 },
      { type: "youtube", url: "", icon: "youtube", followers: 0 },
      { type: "tiktok", url: "", icon: "tiktok", followers: 0 },
      { type: "facebook", url: "", icon: "facebook", followers: 0 },
      { type: "linkedin", url: "", icon: "linkedin", followers: 0 },
      { type: "twitch", url: "", icon: "twitch", followers: 0 },
      { type: "website", url: "", icon: "website", followers: 0 },
    ],
    customLinks: [],
    theme: {
      primaryColor: "#38bdf8",
      backgroundColor: "#000000",
      backgroundType: "color",
      backgroundGif: "",
      backgroundVideo: "",
      iconStyle: "rounded",
      buttonStyle: "filled",
      glassMode: false,
      coverImage: "",
    },
    products: [],
    imageLinkCards: [],
    socialFeedItems: [],
    paymentLinks: [],
    hasPremium: false,
    showShareButton: true,
    piWalletAddress: "",
    piDonationMessage: "Send me a coffee",
    isVerified: false,
    customDomain: "",
  });

  // Monetization hooks (now profileId state is declared above)
  const { tiers, products, orders, leads, saveTier, saveProduct, deleteTier, deleteProduct, createOrder, captureLead, exportLeads } = useMonetization(profileId);
  const { summary: analyticsSummary, logClickEvent, exportAnalytics } = useAnalytics(profileId);
  
  // Use profileId if available, otherwise fall back to subscriptionProfileId
  const effectiveProfileId = profileId || subscriptionProfileId;




  // Check expiration and show modal if expired or near expiration
  useEffect(() => {
    if (!subscriptionLoading && expiresAt) {
      const now = new Date();
      const expires = new Date(expiresAt);
      // Show modal if expired or within 3 days
      if (expires < now || (expires.getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000) {
        setShowRenewModal(true);
      } else {
        setShowRenewModal(false);
      }
    }
    
    // Sync subscription status to local profile state
    if (!subscriptionLoading && plan !== "free" && !profile.hasPremium) {
      setProfile(prev => ({ ...prev, hasPremium: true }));
    } else if (!subscriptionLoading && plan === "free" && profile.hasPremium) {
       // Only set to false if we are sure it's free/expired
       // But be careful not to overwrite if there's some other reason
       setProfile(prev => ({ ...prev, hasPremium: false }));
    }
  }, [expiresAt, subscriptionLoading, plan, profile.hasPremium]);

  // Helper: is plan expired?
  const isPlanExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  
  const { preferences, updateNestedPreference, updatePreference } = useUserPreferences();

  const isMobile = useIsMobile();
  const [showPreview, setShowPreview] = useState(!preferences.dashboard_layout.sidebarCollapsed);
  const [previewMode, setPreviewMode] = useState<"bio" | "feed">("bio");
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [bioTemplate, setBioTemplate] = useState<BioTemplate>(DEFAULT_TEMPLATE);
  const [showQRCode, setShowQRCode] = useState(false);
  const [piWalletQrData, setPiWalletQrData] = useState<string>("");
  const [showPiWalletQR, setShowPiWalletQR] = useState(false);
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);
  const [displayUsername, setDisplayUsername] = useState<string | null>(null);
  const [hasSupabaseSession, setHasSupabaseSession] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showDroplinkTutorialModal, setShowDroplinkTutorialModal] = useState(false);
  const [inboxUnreadCount, setInboxUnreadCount] = useState(0);
  const [followerBadge, setFollowerBadge] = useState(0);
  const [showInboxPreview, setShowInboxPreview] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversations, setConversations] = useState<Array<{
    otherUserId: string;
    username: string;
    logo?: string | null;
    lastMessage: string;
    createdAt: string;
  }>>([]);
  const [showPageSwitcher, setShowPageSwitcher] = useState(false);
  const [isSwitchingPage, setIsSwitchingPage] = useState(false);
  const switchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveInitializedRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState(
    initialTab || getTabFromPath(location.pathname) || preferences.dashboard_layout.activeTab || "profile"
  );

  const beginPageSwitch = useCallback(
    (nextTab?: string) => {
      if (nextTab && nextTab === activeTab) return;
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current);
        switchTimeoutRef.current = null;
      }
      setIsSwitchingPage(true);
    },
    [activeTab]
  );

  useEffect(() => {
    const tabFromPath = getTabFromPath(location.pathname);
    const nextTab = initialTab || tabFromPath || preferences.dashboard_layout.activeTab || "profile";

    if (nextTab !== activeTab) {
      beginPageSwitch(nextTab);
      setActiveTab(nextTab);
    }

    if (!initialTab && location.pathname === "/dashboard") {
      navigate(`/dashboard/${nextTab}`, { replace: true });
    }
  }, [location.pathname, preferences.dashboard_layout.activeTab, activeTab, navigate, initialTab, beginPageSwitch]);

  useEffect(() => {
    if (!isSwitchingPage) return;
    switchTimeoutRef.current = setTimeout(() => {
      setIsSwitchingPage(false);
      switchTimeoutRef.current = null;
    }, 450);
    return () => {
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current);
        switchTimeoutRef.current = null;
      }
    };
  }, [isSwitchingPage]);




  // FAILSAFE: Check for pending Pi payments on load
  useEffect(() => {
    const checkPendingPayment = async () => {
      const pendingPaymentId = localStorage.getItem('pending_pi_payment_id');
      if (!pendingPaymentId) return;
      
      console.log('[DASHBOARD] Checking pending payment:', pendingPaymentId);
      
      try {
        // 1. Verify payment status
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment', {
          body: { paymentId: pendingPaymentId }
        });
        
        if (verifyError || !verifyData?.success) {
           console.warn('[DASHBOARD] Failed to verify pending payment:', verifyError || verifyData);
           return;
        }
        
        const payment = verifyData.payment;
        const status = payment.status; // Object with boolean flags
        console.log('[DASHBOARD] Pending payment status:', status);
        
        // 2. Handle based on status
        // Case A: Already completed on Pi side (developer_completed_transaction is true)
        // Case B: Transaction verified but not completed (transaction_verified is true)
        if (status.developer_completed_transaction || status.transaction_verified) {
             const txid = payment.transaction?.txid;
             if (txid) {
                 console.log('[DASHBOARD] Restoring/Completing payment with txid:', txid);
                 const { data: completeData, error: completeError } = await supabase.functions.invoke('pi-payment-complete', {
                     body: { paymentId: pendingPaymentId, txid }
                 });
                 
                 if (!completeError && completeData?.success) {
                     toast.success('Restored pending subscription purchase! 🎉');
                     localStorage.removeItem('pending_pi_payment_id');
                     localStorage.removeItem('pending_pi_plan_type');
                     // Reload subscription
                     refetchSubscription();
                     // Also refresh session
                     await supabase.auth.refreshSession();
                 } else {
                     console.error('[DASHBOARD] Failed to complete pending payment:', completeError);
                 }
             } else {
                 console.warn('[DASHBOARD] Payment has status but no txid:', payment);
             }
        } else if (status.cancelled || status.user_cancelled) {
            console.log('[DASHBOARD] Pending payment was cancelled');
            localStorage.removeItem('pending_pi_payment_id');
            localStorage.removeItem('pending_pi_plan_type');
        }
        
      } catch (err) {
        console.error('[DASHBOARD] Error checking pending payment:', err);
      }
    };
    
    // Run once on mount
    checkPendingPayment();
  }, [refetchSubscription]);


  // Check for Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSupabaseSession(!!session?.user);
    };
    checkSession();
  }, []);

  // Block dashboard access when no authenticated account exists
  useEffect(() => {
    if (piLoading) return;
    if (!isAuthenticated && !hasSupabaseSession) {
      navigate("/auth");
    }
  }, [piLoading, isAuthenticated, hasSupabaseSession, navigate]);

  // Add timeout for auth loading to prevent infinite loading
  useEffect(() => {
    const authTimeout = setTimeout(() => {
      if (loading) {
        console.log('Authentication timeout - proceeding without Pi auth');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(authTimeout);
  }, [loading]);


  // Auto-save functionality with enhanced database sync and robust Pi Browser/mobile error handling
  const autoSave = useAutoSave<ProfileData>({
    tableName: 'profiles',
    recordId: profileId || '',
    delay: 3000, // 3 second delay
    onSave: async (data: ProfileData) => {
      // Enhanced save logic for all profile features
      if (!profileId) return;

      // Pi Browser/mobile-specific checks
      if (isPiBrowserMobile()) {
        if (typeof window.Pi === 'undefined') {
          toast.error('Pi SDK not loaded. Please refresh in Pi Browser.');
          throw new Error('Pi SDK not loaded');
        }
        if (!piUser || !isAuthenticated) {
          toast.error('You must be authenticated with Pi Network to save changes. Please sign in again.');
          throw new Error('Not authenticated in Pi Browser');
        }
      }

      try {
        // 1. Upsert main profile data with all features (prevents UNIQUE_VIOLATION)
        if (!profileId || !data.username) {
          toast.error('Profile ID or username missing. Cannot save profile.');
          throw new Error('Profile ID or username missing');
        }
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: profileId,
            business_name: data.businessName,
            description: data.description,
            youtube_video_url: data.youtubeVideoUrl,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            social_links: data.socialLinks as any,
            theme_settings: {
              ...data.theme,
              glassMode: data.theme?.glassMode ?? false,
              customLinks: data.customLinks || [],
              socialFeedItems: data.socialFeedItems || [],
              imageLinkCards: data.imageLinkCards || [],
              appLinks: data.appLinks || [],
              appLink: data.appLink,
              appTitle: data.appTitle,
              appLogo: data.appLogo,
              appDescription: data.appDescription,
              email: data.email,
              backgroundMusicUrl: data.backgroundMusicUrl,
              customDomain: data.customDomain,
              isVerified: data.isVerified,
              category: data.category,
              bioTemplate: bioTemplate,
              piWalletAddress: data.piWalletAddress,
              piDonationMessage: data.piDonationMessage,
              showShareButton: data.showShareButton,
              paymentLinks: (data.paymentLinks || []).map(link => ({
                id: link.id,
                amount: link.amount,
                description: link.description,
                type: link.type,
                url: link.url,
                created: link.created.toISOString(),
                active: link.active,
                totalReceived: link.totalReceived,
                transactionCount: link.transactionCount
              }))
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            social_feed: data.socialFeedItems || [],
            logo: data.logo,
            // show_share_button: data.showShareButton, // Moved to theme_settings
            // pi_wallet_address: data.piWalletAddress, // Moved to theme_settings
            // pi_donation_message: data.piDonationMessage, // Moved to theme_settings
            // Don't sync has_premium from client to server - let the server trigger handle it
            // has_premium: data.hasPremium || false, 
            updated_at: new Date().toISOString(),
            username: data.username
          });

        if (profileError) {
          // Log full error for debugging
          console.error('Supabase profile upsert error:', profileError);
          // Show specific error messages for common issues
          if (profileError.message?.includes('permission denied') || profileError.message?.includes('row level security')) {
            toast.error('Supabase permissions error. Please check RLS policies and API key permissions.');
          } else if (profileError.message?.includes('does not exist') || profileError.message?.includes('column')) {
            toast.error('Supabase schema error. Please check that the profiles table and all columns exist.');
          } else if (profileError.code === '23505' || profileError.message?.includes('duplicate key')) {
            toast.error('Username or ID already exists. Please use a unique username.');
          } else {
            toast.error('Failed to save profile to database. Please try again.');
          }
          throw profileError;
        }

        // 2. Sync products to database
        if (data.products && data.products.length > 0) {
          // Delete existing products for clean sync
          await supabase
            .from('products')
            .delete()
            .eq('profile_id', profileId);

          // Insert updated products
          const productsToInsert = data.products.map(product => ({
            profile_id: profileId,
            title: product.title,
            description: product.description,
            price: typeof product.price === 'string' ? product.price : product.price?.toString?.() ?? "",
            file_url: product.fileUrl
          }));

          if (productsToInsert.length > 0) {
            const { error: productsError } = await supabase
              .from('products')
              .insert(productsToInsert);

            if (productsError) {
              console.error('Products sync error:', productsError);
            }
          }
        }

        // 3. Enhanced localStorage backup with all features
        // (defaultProfile definition moved outside this block for clarity)
        // ...rest of the code remains unchanged...

        console.log('✅ All user data synced to Supabase successfully');

      } catch (error) {
        // Show a more specific error for Pi Browser/mobile
        if (isPiBrowserMobile()) {
          toast.error('Save failed in Pi Browser. Please check your Pi authentication and network connection.');
        }
        console.error('❌ Database sync error:', error);
        throw error; // Re-throw to trigger error handling
      }
    },
    onError: (error: Error) => {
      console.error('Auto-save failed:', error);
      toast.error('Failed to save changes to database. Please check your connection.');
    }
  });

  // Track profile changes and trigger auto-save (with safeguards against infinite loops)
  const lastProfileRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Only trigger auto-save if:
    // 1. Profile ID exists
    // 2. Not currently loading initial data
    // 3. Profile has actually changed (compare JSON strings)
    if (profileId && !loading) {
      const currentProfile = JSON.stringify(profile);
      
      // Check if profile has meaningfully changed
      if (currentProfile !== lastProfileRef.current && lastProfileRef.current !== '') {
        // Clear any existing timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        // Set new timeout for auto-save
        saveTimeoutRef.current = setTimeout(() => {
          autoSave.updateData(profile);
        }, 3000); // 3 second debounce
      }
      
      // Update last profile reference
      lastProfileRef.current = currentProfile;
    }
    
    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, profileId, loading]); // Safe dependencies - won't cause infinite loop due to ref check

  // Helper function to save profile immediately (for critical changes)
  const saveProfileNow = async (updatedProfile?: Partial<ProfileData>) => {
    const dataToSave = { ...profile, ...updatedProfile };
    if (!profileId) {
      console.error('❌ No profile ID - cannot save');
      return false;
    }

    try {
      console.log('💾 Saving profile to Supabase immediately...');
      const success = await saveProfileToSupabase(profileId, {
        id: profileId,
        business_name: dataToSave.businessName,
        description: dataToSave.description,
        youtube_video_url: dataToSave.youtubeVideoUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        social_links: dataToSave.socialLinks as any,
        theme_settings: {
          ...dataToSave.theme,
          customLinks: dataToSave.customLinks || [],
          socialFeedItems: dataToSave.socialFeedItems || [],
          appLinks: dataToSave.appLinks || [],
          appLink: dataToSave.appLink,
          appTitle: dataToSave.appTitle,
          appLogo: dataToSave.appLogo,
          appDescription: dataToSave.appDescription,
          email: dataToSave.email,
          backgroundMusicUrl: dataToSave.backgroundMusicUrl,
          customDomain: dataToSave.customDomain,
          category: dataToSave.category,
          isVerified: dataToSave.isVerified,
          piWalletAddress: dataToSave.piWalletAddress,
          piDonationMessage: dataToSave.piDonationMessage,
          showShareButton: dataToSave.showShareButton,
          paymentLinks: (dataToSave.paymentLinks || []).map((link: PaymentLink) => ({
            id: link.id,
            amount: link.amount,
            description: link.description,
            type: link.type,
            url: link.url,
            created: link.created instanceof Date ? link.created.toISOString() : (link.created as string),
            active: link.active,
            totalReceived: link.totalReceived,
            transactionCount: link.transactionCount
          }))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        social_feed: dataToSave.socialFeedItems || [],
        logo: dataToSave.logo,
        // show_share_button: dataToSave.showShareButton, // Moved to theme_settings
        // pi_wallet_address: dataToSave.piWalletAddress, // Moved to theme_settings
        // pi_donation_message: dataToSave.piDonationMessage, // Moved to theme_settings
        // has_premium: dataToSave.hasPremium, // Removed to prevent overwriting server trigger
      });

      if (success) {
        console.log('✅ Profile saved immediately');
        toast.success('Changes saved to Supabase', { duration: 2000 });
      }
      return success;
    } catch (error) {
      console.error('❌ Failed to save profile immediately:', error);
      toast.error('Failed to save changes', { duration: 5000 });
      return false;
    }
  };

  // Update Pi Wallet QR data when wallet address changes
  useEffect(() => {
    if (profile.piWalletAddress) {
      setPiWalletQrData(profile.piWalletAddress);
    }
  }, [profile.piWalletAddress]);

  // Load payment links for the current user
  const loadPaymentLinks = useCallback((): PaymentLink[] => {
    if (!piUser?.uid) return [];
    
    try {
      const stored = localStorage.getItem(`paymentLinks_${piUser.uid}`);
      if (stored) {
        const links = JSON.parse(stored);
        if (Array.isArray(links)) {
          // Convert date strings back to Date objects
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return links.map((link: any) => ({
            ...link,
            created: new Date(link.created)
          }));
        }
      }
    } catch (error) {
      console.error('Error loading payment links:', error);
    }
    return [];
  }, [piUser?.uid]);

  const { initialize: initializeAutoSave } = autoSave;

  // Initialize auto-save with profile data (once per profileId)
  useEffect(() => {
    if (!profileId || loading || !profile?.id) return;
    if (autoSaveInitializedRef.current === profileId) return;
    initializeAutoSave(profile);
    autoSaveInitializedRef.current = profileId;
  }, [profileId, loading, profile, initializeAutoSave]);

  // Refresh payment links when piUser changes or when coming back to dashboard
  useEffect(() => {
    if (piUser?.uid && profileId) {
      const paymentLinks = loadPaymentLinks();
      setProfile(prev => ({
        ...prev,
        paymentLinks
      }));
    }
  }, [piUser?.uid, profileId, loadPaymentLinks]);



  // Manual save function
  const handleManualSave = async () => {
    setSaveStatus('saving');
    try {
      await autoSave.save();
      setSaveStatus('saved');
      toast.success('Profile saved successfully!');
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('idle');
      toast.error('Failed to save profile');
    }
  };

  // Redirect new users to subscription page if they haven't selected a plan
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isAuthenticated || !piUser || subscriptionLoading || hasCheckedSubscription) return;
      
      try {
        // Check for subscription activation flag
        const activatedFlag = sessionStorage.getItem('subscription_activated');
        if (activatedFlag) {
          try {
            const { plan, billing } = JSON.parse(activatedFlag);
            toast.success(`🎉 Plan Activated!`, {
              description: `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} ${billing === 'yearly' ? 'Annual' : 'Monthly'} plan is now active. Enjoy premium features!`,
              duration: 5000,
            });
            // Refetch subscription to ensure UI reflects new plan
            await refetchSubscription();
          } catch (e) {
            console.warn('Failed to parse activation flag:', e);
          }
          sessionStorage.removeItem('subscription_activated');
        }
        
        // Check if user has any subscription (even free counts as a selection)
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", piUser.username)
          .maybeSingle();

        if (profile?.id) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("profile_id", profile.id)
            .limit(1)
            .maybeSingle();

          // If no subscription record exists, redirect to subscription page
          if (!sub) {
            const hasSeenSubscription = sessionStorage.getItem(`seen_subscription_${piUser.username}`);
            if (!hasSeenSubscription) {
              navigate("/subscription");
              sessionStorage.setItem(`seen_subscription_${piUser.username}`, "true");
            }
          }
        }
        setHasCheckedSubscription(true);
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasCheckedSubscription(true);
      }
    };

    checkSubscription();
  }, [isAuthenticated, piUser, subscriptionLoading, hasCheckedSubscription, navigate, refetchSubscription]);

  // Auto-refresh subscription when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Dashboard gained focus, checking subscription...');
      refetchSubscription();
      // Also check if there's a pending activation flag
      const activatedFlag = sessionStorage.getItem('subscription_activated');
      if (activatedFlag) {
        try {
          const { plan, billing } = JSON.parse(activatedFlag);
          toast.success(`🎉 Plan Activated!`, {
            description: `Your ${plan.charAt(0).toUpperCase() + plan.slice(1)} ${billing === 'yearly' ? 'Annual' : 'Monthly'} plan is now active. Enjoy premium features!`,
            duration: 5000,
          });
          sessionStorage.removeItem('subscription_activated');
        } catch (e) {
          console.warn('Failed to parse activation flag:', e);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchSubscription]);

  const checkAuthAndLoadProfile = useCallback(async () => {
    console.log("🔍 Starting checkAuthAndLoadProfile...");
    try {
      // Check Pi authentication OR Supabase session (for Gmail/email users)
      if (piLoading) {
        console.log("⏳ Pi SDK still loading, waiting...");
        return; // Still loading
      }
      
      console.log("✅ Pi loading complete, proceeding with profile load");
      // Check for Supabase session (Gmail/email users)
      let session = null;
      let supabaseUser = null;
      
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          session = data?.session;
          supabaseUser = session?.user;
        }
      } catch (error) {
        console.error('Failed to get session:', error);
      }
      
      // Determine user identifier
      let userIdentifier: string | null = null;
      let isPiUser = false;
      let isNewUser = false;
      
      if (isAuthenticated && piUser && piUser.username) {
        // Pi Network user
        userIdentifier = piUser.username;
        isPiUser = true;
        setDisplayUsername(piUser.username);
        console.log("Loading profile for Pi user:", piUser.username);
      } else if (supabaseUser && supabaseUser.email) {
        // Gmail/Email user
        userIdentifier = supabaseUser.email.split("@")[0] || supabaseUser.id?.slice(0, 8) || 'user';
        isPiUser = false;
        setDisplayUsername(supabaseUser.email.split("@")[0] || null);
        console.log("Loading profile for email user:", supabaseUser.email);
      } else {
        // No authentication - always redirect to auth
        navigate("/auth");
        return;
      }

      // Try to load from localStorage first
      const storageKey = isPiUser ? `profile_${userIdentifier}` : `profile_email_${supabaseUser?.id}`;
      const storedProfile = localStorage.getItem(storageKey);
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile);
          console.log('📱 Found cached profile in localStorage for:', userIdentifier);
          console.log('ℹ️ NOTE: Cached data may be stale. Using database profile if available.');
          // Don't load from localStorage directly anymore - wait for database
          // setProfile(parsed);
        } catch (e) {
          console.error("Error parsing stored profile:", e);
        }
      }

      // Load profile from database
      let profileData;
      let error;
      
      if (isPiUser && piUser) {
        // Pi user - load by username
        const result = await supabase
          .from("profiles")
          .select("*")
          .eq("username", piUser.username)
          .maybeSingle();
        profileData = result.data;
        error = result.error;
        
        // Check if this is a new Pi user
        if (!profileData && !error) {
          isNewUser = true;
          console.log('New Pi user detected:', piUser.username);
        }
      } else if (supabaseUser) {
        // Email/Gmail user - load by user_id
        const result = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", supabaseUser.id)
          .maybeSingle();
        profileData = result.data;
        error = result.error;
        
        // Check if this is a new email user
        if (!profileData && !error) {
          isNewUser = true;
          console.log('New email user detected:', supabaseUser.email);
        }
      }

      if (error) {
        console.error("Error loading profile:", error);
      }

      if (profileData) {
        console.log("Profile loaded:", profileData.id);
        setProfileId(profileData.id);
        
        // Load products
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .eq("profile_id", profileData.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let socialLinks = profileData.social_links as any;
        
        // Ensure socialLinks is properly initialized - fix for broken social links
        if (!Array.isArray(socialLinks) || socialLinks.length === 0) {
          socialLinks = [
            { type: "dropshare", url: "", icon: "dropshare", followers: 0 },
            { type: "twitter", url: "", icon: "twitter", followers: 0 },
            { type: "instagram", url: "", icon: "instagram", followers: 0 },
            { type: "youtube", url: "", icon: "youtube", followers: 0 },
            { type: "tiktok", url: "", icon: "tiktok", followers: 0 },
            { type: "facebook", url: "", icon: "facebook", followers: 0 },
            { type: "linkedin", url: "", icon: "linkedin", followers: 0 },
            { type: "twitch", url: "", icon: "twitch", followers: 0 },
            { type: "website", url: "", icon: "website", followers: 0 },
          ];
        } else if (Array.isArray(socialLinks)) {
          // Ensure all expected platforms exist in the array
          const expectedTypes = ["dropshare", "twitter", "instagram", "youtube", "tiktok", "facebook", "linkedin", "twitch", "website"];
          const existingTypes = socialLinks.map(l => l.type);
          const missingTypes = expectedTypes.filter(t => !existingTypes.includes(t));
          
          if (missingTypes.length > 0) {
            // Add missing platforms
            missingTypes.forEach(type => {
              socialLinks.push({ type, url: "", icon: type, followers: 0 });
            });
          }
          
          // Ensure each link has an icon property and numeric follower counts
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          socialLinks = socialLinks.map((link: any) => ({
            ...link,
            icon: link.icon || link.type,
            followers: link.followers !== undefined && link.followers !== null
              ? Number(link.followers) || 0
              : undefined
          }));
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const themeSettings = profileData.theme_settings as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalizeSocialFeed = (feed: any): SocialEmbedItem[] => {
          if (!Array.isArray(feed)) return [];
          return feed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((item) => item && (item.url || item.embedHtml || (item as any).embed_html))
            .map((item, idx) => ({
              id: item.id || `feed-${idx}-${Date.now()}`,
              platform: item.platform || item.type || item.source || 'Social',
              url: item.url,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              embedHtml: item.embedHtml || (item as any).embed_html,
              title: item.title || item.caption || item.description,
              pinned: item.pinned ?? true,
              thumbnail: item.thumbnail || item.image,
            }));
        };

        const socialFeedItems = normalizeSocialFeed(
          themeSettings?.socialFeedItems ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (profileData as any)?.social_feed ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (profileData as any)?.pinned_posts
        );
        
        // Load financial data from secure endpoint (optional - won't fail if no session)
        let financialData = {
          pi_wallet_address: "",
          pi_donation_message: "Send me a coffee",
          crypto_wallets: {},
          bank_details: {},
        };
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const piAccessToken = localStorage.getItem("pi_access_token");
          if (session?.access_token || (isPiUser && piUser && piAccessToken)) {
            const headers: Record<string, string> = session?.access_token 
              ? { Authorization: `Bearer ${session.access_token}` }
              : { "X-Pi-Access-Token": piAccessToken as string };

            try {
              const { data: finData, error: finError } = await supabase.functions.invoke("financial-data", {
                method: "GET",
                headers
              });
              
              if (!finError && finData?.data) {
                financialData = finData.data;
              }
            } catch (error) {
              console.warn('Financial data function not available, using profile data fallback');
              financialData = {
                pi_wallet_address: profileData?.pi_wallet_address || '',
                pi_donation_message: profileData?.pi_donation_message || 'Send me a coffee',
                crypto_wallets: {},
                bank_details: {}
              };
            }
          } else {
            // No session or Pi token - load from profiles table directly
            // Note: Financial data is stored in profiles table (pi_wallet_address, bank_details, crypto_wallets)
            // or theme_settings if migrated
            financialData = {
              pi_wallet_address: themeSettings?.piWalletAddress || profileData?.pi_wallet_address || '',
              pi_donation_message: themeSettings?.piDonationMessage || profileData?.pi_donation_message || "Send me a coffee",
              crypto_wallets: profileData?.crypto_wallets || {},
              bank_details: profileData?.bank_details || {},
            };
          }
        } catch (error) {
          console.error("Error loading financial data:", error);
        }
        
        const displayName = isPiUser && piUser?.username ? piUser.username : (supabaseUser?.email?.split("@")[0] || "user");
        
        // Cast profileData to a more specific type to avoid repeated 'as any'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbProfile = profileData as Record<string, any>;
        
        const loadedProfile = {
          id: dbProfile?.id || "",
          username: dbProfile?.username || displayName,
          logo: dbProfile?.logo || "",
          businessName: dbProfile?.business_name || displayName,
          appLink: themeSettings?.appLink || dbProfile?.app_link || "",
          appTitle: themeSettings?.appTitle || dbProfile?.app_title || "",
          appLogo: themeSettings?.appLogo || dbProfile?.app_logo || "",
          appDescription: themeSettings?.appDescription || dbProfile?.app_description || "",
          appLinks: (themeSettings?.appLinks as AppLinkItem[]) || [],
          storeUrl: `@${dbProfile?.username || displayName}`,
          description: dbProfile?.description || "",
          email: themeSettings?.email || dbProfile?.email || supabaseUser?.email || "",
          youtubeVideoUrl: dbProfile?.youtube_video_url || "",
          backgroundMusicUrl: dbProfile?.background_music_url || "",
          customDomain: dbProfile?.custom_domain || "",
          category: dbProfile?.category || "other",
          socialLinks: Array.isArray(socialLinks) && socialLinks.length > 0 ? socialLinks : [
            { type: "dropshare", url: "", icon: "dropshare", followers: 0 },
            { type: "twitter", url: "", icon: "twitter", followers: 0 },
            { type: "instagram", url: "", icon: "instagram", followers: 0 },
            { type: "youtube", url: "", icon: "youtube", followers: 0 },
            { type: "tiktok", url: "", icon: "tiktok", followers: 0 },
            { type: "facebook", url: "", icon: "facebook", followers: 0 },
            { type: "linkedin", url: "", icon: "linkedin", followers: 0 },
            { type: "twitch", url: "", icon: "twitch", followers: 0 },
            { type: "website", url: "", icon: "website", followers: 0 },
          ],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          customLinks: (themeSettings?.customLinks as any) || [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          imageLinkCards: (themeSettings?.imageLinkCards as any) || [],
          socialFeedItems,
          theme: {
            primaryColor: themeSettings?.primaryColor || "#38bdf8",
            backgroundColor: themeSettings?.backgroundColor || "#000000",
            backgroundType: (themeSettings?.backgroundType as 'color' | 'gif' | 'video') || "color",
            backgroundGif: themeSettings?.backgroundGif || "",
            backgroundVideo: themeSettings?.backgroundVideo || "",
            iconStyle: themeSettings?.iconStyle || "rounded",
            buttonStyle: themeSettings?.buttonStyle || "filled",
            glassMode: themeSettings?.glassMode ?? false,
            coverImage: themeSettings?.coverImage || "",
          },
        };
        // Set template from saved data
        setBioTemplate((themeSettings?.bioTemplate as BioTemplate) || DEFAULT_TEMPLATE);
        
        // Create final profile with products and payment links
        const completeProfile: ProfileData = {
          ...loadedProfile,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          products: productsData?.map((p: any) => ({
            id: p.id,
            title: p.title,
            price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
            description: p.description || "",
            fileUrl: p.file_url || "",
          })) || [],
          hasPremium: dbProfile.has_premium || false,
          showShareButton: themeSettings?.showShareButton ?? dbProfile.show_share_button ?? true,
          piWalletAddress: financialData.pi_wallet_address || "",
          piDonationMessage: financialData.pi_donation_message || "Send me a coffee",
          isVerified: dbProfile.is_verified || isVerifiedUser(dbProfile.username),
          isAdmin: dbProfile.is_admin || false,
          // Enhanced payment links loading: try database first, then localStorage
          paymentLinks: (() => {
            // Try to restore from theme_settings first (database)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dbPaymentLinks = (themeSettings as any)?.paymentLinks;
            if (dbPaymentLinks && Array.isArray(dbPaymentLinks)) {
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return dbPaymentLinks.map((link: any) => ({
                  ...link,
                  created: new Date(link.created)
                }));
              } catch (error) {
                console.warn('Error restoring payment links from database:', error);
              }
            }
            // Fallback to localStorage
            return loadPaymentLinks();
          })(),
          imageLinkCards: loadedProfile.imageLinkCards || [],
          socialFeedItems: loadedProfile.socialFeedItems || [],
          customLinks: loadedProfile.customLinks || [],
          theme: loadedProfile.theme || {
            primaryColor: "#38bdf8",
            backgroundColor: "#000000",
            backgroundType: "color",
            backgroundGif: "",
            backgroundVideo: "",
            iconStyle: "rounded",
            buttonStyle: "filled",
            glassMode: false,
            coverImage: "",
          }
        };
        
        setProfile(completeProfile);
        
        // Enhanced debugging for profile data
        console.log("✅ Profile loaded successfully:");
        console.log("- Profile ID:", completeProfile.id);
        console.log("- Username:", completeProfile.username);
        console.log("- Business Name:", completeProfile.businessName);
        console.log("- Description:", completeProfile.description);
        console.log("- Logo:", completeProfile.logo);
        console.log("- Products count:", completeProfile.products?.length || 0);
        console.log("- Custom Links count:", completeProfile.customLinks?.length || 0);
        console.log("- Social Links:", completeProfile.socialLinks);
        console.log("- Theme:", completeProfile.theme);
        
        // Update displayUsername with the actual profile username
        if (loadedProfile.username) {
          setDisplayUsername(loadedProfile.username);
        }
        
        // Welcome back existing users (only on first load of session)
        if (!isNewUser && !sessionStorage.getItem(`welcomed_${profileData.id}`)) {
          toast.success(`👋 Welcome back, ${loadedProfile.businessName}!`);
          sessionStorage.setItem(`welcomed_${profileData.id}`, 'true');
        }
        
          // Save to localStorage with metadata
        try {
          const profileToStore = {
            ...loadedProfile,
            socialLinks: Array.isArray(loadedProfile.socialLinks) ? loadedProfile.socialLinks : [],
            lastSynced: new Date().toISOString(),
            profileId: profileData.id
          };
          const storageKey = isPiUser ? `profile_${userIdentifier}` : `profile_email_${supabaseUser?.id}`;
          localStorage.setItem(storageKey, JSON.stringify(profileToStore));
          localStorage.setItem(`${storageKey}_backup`, JSON.stringify(profileToStore));
        } catch (e) {
          console.error("Error saving to localStorage:", e);
        }
      } else {
        // Auto-create profile for Pi user or email user
        const defaultName = isPiUser && piUser ? piUser.username : (supabaseUser?.email?.split("@")[0] || "user");
        console.log("Profile not found, auto-creating with name:", defaultName);
        
        // Create profile in database first (MANDATORY - not optional)
        let newProfileId = null;
        let profileCreateSuccess = false;
        
        // Resolve referral code if present
        let referredBy = null;
        let referralCodeId = null;
        let referredByUsername = null;
        let referredByCode = null;
        const savedRefCode = localStorage.getItem("referral_code");
        if (savedRefCode) {
          try {
            console.log("Resolving referral code:", savedRefCode);
            const { data: refData } = await supabase
              .from("referral_codes")
              .select("profile_id, uses_count, max_uses, id")
              .eq("code", savedRefCode)
              .maybeSingle();

            if (refData && (!refData.max_uses || refData.uses_count < refData.max_uses)) {
              referredBy = refData.profile_id;
              referralCodeId = refData.id;
              referredByCode = savedRefCode;
              console.log("Referral code valid, referred by:", referredBy);
            } else {
              const { data: profileRef } = await supabase
                .from("profiles")
                .select("id, username")
                .eq("username", savedRefCode)
                .maybeSingle();
              if (profileRef?.id) {
                referredBy = profileRef.id;
                referredByUsername = profileRef.username;
                referredByCode = savedRefCode;
                console.log("Referral username valid, referred by:", referredBy);
              }
            }
          } catch (e) {
            console.error("Error resolving referral code:", e);
          }
        }

        try {
          if (isPiUser && piUser) {
            console.log('🗄️ Creating Pi user profile in Supabase...');
            // Upsert Pi user profile to avoid UNIQUE_VIOLATION
            if (!piUser.username) {
              toast.error('Pi username missing. Cannot create profile.');
              throw new Error('Pi username missing');
            }
            // First check if profile exists
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("id, username")
              .eq("username", piUser.username)
              .maybeSingle();
            
            let newProfile;
            let createError;
            
            if (existingProfile) {
              // Profile exists, just load it
              newProfile = existingProfile;
              console.log("✅ Found existing Pi user profile:", existingProfile.id);
            } else {
              // Create new profile
              const result = await supabase
                .from("profiles")
                .insert({
                  username: piUser.username,
                  business_name: piUser.username,
                  description: "",
                  email: "",
                  pi_user_id: piUser.uid,
                  user_id: session?.user?.id || null,
                  social_links: [],
                  social_feed: [],
                  theme_settings: {},
                  referred_by: referredBy,
                  referred_by_code_id: referralCodeId,
                  referred_by_username: referredByUsername,
                  referred_by_code: referredByCode,
                })
                .select()
                .single();
              
              newProfile = result.data;
              createError = result.error;
            }
            if (createError) {
              console.error("❌ Error creating Pi user profile:", createError);
              if (createError.message?.includes('permission denied') || createError.message?.includes('row level security')) {
                toast.error('Supabase permissions error. Please check RLS policies and API key permissions.');
              } else if (createError.message?.includes('does not exist') || createError.message?.includes('column')) {
                toast.error('Supabase schema error. Please check that the profiles table and all columns exist.');
              } else if (createError.code === '23505' || createError.message?.includes('duplicate key')) {
                toast.error('Username already exists. Please use a unique username.');
              } else {
                toast.error('Failed to create Pi profile. Please try again.');
              }
              throw new Error(`Failed to create Pi profile: ${createError.message}`);
            } else if (newProfile) {
              newProfileId = newProfile.id;
              profileCreateSuccess = true;
              setProfileId(newProfileId);
              console.log("✅ Created Pi user profile in Supabase:", newProfileId);
            } else {
              throw new Error('Profile creation returned no data');
            }
          } else if (supabaseUser) {
            console.log('🗄️ Creating email user profile in Supabase...');
            // Create email user profile
            const emailUsername = supabaseUser.email?.split("@")[0] || `user-${supabaseUser.id.slice(0, 8)}`;
            const sanitizedUsername = emailUsername.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            if (!sanitizedUsername) {
              toast.error('Email username missing. Cannot create profile.');
              throw new Error('Email username missing');
            }
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
                .insert({
                  user_id: supabaseUser.id,
                  username: sanitizedUsername,
                  business_name: sanitizedUsername,
                  description: "",
                  email: supabaseUser.email || "",
                  referred_by: referredBy,
                  referred_by_code_id: referralCodeId,
                  referred_by_username: referredByUsername,
                  referred_by_code: referredByCode,
                })
                .select()
                .single();
            if (createError) {
              console.error("❌ Error creating email user profile:", createError);
              if (createError.message?.includes('permission denied') || createError.message?.includes('row level security')) {
                toast.error('Supabase permissions error. Please check RLS policies and API key permissions.');
              } else if (createError.message?.includes('does not exist') || createError.message?.includes('column')) {
                toast.error('Supabase schema error. Please check that the profiles table and all columns exist.');
              } else if (createError.code === '23505' || createError.message?.includes('duplicate key')) {
                toast.error('Username already exists. Please use a unique username.');
                // Username conflict, try with a random suffix
                const randomSuffix = Math.random().toString(36).substring(2, 8);
                const uniqueUsername = `${sanitizedUsername}-${randomSuffix}`;
                console.log('Trying unique username:', uniqueUsername);
                const { data: retryProfile, error: retryError } = await supabase
                  .from("profiles")
                  .insert({
                    user_id: supabaseUser.id,
                    username: uniqueUsername,
                    business_name: sanitizedUsername,
                    description: "",
                    email: supabaseUser.email || "",
                    referred_by: referredBy,
                    referred_by_code_id: referralCodeId,
                    referred_by_username: referredByUsername,
                    referred_by_code: referredByCode,
                  })
                  .select()
                  .single();
                if (retryError) {
                  console.error("❌ Retry also failed:", retryError);
                  toast.error('Failed to create profile with unique username. Please try again.');
                  throw new Error(`Failed to create profile with unique username: ${retryError.message}`);
                } else if (retryProfile) {
                  newProfileId = retryProfile.id;
                  profileCreateSuccess = true;
                  setProfileId(newProfileId);
                  console.log("✅ Created email user profile with unique username:", newProfileId);
                } else {
                  throw new Error('Profile creation returned no data');
                }
              } else {
                toast.error('Failed to create email profile. Please try again.');
                throw new Error(`Failed to create email profile: ${createError.message}`);
              }
            } else if (newProfile) {
              newProfileId = newProfile.id;
              profileCreateSuccess = true;
              setProfileId(newProfileId);
              console.log("✅ Created email user profile:", newProfileId);
            } else {
              throw new Error('Profile creation returned no data');
            }
          }
        } catch (dbError) {
          console.error("Database profile creation failed:", dbError);
          // Show user-friendly error message
          if (dbError.message?.includes('table') || dbError.message?.includes('relation') || dbError.message?.includes('does not exist')) {
            toast.error('⚠️ Database setup required. Check console for setup instructions.');
            console.log(`
🗄️ DATABASE SETUP REQUIRED:
            
1. Go to Supabase Dashboard: https://app.supabase.com/
2. Select project: idkjfuctyukspexmijvb  
3. Go to SQL Editor
4. Run the complete schema from: supabase/migrations/20251118000001_complete_database_schema.sql
   
   OR run this minimal SQL:
   
   CREATE TABLE IF NOT EXISTS public.profiles (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
       username TEXT UNIQUE NOT NULL,
       pi_user_id TEXT,
       business_name TEXT DEFAULT '',
       email TEXT DEFAULT '',
       description TEXT DEFAULT '',
       has_premium BOOLEAN DEFAULT false,
       pi_wallet_address TEXT DEFAULT '',
       referred_by UUID REFERENCES public.profiles(id)
   );
   
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Public access" ON public.profiles FOR ALL USING (true);
   GRANT ALL ON public.profiles TO anon, authenticated;

5. Refresh the app after running the SQL.
            `);
          } else if (dbError.code === '23505') {
            toast.error('Username already taken. Please try a different one.');
          } else {
            toast.error('Failed to create profile. Please try again.');
          }
          
          // Don't block the app, continue with local profile
          console.log('Continuing with local-only profile due to database error');
        }

        // Update referral stats if profile created successfully
        if (profileCreateSuccess && referralCodeId) {
          try {
            console.log("Updating referral stats for code:", referralCodeId);
            await supabase.rpc('increment_referral_uses', { code_id: referralCodeId });
            localStorage.removeItem("referral_code");
          } catch (e) {
            console.error("Error updating referral stats:", e);
          }
        }

        // Track affiliate invite (pending) on signup
        if (profileCreateSuccess && newProfileId && referredBy) {
          try {
            await supabase
              .from("affiliate_invites")
              .insert({
                referral_code_id: referralCodeId,
                referrer_profile_id: referredBy,
                referred_profile_id: newProfileId,
                referred_username: defaultName || null,
                plan_type: "free",
                reward_pi: 0,
                status: "pending"
              });
          } catch (e) {
            console.warn("Affiliate invite insert failed:", e);
          }
        }
        
        const defaultProfile = {
          id: newProfileId || "",
          username: defaultName || "",
          logo: "",
          businessName: defaultName,
          appLink: "",
          appTitle: "",
          appLogo: "",
          appDescription: "",
          appLinks: [],
          storeUrl: defaultName ? `@${defaultName}` : "your-link",
          description: "",
          email: supabaseUser?.email || "",
          youtubeVideoUrl: "",
          backgroundMusicUrl: "",
          socialLinks: [
            { type: "dropshare", url: "" },
            { type: "twitter", url: "" },
            { type: "instagram", url: "" },
            { type: "youtube", url: "" },
            { type: "tiktok", url: "" },
            { type: "facebook", url: "" },
            { type: "linkedin", url: "" },
            { type: "twitch", url: "" },
            { type: "website", url: "" },
          ],
          customLinks: [],
          theme: {
            primaryColor: "#38bdf8",
            backgroundColor: "#000000",
            backgroundType: "color" as const,
            backgroundGif: "",
            iconStyle: "rounded",
            buttonStyle: "filled",
          },
          products: [],
          wallets: {
            crypto: [],
            bank: [],
          },
          hasPremium: false,
          showShareButton: true,
          piWalletAddress: "",
          piDonationMessage: "Send me a coffee",
        };
        setProfile(defaultProfile);
        
        // ONLY save to localStorage if database creation was successful
        if (profileCreateSuccess && newProfileId) {
          try {
            const profileToStore = {
              ...defaultProfile,
              lastSynced: new Date().toISOString(),
              profileId: newProfileId // Use the actual database profile ID
            };
            const storageKey = isPiUser ? `profile_${userIdentifier}` : `profile_email_${supabaseUser?.id}`;
            localStorage.setItem(storageKey, JSON.stringify(profileToStore));
            localStorage.setItem(`${storageKey}_backup`, JSON.stringify(profileToStore));
            console.log('✅ Profile backed up to localStorage');
          } catch (e) {
            console.error("Error saving to localStorage:", e);
          }
        } else {
          console.warn('⚠️ Skipping localStorage save - database creation failed');
        }
        
        if (newProfileId && isNewUser) {
          // Only show welcome message for genuinely new users with successful DB creation
          toast.success(`🎉 Welcome to Droplink, ${defaultName}! Your store is ready!`);
          // Show onboarding message
          setTimeout(() => {
            toast.info('💡 Tip: Customize your profile, add links, and share your unique URL!');
          }, 2000);
        } else if (newProfileId && !isNewUser) {
          console.log('Profile restored for returning user');
          toast.success(`Welcome back, ${defaultName}! 👋`);
        } else if (!profileCreateSuccess) {
          // Database creation failed
          console.error('❌ Failed to create profile in Supabase database');
          toast.error('⚠️ Failed to save profile to database', {
            description: 'Your profile was NOT saved. Check your internet connection and try again.',
            duration: 10000
          });
        } else {
          console.log('Using local profile data only (not in database)');
          toast.warning('⚠️ Using local profile only', {
            description: 'Your profile is not saved to the database. Refresh to sync.',
            duration: 10000
          });
        }
      }
    } catch (error) {
      console.error("❌ Critical error in checkAuthAndLoadProfile:", error);
      
      // Show user-friendly error
      toast.error('Failed to load profile', {
        description: 'There was an error loading your profile. Using fallback data.',
        duration: 5000
      });
      
      // Set default profile to avoid broken state
      const fallbackUsername = piUser?.username || 'user';
      const fallbackProfile: ProfileData = {
        id: "",
        username: fallbackUsername,
        logo: "",
        businessName: fallbackUsername,
        storeUrl: `@${fallbackUsername}`,
        description: "",
        email: "",
        youtubeVideoUrl: "",
        backgroundMusicUrl: "",
        socialLinks: [
          { type: "dropshare", url: "", icon: "dropshare", followers: 0 },
          { type: "twitter", url: "", icon: "twitter", followers: 0 },
          { type: "instagram", url: "", icon: "instagram", followers: 0 },
          { type: "youtube", url: "", icon: "youtube", followers: 0 },
          { type: "tiktok", url: "", icon: "tiktok", followers: 0 },
          { type: "facebook", url: "", icon: "facebook", followers: 0 },
          { type: "linkedin", url: "", icon: "linkedin", followers: 0 },
          { type: "twitch", url: "", icon: "twitch", followers: 0 },
          { type: "website", url: "", icon: "website", followers: 0 },
        ],
        customLinks: [],
        theme: {
          primaryColor: "#38bdf8",
          backgroundColor: "#000000",
          backgroundType: "color",
          backgroundGif: "",
          backgroundVideo: "",
          iconStyle: "rounded",
          buttonStyle: "filled",
          glassMode: false,
          coverImage: "",
        },
        products: [],
        imageLinkCards: [],
        socialFeedItems: [],
        paymentLinks: [],
        hasPremium: false,
        showShareButton: true,
        piWalletAddress: "",
        piDonationMessage: "Send me a coffee",
        isVerified: false,
      };
      
      setProfile(fallbackProfile);
      setDisplayUsername(fallbackUsername);
    } finally {
      setLoading(false);
      console.log("✅ Dashboard loading complete (loading state set to false)");
    }
  }, [piLoading, isAuthenticated, piUser, navigate, loadPaymentLinks]);

  useEffect(() => {
    // Wait for Pi context to be ready
    if (!piLoading) {
      checkAuthAndLoadProfile();
    }
  }, [piLoading, checkAuthAndLoadProfile]);

  // Inbox + followers badge counts
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let followerChannel: ReturnType<typeof supabase.channel> | null = null;

    const loadUnreadCount = async () => {
      if (!profileId) {
        setInboxUnreadCount(0);
        return;
      }
      const { count } = await supabase
        .from('messages' as any)
        .select('id', { count: 'exact', head: true })
        .eq('receiver_profile_id', profileId)
        .eq('is_read', false)
        .is('group_id', null);
      setInboxUnreadCount(count || 0);
    };

    const loadFollowerCount = async () => {
      if (!profileId) {
        setFollowerBadge(0);
        return;
      }
      const { count } = await supabase
        .from('followers' as any)
        .select('id', { count: 'exact', head: true })
        .eq('following_profile_id', profileId);
      const total = count || 0;
      const storageKey = `followers_seen_count_${profileId}`;
      const lastSeen = Number(localStorage.getItem(storageKey) || '0');
      if (!lastSeen) {
        localStorage.setItem(storageKey, String(total));
        setFollowerBadge(0);
        return;
      }
      const delta = Math.max(total - lastSeen, 0);
      setFollowerBadge(delta);
    };

    if (profileId) {
      loadUnreadCount();
      loadFollowerCount();
      channel = supabase
        .channel(`dashboard-inbox-${profileId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_profile_id=eq.${profileId}` },
          () => {
            loadUnreadCount();
            toast.success('New message received');
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_profile_id=eq.${profileId}` },
          loadUnreadCount
        )
        .subscribe();

      followerChannel = supabase
        .channel(`dashboard-followers-${profileId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'followers', filter: `following_profile_id=eq.${profileId}` },
          () => {
            loadFollowerCount();
            toast.success('New follower!');
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (followerChannel) supabase.removeChannel(followerChannel);
    };
  }, [profileId]);

  // Helper to count active social links
  const countActiveSocialLinks = () => {
    return profile.socialLinks.filter(link => link.url && link.url.trim() !== "").length;
  };

  // Helper to check if plan limit exceeded
  const canAddSocialLink = (currentActiveCount: number) => {
    // Pro (and Premium) plans: unlimited social links
    if (plan === "premium" || plan === "pro") return true;
    const maxLinks = plan === "basic" ? 3 : 1; // free: 1, basic: 3
    return currentActiveCount < maxLinks;
  };

  // Handle social link change - allows editing, respects plan limits
  const handleSocialLinkChange = (platform: string, value: string) => {
    const trimmedValue = value.trim();
    const currentLink = profile.socialLinks.find(l => l.type === platform);
    const isCurrentlyActive = currentLink?.url && currentLink.url.trim() !== "";
    
    // If trying to add a new link (field is currently empty and trying to fill it with a value)
    if (!isCurrentlyActive && trimmedValue !== "") {
      const currentActive = profile.socialLinks.filter(l => l.url && l.url.trim() !== "").length;
      if (!canAddSocialLink(currentActive)) {
        const limitLabel = plan === "basic" ? "3" : "1";
        toast.error(`You have reached your plan's social link limit (${limitLabel} links). Upgrade to Pro for unlimited links.`);
        return;
      }
    }
    
    // Update the link (either editing existing or adding new)
    const updatedProfile = {
      ...profile,
      socialLinks: profile.socialLinks.map(link =>
        link.type === platform ? { ...link, url: value } : link
      ),
    };
    
    setProfile(updatedProfile);
    
    // Trigger immediate save after social link change
    console.log('[SOCIAL LINKS] Updating platform:', platform, 'Value:', value);
    console.log('[SOCIAL LINKS] Updated profile:', updatedProfile);
    saveProfileNow(updatedProfile);
  };

  const parseFollowerInput = (raw: string) => {
    const value = raw.trim().toLowerCase();
    if (!value) return undefined;
    const multiplier = value.endsWith("m") ? 1_000_000 : value.endsWith("k") ? 1_000 : 1;
    const numericPortion = value.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(numericPortion || "0") * multiplier;
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;
    return Math.floor(parsed);
  };

  const handleSocialFollowerChange = (platform: string, value: string, index?: number) => {
    const followers = parseFollowerInput(value);
    const updatedProfile = {
      ...profile,
      socialLinks: profile.socialLinks.map((link, idx) =>
        index !== undefined
          ? (idx === index ? { ...link, followers } : link)
          : (link.type === platform ? { ...link, followers } : link)
      ),
    };
    setProfile(updatedProfile);
    saveProfileNow(updatedProfile);
  };

  // Cancel current plan and fall back to free tier
  const handleCancelPlan = async () => {
    if (!effectiveProfileId) {
      toast.error('Profile not loaded yet. Please try again.');
      return;
    }

    // Confirm with user before canceling
    const confirmed = window.confirm(
      '⚠️ WARNING: Canceling your plan will:\n\n' +
      '• Delete ALL subscriptions (regular & gift card plans)\n' +
      '• Remove ALL gift cards (purchased & redeemed)\n' +
      '• Delete subscription transaction history\n' +
      '• Reset your account to FREE tier\n' +
      '• Remove premium features immediately\n\n' +
      'After cancellation, you can subscribe to a new plan anytime.\n\n' +
      'This action CANNOT be undone. Are you sure you want to continue?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelingPlan(true);
      const nowIso = new Date().toISOString();

      // Delete all subscriptions for this profile (includes all types: regular, gift, etc.)
      const { error: subDeleteError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('profile_id', effectiveProfileId);

      if (subDeleteError) {
        console.error('Error deleting subscriptions:', subDeleteError);
        throw new Error('Failed to delete subscriptions');
      }

      // Delete subscription transaction history
      const { error: transDeleteError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('subscription_transactions' as any)
        .delete()
        .eq('profile_id', effectiveProfileId);

      if (transDeleteError) {
        console.error('Error deleting subscription transactions:', transDeleteError);
        // Don't throw - this is not critical
      }

      // Delete ALL gift cards (purchased by or redeemed by this user)
      const { error: giftDeleteError } = await supabase
        .from('gift_cards')
        .delete()
        .or(`purchased_by_profile_id.eq.${effectiveProfileId},redeemed_by_profile_id.eq.${effectiveProfileId}`);

      if (giftDeleteError) {
        console.error('Error deleting gift cards:', giftDeleteError);
        // Don't throw - continue with profile reset
      }

      // Reset profile to free tier - allows user to subscribe again
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ 
          has_premium: false
        })
        .eq('id', effectiveProfileId);

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError);
        throw new Error('Failed to reset profile to free tier');
      }

      await refetchSubscription?.();
      toast.success('Plan canceled. All subscriptions, gift cards, and transaction history have been deleted. You can now subscribe to a new plan.');
      setShowPlanModal(false);
    } catch (error) {
      console.error('Cancel plan failed', error);
      toast.error('Unable to cancel the plan right now. Please try again.');
    } finally {
      setCancelingPlan(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAppLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newProfile = { ...profile, appLogo: reader.result as string };
        setProfile(newProfile);
        saveProfileNow(newProfile);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateAppLinks = (nextLinks: AppLinkItem[]) => {
    const newProfile = { ...profile, appLinks: nextLinks };
    setProfile(newProfile);
    saveProfileNow(newProfile);
  };

  const handleAddAppLink = () => {
    updateAppLinks([
      ...(profile.appLinks || []),
      { id: crypto.randomUUID(), title: "", url: "", description: "", logo: "" }
    ]);
  };

  const handleUpdateAppLink = (id: string, patch: Partial<AppLinkItem>) => {
    updateAppLinks(
      (profile.appLinks || []).map((link) =>
        link.id === id ? { ...link, ...patch } : link
      )
    );
  };

  const handleRemoveAppLink = (id: string) => {
    updateAppLinks((profile.appLinks || []).filter((link) => link.id !== id));
  };

  const handleAppLinkLogoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdateAppLink(id, { logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, theme: { ...profile.theme, coverImage: reader.result as string } });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file (MP4/WebM).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Video must be under 20MB.");
      return;
    }
    try {
      const fileExt = file.name.split(".").pop() || "mp4";
      const filePath = `user-videos/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error } = await supabase.storage.from("media").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        toast.error(`Failed to upload video: ${error.message}`);
        return;
      }
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl || "";
      if (!publicUrl) {
        toast.error("Failed to get public video URL.");
        return;
      }
      setProfile({
        ...profile,
        theme: {
          ...profile.theme,
          backgroundVideo: publicUrl,
          backgroundType: "video",
          backgroundGif: "",
        },
      });
      toast.success("Background video uploaded.");
    } catch (error) {
      console.error("Background video upload error:", error);
      toast.error("Failed to upload background video.");
    } finally {
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!profileId) {
        console.error('[Dashboard] No profile ID found');
        throw new Error('No profile ID found. Please sign in again.');
      }
      
      console.log('[Dashboard] Saving profile, ID:', profileId);
      
      // Update main profile data in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          business_name: profile.businessName,
          description: profile.description,
          youtube_video_url: profile.youtubeVideoUrl,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          social_links: profile.socialLinks as any,
          theme_settings: {
            ...profile.theme,
            customLinks: profile.customLinks || [],
            imageLinkCards: profile.imageLinkCards || [],
            appLinks: profile.appLinks || [],
            storeUrl: profile.storeUrl,
            appDescription: profile.appDescription,
            email: profile.email,
            backgroundMusicUrl: profile.backgroundMusicUrl,
            isVerified: profile.isVerified,
            appLink: profile.appLink,
            appTitle: profile.appTitle,
            appLogo: profile.appLogo,
            customDomain: profile.customDomain,
            category: profile.category,
            paymentLinks: (profile.paymentLinks || []).map(link => ({
              id: link.id,
              amount: link.amount,
              description: link.description,
              type: link.type,
              url: link.url,
              created: link.created instanceof Date ? link.created.toISOString() : link.created,
              active: link.active,
              totalReceived: link.totalReceived,
              transactionCount: link.transactionCount
            }))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
          logo: profile.logo,
          show_share_button: profile.showShareButton,
          pi_wallet_address: profile.piWalletAddress,
          pi_donation_message: profile.piDonationMessage,
          has_premium: profile.hasPremium || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);
        
      if (profileError) {
        console.error('[Dashboard] Profile update error:', profileError);
        throw profileError;
      }

      console.log('[Dashboard] Profile updated successfully');

      // Sync products to database
      if (profile.products && profile.products.length > 0) {
        console.log('[Dashboard] Syncing products:', profile.products.length);
        await supabase
          .from('products')
          .delete()
          .eq('profile_id', profileId);
        const productsToInsert = profile.products.map(product => ({
          profile_id: profileId,
          title: product.title,
          description: product.description,
          price: typeof product.price === 'string' ? product.price : product.price?.toString?.() ?? "",
          file_url: product.fileUrl
        }));
        if (productsToInsert.length > 0) {
          const { error: productsError } = await supabase
            .from('products')
            .insert(productsToInsert);
          if (productsError) {
            console.error('[Dashboard] Products sync error:', productsError);
          }
        }
      }

      toast.success('Changes saved successfully!');
      
      // Force reload of profile from database after save
      if (profileId) {
        try {
          const { data: refreshedProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", profileId)
            .maybeSingle();
          if (refreshedProfile) {
            setProfile((prev) => ({
              ...prev,
              piWalletAddress: refreshedProfile.pi_wallet_address || "",
              piDonationMessage: refreshedProfile.pi_donation_message || "Send me a coffee",
            }));
          }
        } catch (e) {
          // Ignore reload errors
        }
      }
    } catch (error) {
      console.error('[Dashboard] Save failed:', error);
      const err = error as { message?: string; details?: string; hint?: string };
      const errorMessage = err?.message || err?.details || err?.hint || 'Unknown error';
      toast.error(`Failed to save: ${errorMessage}`, { duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  const getWindowOrigin = () => {
    if (typeof window === "undefined" || !window.location) return "";
    return window.location.origin;
  };

  const getPublicSlugs = () => {
    const normalize = (value: string) =>
      (value || "")
        .replace(/^\/+/, "")
        .replace(/^@+/, "")
        .trim();

    const usernameSlug = normalize(profile.username || displayUsername || "your-link");
    const profileSlug = `@${normalize(profile.storeUrl || usernameSlug) || usernameSlug}`;
    const feedSlug = `${profileSlug}/feed`;
    return { usernameSlug, profileSlug, feedSlug };
  };

  const handleCopyLink = () => {
    const { profileSlug } = getPublicSlugs();
    const origin = getWindowOrigin();
    const link = origin ? `${origin}/${profileSlug}` : `/${profileSlug}`;
    navigator.clipboard.writeText(link);
    toast.success("Public link copied! Ready to share.");
  };

  const handleOpenPublicBio = () => {
    const { profileSlug } = getPublicSlugs();
    const origin = getWindowOrigin();
    if (!origin) return;
    const link = `${origin}/${profileSlug}`;
    window.open(link, "_blank");
  };

  const handleOpenPublicFeed = () => {
    const { feedSlug } = getPublicSlugs();
    const origin = getWindowOrigin();
    if (!origin) return;
    const link = `${origin}/${feedSlug}`;
    window.open(link, "_blank");
  };

  const handleShowQRCode = () => {
    // Allow QR code dialog to open even if profile is not set up
    if (!profile || !profile.storeUrl) {
      toast.error("No store URL set yet. Set up your profile to get a store link.");
      return;
    }
    setShowQRCode(true);
  };

  const handleLogout = async () => {
    try {
      console.log("🚪 Initiating logout...");
      // Use comprehensive sign-out utility, but allow logout even if profile is not set up
      await performCompleteSignOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always navigate to auth page, even if error or no profile
      window.location.href = "/auth";
    }
  };

  // Show welcome modal only on first visit per session
  useEffect(() => {
    if (!sessionStorage.getItem('droplink-welcome-shown')) {
      setShowWelcomeModal(true);
      sessionStorage.setItem('droplink-welcome-shown', '1');
    }
  }, []);



  // Pi authentication is optional - dashboard now accessible without Pi Browser
  // Users can still connect Pi later if needed

  // Removed Pi Authentication Required modal to allow dashboard access without blocking

  // Smoothly focus the builder section and optionally activate a tab by value
  const focusTab = (tabValue: string) => {
    console.log(`[Footer Nav] Attempting to focus tab: ${tabValue}`);
    const normalized = tabAliases[tabValue] ?? tabValue;
    if (routeTabs.has(normalized)) {
      beginPageSwitch(normalized);
    }
    
    // Give DOM time to settle
    setTimeout(() => {
      if (routeTabs.has(normalized)) {
        setActiveTab(normalized);
        navigate(`/dashboard/${normalized}`);
      } else {
        console.log(`[Footer Nav] Tab not found for value: ${tabValue}`);
      }

      setTimeout(() => {
        const builder = document.getElementById('dashboard-builder');
        if (builder) {
          console.log(`[Footer Nav] Scrolling to builder section`);
          builder.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }, 150);
  };

  const handlePageSwitch = (tabValue: string) => {
    if (isMobile) {
      setShowPreview(false);
    }
    beginPageSwitch(tabValue);
    setShowPageSwitcher(false);
    focusTab(tabValue);
  };

  const loadConversations = async () => {
    if (!profileId) return;
    setLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from('messages' as any)
        .select('id, sender_profile_id, receiver_profile_id, content, created_at')
        .or(`sender_profile_id.eq.${profileId},receiver_profile_id.eq.${profileId}`)
        .is('group_id', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const map = new Map<string, { otherUserId: string; lastMessage: string; createdAt: string }>();
      for (const msg of data || []) {
        const otherUserId = msg.sender_profile_id === profileId ? msg.receiver_profile_id : msg.sender_profile_id;
        if (!otherUserId || map.has(otherUserId)) continue;
        map.set(otherUserId, {
          otherUserId,
          lastMessage: msg.content || 'Sent an image',
          createdAt: msg.created_at,
        });
      }
      const ids = Array.from(map.keys());
      if (ids.length === 0) {
        setConversations([]);
        return;
      }
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, logo')
        .in('id', ids);
      const profileMap = new Map<string, { username: string; logo?: string | null }>();
      (profiles || []).forEach((p: any) => profileMap.set(p.id, { username: p.username, logo: p.logo }));
      const list = Array.from(map.values()).map((item) => ({
        otherUserId: item.otherUserId,
        username: profileMap.get(item.otherUserId)?.username || 'Anonymous',
        logo: profileMap.get(item.otherUserId)?.logo || null,
        lastMessage: item.lastMessage,
        createdAt: item.createdAt,
      }));
      setConversations(list);
    } catch (error) {
      console.error('[Dashboard] Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleInboxClick = () => {
    setShowInboxPreview(true);
    loadConversations();
  };

  const handleFollowersClick = () => {
    if (profileId) {
      const storageKey = `followers_seen_count_${profileId}`;
      const current = Number(localStorage.getItem(storageKey) || '0') + followerBadge;
      localStorage.setItem(storageKey, String(current));
      setFollowerBadge(0);
    }
    navigate('/followers');
  };

  const droplinkTutorialSteps = [
    {
      title: "Set up your profile",
      detail: "Open the Profile tab and add your name, bio, logo, and primary link so visitors know who you are.",
    },
    {
      title: "Create your first Droplink button",
      detail: "In Custom Links, click the Add Custom Link button, then enter a title, URL, and choose a category.",
    },
    {
      title: "Organize and style links",
      detail: "Reorder links, toggle visibility, choose a display style, and pick a layout like Stack or Grid.",
    },
    {
      title: "Customize your page design",
      detail: "Go to Design to adjust colors, backgrounds, fonts, and templates for your public page.",
    },
    {
      title: "Enable monetization (optional)",
      detail: "Use Monetize to add products, tips, and DropPay options for payments and sales.",
    },
    {
      title: "Preview, publish, and share",
      detail: "Use Preview to check your page, then copy your link or QR code to share everywhere.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-sky-400 text-slate-900 overflow-x-hidden pb-24">
      <div className="pointer-events-none absolute inset-0 opacity-0" aria-hidden="true" style={{ background: "none" }} />

      <header className="sticky top-0 z-30 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/85 dark:bg-slate-900/85 backdrop-blur">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="https://i.ibb.co/wrCQpZk9/Gemini-Generated-Image-ar8t52ar8t52ar8t.png" 
              alt="Droplink" 
              className="h-10 w-10 rounded-xl shadow-sm object-contain"
            />
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Droplink</span>
              <span className="text-sm font-semibold">
                {displayUsername ? `@${displayUsername}` : 'Dashboard'}
              </span>
            </div>
            {!isAuthenticated && piLoading && (
              <span className="text-xs text-amber-600 animate-pulse">Connecting Pi...</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={handleShowQRCode}>
              <QrCode className="w-4 h-4 mr-2" />
              QR
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleCopyLink}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="hidden lg:inline-flex"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showPreview ? 'Hide preview' : 'Show preview'}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="bg-sky-500 hover:bg-sky-600 text-white"
              onClick={() => setShowPlanModal(true)}
            >
              <Crown className="w-4 h-4 mr-2" />
              Plan
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={handleLogout} className="text-slate-600 dark:text-slate-300">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10 space-y-4 sm:space-y-6">
        {/* Subscription Status Banner */}
        <SubscriptionBanner />
        
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-[2fr_1fr] items-start">
          <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/70 shadow-sm p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col gap-3 lg:gap-4">
              <div className="flex items-start justify-between gap-2 lg:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Welcome back</p>
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white leading-tight">
                    {greeting || 'Hello'}, {displayUsername || 'creator'}
                  </h2>
                </div>
                <Button variant="ghost" size="sm" className="px-2" onClick={() => navigate('/card-generator')} title="Card Generator">
                  <CreditCard className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Manage your link-in-bio page with Droplink builder.</p>
            </div>
            {displayUsername && (
              <div className="mt-3 space-y-2">
                <div className="rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-slate-800/70 bg-slate-50/80 dark:bg-slate-900/60 p-2.5 sm:p-3">
                  <p className="text-xs text-slate-500 mb-1.5">Profile URL</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-medium truncate">{getWindowOrigin()}/{getPublicSlugs().profileSlug}</span>
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleOpenPublicBio} title="View">
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCopyLink} title="Copy">
                        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/70 bg-slate-50/80 dark:bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-500">Feed URL</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-sm font-medium truncate">{getWindowOrigin()}/{getPublicSlugs().feedSlug}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          const origin = getWindowOrigin();
                          if (!origin) return;
                          const feedUrl = `${origin}/${getPublicSlugs().feedSlug}`;
                          window.open(feedUrl, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Feed
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          const origin = getWindowOrigin();
                          if (!origin) return;
                          const feedUrl = `${origin}/${getPublicSlugs().feedSlug}`;
                          navigator.clipboard.writeText(feedUrl);
                          toast.success('Feed URL copied!');
                        }}
                      >
                        <Share2 className="w-4 h-4" />
                        Copy Feed
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/70 bg-slate-50/80 dark:bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-500">Status</p>
                  <div className={`flex items-center gap-2 mt-1 text-sm font-medium ${
                    isPlanExpired 
                      ? 'text-red-600 dark:text-red-400' 
                      : plan === 'free' 
                        ? 'text-slate-600 dark:text-slate-300'
                        : 'text-emerald-600 dark:text-emerald-300'
                  }`}>
                    {isPlanExpired ? (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        Expired - was {plan.toUpperCase()}
                      </>
                    ) : (
                      <>
                        {plan === 'free' ? <Lock className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                        <div className="flex flex-col">
                          <span className="leading-none">{plan.charAt(0).toUpperCase() + plan.slice(1)} plan</span>
                          {expiresAt && !isPlanExpired && (
                            <span className="text-[10px] text-muted-foreground font-normal mt-0.5">
                              Exp: {new Date(expiresAt).toLocaleDateString()} ({Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d)
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {(isPlanExpired || plan === 'free') && (
                    <Button 
                      size="sm" 
                      variant="link" 
                      className="p-0 h-auto text-xs text-sky-600 dark:text-sky-400 mt-1"
                      onClick={() => navigate('/subscription')}
                    >
                      {isPlanExpired ? 'Renew now →' : 'Upgrade →'}
                    </Button>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/70 bg-slate-50/80 dark:bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-500">Preview</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowPreview((prev) => !prev)}
                    >
                      {showPreview ? 'Hide preview' : 'Show preview'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)] items-start min-w-0">
          {/* Builder Panel */}
          <section
            id="dashboard-builder"
            className={`${showPreview ? 'hidden lg:block' : 'block'} w-full min-w-0 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800/70 bg-white/95 dark:bg-slate-900/70 shadow-sm`}
          >
            <div className="p-3 sm:p-5 lg:p-6">
              <Tabs 
                value={activeTab}
                className="w-full"
                onValueChange={(value) => {
                  beginPageSwitch(value);
                  setActiveTab(value);
                  if (routeTabs.has(value)) {
                    navigate(`/dashboard/${value}`);
                  }
                  if (value === 'payments' && piUser?.uid) {
                    const paymentLinks = loadPaymentLinks();
                    setProfile(prev => ({
                      ...prev,
                      paymentLinks
                    }));
                  }
                }}
              >
                {/* Quick Actions */}
                <div className="mb-4 sm:mb-6 lg:mb-8 p-3 sm:p-4 lg:p-5 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 rounded-2xl border border-sky-200/60 dark:border-sky-800/60 shadow-md">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
                    <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Most used tools</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    <button 
                      onClick={() => {
                        const profileTab = document.querySelector('[data-tab="profile"]') as HTMLElement;
                        profileTab?.click();
                        setTimeout(() => {
                          document.getElementById('dashboard-builder')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <User className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight">Profile</span>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Business details</span>
                    </button>
                    <button 
                      onClick={() => setShowPageSwitcher(true)}
                      className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                        <Menu className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight">Pages</span>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Switch section</span>
                    </button>
                    <button 
                      onClick={handleShowQRCode}
                      className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <QrCode className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight">QR Code</span>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Scan to visit</span>
                    </button>
                    <button 
                      onClick={handleCopyLink}
                      className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Share2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight">Share</span>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Copy link</span>
                    </button>
                    <button
                      onClick={() => setShowDroplinkTutorialModal(true)}
                      className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                        <Info className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight">Tutorial</span>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">How to use</span>
                    </button>
                    {(isInstallable || isInstalled) && (
                      <button
                        onClick={promptInstall}
                        className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                      >
                        <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                          <Download className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight">
                          {isInstalled ? 'Installed' : 'Install'}
                        </span>
                        <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Home screen</span>
                      </button>
                    )}
                    <button 
                      onClick={() => navigate('/wallet')}
                      className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Wallet className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight">Wallet</span>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Stickers & Pi</span>
                    </button>
                    <button 
                      onClick={() => navigate('/subscription')}
                      className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-200 group-hover:bg-fuchsia-600 group-hover:text-white transition-colors">
                        <Crown className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight">Upgrade</span>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Unlock tools</span>
                    </button>
                    <button
                      onClick={() => navigate('/affiliate-program')}
                      className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <TrendingUp className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight">Affiliate</span>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Earn rewards</span>
                    </button>
                    <button
                      onClick={() => navigate('/ambassador-program')}
                      className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <Crown className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight">Ambassador</span>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Apply now</span>
                    </button>
                    <button
                      onClick={() => navigate('/moderator-program')}
                      className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Users className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight">Moderator</span>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Apply now</span>
                    </button>
                  </div>
                </div>

                {!hideTabNavigation && (
                  <div className="mb-6 sm:mb-8 lg:mb-10 sm:rounded-2xl sm:border sm:border-slate-200/80 sm:dark:border-slate-800/70 sm:bg-white/95 sm:dark:bg-slate-900/70 sm:shadow-sm p-0 sm:p-4 lg:p-5">
                    <div className="flex items-center justify-between mb-3 sm:mb-4 px-1 sm:px-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Sections</h3>
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Jump to a tab</span>
                    </div>
                    <TabsList className="w-full flex flex-wrap gap-2 sm:gap-4 items-stretch bg-white/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/60 p-2 sm:p-4 rounded-2xl shadow-sm">
                      <TabsTrigger value="profile" data-tab="profile" className="group flex-1 min-w-[125px] sm:min-w-[160px] h-full min-h-[88px] sm:min-h-[104px] flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all data-[state=active]:border-sky-500 data-[state=active]:ring-2 data-[state=active]:ring-sky-400/40">
                        <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                          <User className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight whitespace-nowrap">Profile</span>
                      </TabsTrigger>
                      <TabsTrigger value="design" className="group flex-1 min-w-[125px] sm:min-w-[160px] h-full min-h-[88px] sm:min-h-[104px] flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all data-[state=active]:border-sky-500 data-[state=active]:ring-2 data-[state=active]:ring-sky-400/40">
                        <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                          <Palette className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight whitespace-nowrap">Design</span>
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="group flex-1 min-w-[125px] sm:min-w-[160px] h-full min-h-[88px] sm:min-h-[104px] flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all data-[state=active]:border-sky-500 data-[state=active]:ring-2 data-[state=active]:ring-sky-400/40">
                        <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                          <TrendingUp className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight whitespace-nowrap">Analytics</span>
                      </TabsTrigger>
                      <TabsTrigger value="ad-network" className="group flex-1 min-w-[125px] sm:min-w-[160px] h-full min-h-[88px] sm:min-h-[104px] flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all data-[state=active]:border-sky-500 data-[state=active]:ring-2 data-[state=active]:ring-sky-400/40">
                        <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                          <PlayCircle className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight whitespace-nowrap">Ads</span>
                      </TabsTrigger>
                      <TabsTrigger value="monetization" className="group flex-1 min-w-[125px] sm:min-w-[160px] h-full min-h-[88px] sm:min-h-[104px] flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all data-[state=active]:border-sky-500 data-[state=active]:ring-2 data-[state=active]:ring-sky-400/40">
                        <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                          <Wallet className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight whitespace-nowrap">Monetize</span>
                      </TabsTrigger>
                      <TabsTrigger value="memberships" className="group flex-1 min-w-[125px] sm:min-w-[160px] h-full min-h-[88px] sm:min-h-[104px] flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all data-[state=active]:border-sky-500 data-[state=active]:ring-2 data-[state=active]:ring-sky-400/40">
                        <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                          <Crown className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight whitespace-nowrap">Tiers</span>
                      </TabsTrigger>
                      <TabsTrigger value="subscription" className="group flex-1 min-w-[125px] sm:min-w-[160px] h-full min-h-[88px] sm:min-h-[104px] flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all data-[state=active]:border-sky-500 data-[state=active]:ring-2 data-[state=active]:ring-sky-400/40">
                        <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                          <CreditCard className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight whitespace-nowrap">Sub</span>
                      </TabsTrigger>
                      <TabsTrigger value="preferences" className="group flex-1 min-w-[125px] sm:min-w-[160px] h-full min-h-[88px] sm:min-h-[104px] flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/75 border border-white/70 dark:border-slate-800/70 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all data-[state=active]:border-sky-500 data-[state=active]:ring-2 data-[state=active]:ring-sky-400/40">
                        <span className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                          <Settings className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-center text-slate-900 dark:text-white leading-tight whitespace-nowrap">Settings</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                )}

                {/* Tab Content - Separate Card */}
                <div className="mt-4 sm:mt-6 lg:mt-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/70 bg-white/95 dark:bg-slate-900/70 shadow-sm p-3 sm:p-5 lg:p-6">
                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6 sm:space-y-8 max-w-xl w-full mx-auto px-0">
                {/* Floating Action Bar - Mobile & Tablet */}
                <div className="lg:hidden mb-4 px-0 flex gap-2 justify-end items-center flex-wrap">
                  {/* Save Status Indicator */}
                  {saveStatus !== 'idle' && (
                    <div className={`text-xs font-medium px-3 py-2 rounded-full flex items-center gap-1.5 transition-all duration-300 ${
                      saveStatus === 'saving' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}>
                      {saveStatus === 'saving' ? (
                        <>
                          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Saved</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Save Button */}
                  <button
                    onClick={handleManualSave}
                    disabled={saveStatus === 'saving'}
                    className="inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-medium text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 backdrop-blur-sm border border-emerald-400/50 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="hidden sm:inline">{saveStatus === 'saving' ? 'Saving' : 'Save'}</span>
                    <span className="sm:hidden">{saveStatus === 'saving' ? '...' : 'Save'}</span>
                  </button>
                  
                  {/* Preview Toggle Button */}
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 backdrop-blur-sm border border-sky-400/50"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Hide Preview</span>
                        <span className="sm:hidden">Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Show Preview</span>
                        <span className="sm:hidden">Show</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Pi Ad Banner for free users */}
                <PiAdBanner />
                
                <div>
                  <h2 className="text-lg font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-white">Business details</h2>
              

              {/* Logo Upload, AI Logo, and Random Avatar Generator */}
              <div className="mb-6 flex flex-col gap-4 w-full">
                <div>
                  <Label className="mb-3 block text-sm text-gray-900 dark:text-white">Business logo</Label>
                  <div className="flex flex-col gap-3 sm:gap-4 w-full">
                    <div
                      className={
                        `w-20 h-20 flex-shrink-0 bg-card border border-border flex items-center justify-center overflow-hidden ` +
                        (profile.theme?.iconStyle === 'circle'
                          ? 'rounded-full'
                          : profile.theme?.iconStyle === 'square'
                          ? 'rounded-none'
                          : 'rounded-2xl')
                      }
                    >
                      {profile.logo ? (
                        <img src={profile.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex gap-2 flex-col sm:flex-row w-full">
                        <label htmlFor="logo-upload" className="flex-1">
                          <Button variant="secondary" size="sm" asChild className="w-full">
                            <span>{profile.logo ? "Change" : "Upload"}</span>
                          </Button>
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                        </label>
                        {profile.logo && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setProfile({ ...profile, logo: "" })}
                            className="w-full sm:w-auto"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      {/* AI Logo Generation */}
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 flex-col sm:flex-row w-full">
                          <input
                            type="text"
                            placeholder="Describe your logo..."
                            className="border rounded px-2 py-1.5 text-xs sm:text-sm flex-1 w-full min-w-0"
                            value={aiLogoPrompt || ""}
                            onChange={e => setAiLogoPrompt(e.target.value)}
                            disabled={aiLogoLoading}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!aiLogoPrompt) return;
                              setAiLogoLoading(true);
                              setAiLogoError("");
                              try {
                                const url = buildPollinationsUrl(aiLogoPrompt, 512);
                                const img = new Image();
                                img.crossOrigin = "anonymous";
                                img.onload = () => {
                                  const isValidSize = img.naturalWidth >= 128 && img.naturalHeight >= 128;
                                  if (!isValidSize) {
                                    setAiLogoError("Logo image was too small. Try a different prompt.");
                                    setAiLogoLoading(false);
                                    return;
                                  }
                                  setProfile(prev => ({ ...prev, logo: url }));
                                  setAiLogoLoading(false);
                                };
                                img.onerror = () => {
                                  setAiLogoError("Failed to generate image. Try a different prompt.");
                                  setAiLogoLoading(false);
                                };
                                img.src = url;
                              } catch (e) {
                                setAiLogoError("Error generating image");
                                setAiLogoLoading(false);
                              }
                            }}
                            disabled={aiLogoLoading || !aiLogoPrompt}
                            className="w-full sm:w-auto sm:min-w-[80px]"
                          >
                            {aiLogoLoading ? "Generating..." : "AI"}
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">Generate a logo using AI</div>
                      </div>
                      {/* Logo Style Selector */}
                      <div className="flex gap-2 items-center flex-col sm:flex-row w-full">
                        <Label htmlFor="logo-style" className="text-xs whitespace-nowrap self-start sm:self-center">Logo style:</Label>
                        <select
                          id="logo-style"
                          value={profile.theme?.iconStyle || 'rounded'}
                          onChange={e => setProfile({
                            ...profile,
                            theme: {
                              ...profile.theme,
                              iconStyle: e.target.value as 'rounded' | 'square' | 'circle',
                            },
                          })}
                          className="border rounded px-2 py-1 text-xs flex-1 w-full sm:w-auto"
                        >
                          <option value="rounded">Rounded</option>
                          <option value="square">Square</option>
                          <option value="circle">Circle</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Random Avatar Generator */}
                <div>
                  <Label className="mb-2 block text-sm text-gray-900 dark:text-white">Or generate a random avatar</Label>
                  <RandomAvatarGenerator onAvatarGenerated={(url) => setProfile(prev => ({ ...prev, logo: url }))} />
                </div>
              </div>


              {/* Business Name */}
              <div className="mb-6">
                <Label htmlFor="business-name" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">Business name</Label>
                <Input
                  id="business-name"
                  value={profile.businessName}
                  onChange={(e) => {
                    const newProfile = { ...profile, businessName: e.target.value };
                    setProfile(newProfile);
                    // Save business name immediately
                    saveProfileNow(newProfile);
                  }}
                  placeholder="Enter business name"
                  className="bg-input-bg text-sm"
                />
              </div>

              {/* Email */}
              <div className="mb-6">
                <Label htmlFor="email" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ""}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="your@email.com"
                  className="bg-input-bg text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Your email will be used to save preferences and for important notifications
                </p>
              </div>

              {/* Store URL */}
              <div className="mb-6">
                <Label htmlFor="store-url" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">Store URL (Username)</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 w-full overflow-hidden">
                    <span className="text-muted-foreground text-xs whitespace-nowrap flex-shrink-0 hidden sm:inline">{getWindowOrigin()}/</span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap flex-shrink-0 sm:hidden">URL:</span>
                    <Input
                      id="store-url"
                      value={profile.storeUrl}
                      onChange={(e) => setProfile({ ...profile, storeUrl: e.target.value })}
                      placeholder="your-store-name"
                      className="bg-input-bg flex-1 text-sm min-w-0"
                    />
                  </div>
                  {profile.username && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg">
                      <span className="text-xs text-sky-700 dark:text-sky-300 font-medium">@{profile.username}</span>
                      <span className="text-xs text-sky-600 dark:text-sky-400">← Your public bio username</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  This will be your public store URL that you can share
                </p>
              </div>

              {/* Description */}
              <div className="mb-6">
                <Label htmlFor="description" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">Business description</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => {
                    const newProfile = { ...profile, description: e.target.value };
                    setProfile(newProfile);
                    // Save description immediately
                    saveProfileNow(newProfile);
                  }}
                  placeholder="Tell people about your business..."
                  className="bg-input-bg min-h-[100px] sm:min-h-[120px] resize-none text-sm"
                  maxLength={400}
                />
                <div className="text-xs text-muted-foreground text-right mt-1.5">
                  {profile.description.length} / 400
                </div>
              </div>

              <PlanGate minPlan="basic" featureName="App Link">
                <div className="mb-6 border-t border-border pt-6 mt-6">
                  <h3 className="text-lg font-medium mb-4">App Details</h3>
                  
                  <div className="mb-4">
                    <Label htmlFor="app-title" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">App Title</Label>
                    <Input
                      id="app-title"
                      value={profile.appTitle || ""}
                      onChange={(e) => {
                        const newProfile = { ...profile, appTitle: e.target.value };
                        setProfile(newProfile);
                        saveProfileNow(newProfile);
                      }}
                      placeholder="Enter app title"
                      className="bg-input-bg text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="app-link" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">App Link</Label>
                    <Input
                      id="app-link"
                      value={profile.appLink || ""}
                      onChange={(e) => {
                        const newProfile = { ...profile, appLink: e.target.value };
                        setProfile(newProfile);
                        saveProfileNow(newProfile);
                      }}
                      placeholder="https://..."
                      className="bg-input-bg text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="app-description" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">App Description</Label>
                    <Textarea
                      id="app-description"
                      value={profile.appDescription || ""}
                      onChange={(e) => {
                        const newProfile = { ...profile, appDescription: e.target.value };
                        setProfile(newProfile);
                        saveProfileNow(newProfile);
                      }}
                      placeholder="Describe your app..."
                      className="bg-input-bg min-h-[90px] sm:min-h-[110px] resize-none text-sm"
                      maxLength={180}
                    />
                    <div className="text-xs text-muted-foreground text-right mt-1.5">
                      {(profile.appDescription || "").length} / 180
                    </div>
                  </div>

                  <div className="mb-4">
                    <Label htmlFor="app-logo" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">App Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                        {profile.appLogo ? (
                          <img src={profile.appLogo} alt="App Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-muted-foreground">No Logo</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          id="app-logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAppLogoUpload}
                          className="bg-input-bg text-sm cursor-pointer file:cursor-pointer file:text-sky-600 file:border-0 file:bg-transparent file:font-medium"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Upload a logo for your app (recommended size: 256x256px)
                        </p>
                      </div>
                    </div>
                  </div>

                  <PlanGate minPlan="pro" featureName="Unlimited App Links">
                    <div className="mb-4 border-t border-border pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm text-gray-900 dark:text-white">App Links</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddAppLink}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add App Link
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {(profile.appLinks || []).map((link: AppLinkItem) => (
                          <div key={link.id} className="border border-border rounded-lg p-4 bg-card">
                            <div className="flex items-start gap-4">
                              <div className="relative w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                {link.logo ? (
                                  <img src={link.logo} alt={link.title || "App"} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs text-muted-foreground">No Logo</span>
                                )}
                              </div>
                              <div className="flex-1 space-y-3">
                                <Input
                                  value={link.title || ""}
                                  onChange={(e) => handleUpdateAppLink(link.id, { title: e.target.value })}
                                  placeholder="App title"
                                  className="bg-input-bg text-sm"
                                />
                                <Input
                                  value={link.url || ""}
                                  onChange={(e) => handleUpdateAppLink(link.id, { url: e.target.value })}
                                  placeholder="https://..."
                                  className="bg-input-bg text-sm"
                                />
                                <Textarea
                                  value={link.description || ""}
                                  onChange={(e) => handleUpdateAppLink(link.id, { description: e.target.value })}
                                  placeholder="Short description"
                                  className="bg-input-bg min-h-[80px] resize-none text-sm"
                                  maxLength={180}
                                />
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleAppLinkLogoUpload(link.id, e)}
                                  className="bg-input-bg text-sm cursor-pointer file:cursor-pointer file:text-sky-600 file:border-0 file:bg-transparent file:font-medium"
                                />
                              </div>
                              <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveAppLink(link.id)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PlanGate>
                </div>
              </PlanGate>

              {/* User Category */}
              <div className="mb-6">
                <Label htmlFor="category" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">Profile Category</Label>
                <select
                  id="category"
                  value={profile.category || 'other'}
                  onChange={async (e) => {
                    const newCategory = e.target.value;
                    const newProfile = { ...profile, category: newCategory };
                    setProfile(newProfile);
                    
                    if (profileId) {
                      await saveProfileNow(newProfile);
                    }
                  }}
                  className="w-full h-10 sm:h-11 px-3 rounded-lg bg-input-bg border border-border text-sm"
                >
                  <option value="content_creator">🎥 Content Creator</option>
                  <option value="business">💼 Business</option>
                  <option value="gamer">🎮 Gamer</option>
                  <option value="developer">💻 Developer</option>
                  <option value="artist">🎨 Artist</option>
                  <option value="musician">🎵 Musician</option>
                  <option value="educator">📚 Educator</option>
                  <option value="influencer">⭐ Influencer</option>
                  <option value="entrepreneur">🚀 Entrepreneur</option>
                  <option value="other">📋 Other</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Choose what best describes you to help others find your profile in search
                </p>
              </div>

              {/* YouTube Video URL - Premium/Pro only */}
              <PlanGate minPlan="premium" featureName="YouTube Video">
                <div className="mb-6">
                  <Label htmlFor="youtube-video" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">YouTube Video</Label>
                  <Input
                    id="youtube-video"
                    value={profile.youtubeVideoUrl}
                    onChange={(e) => setProfile({ ...profile, youtubeVideoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    className="bg-input-bg text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Add a YouTube video to showcase your business or products
                  </p>
                </div>
              </PlanGate>

              {/* Background Music URL */}
              <PlanGate minPlan="premium" featureName="Background Music">
                <div className="mb-6">
                  <Label htmlFor="background-music" className="mb-2 sm:mb-3 block flex items-center gap-2 text-sm">
                    <Music className="w-4 h-4" />
                    Background Music
                  </Label>
                  <Input
                    id="background-music"
                    value={profile.backgroundMusicUrl || ""}
                    onChange={(e) => setProfile({ ...profile, backgroundMusicUrl: e.target.value })}
                    placeholder="https://example.com/music.mp3 or Spotify/YouTube link"
                    className="bg-input-bg text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Add a background music URL (MP3, Spotify, YouTube) that will play on your public bio page. The audio will loop continuously and visitors can control playback.
                  </p>
                </div>
              </PlanGate>

              {/* Public Bio Cover */}
              <div className="mb-6">
                <Label className="mb-2 sm:mb-3 block flex items-center gap-2 text-sm">
                  <Image className="w-4 h-4" />
                  Public Bio Cover
                </Label>
                <div className="flex items-start gap-4">
                  <div className="w-36 h-24 rounded-xl overflow-hidden border border-border bg-card flex items-center justify-center">
                    {profile.theme.coverImage ? (
                      <img src={profile.theme.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground text-center px-2">1200x600 recommended</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label htmlFor="cover-upload">
                        <Button variant="secondary" size="sm" asChild className="w-full sm:w-auto">
                          <span>{profile.theme.coverImage ? "Change" : "Upload"}</span>
                        </Button>
                        <input
                          id="cover-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverUpload}
                        />
                      </label>
                      {profile.theme.coverImage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProfile({ ...profile, theme: { ...profile.theme, coverImage: "" } })}
                          className="w-full sm:w-auto"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <Input
                      value={profile.theme.coverImage || ""}
                      onChange={(e) => setProfile({ ...profile, theme: { ...profile.theme, coverImage: e.target.value } })}
                      placeholder="https://your-cover-image.com/cover.jpg"
                      className="bg-input-bg text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Shown at the top of your public bio for a link.me-style cover.
                    </p>
                  </div>
                </div>
              </div>

              {/* Background Video (MP4) */}
              <PlanGate minPlan="premium" featureName="Background Video">
                <div className="mb-6">
                  <Label className="mb-2 sm:mb-3 block flex items-center gap-2 text-sm">
                    <PlayCircle className="w-4 h-4" />
                    Background Video (MP4)
                  </Label>
                  <div className="flex items-start gap-4">
                    <div className="w-36 h-24 rounded-xl overflow-hidden border border-border bg-card flex items-center justify-center">
                      {profile.theme.backgroundVideo ? (
                        <video
                          src={profile.theme.backgroundVideo}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground text-center px-2">MP4/WebM up to 20MB</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <label htmlFor="background-video-upload">
                          <Button variant="secondary" size="sm" asChild className="w-full sm:w-auto">
                            <span>{profile.theme.backgroundVideo ? "Change" : "Upload"}</span>
                          </Button>
                          <input
                            id="background-video-upload"
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={handleBackgroundVideoUpload}
                          />
                        </label>
                        {profile.theme.backgroundVideo && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setProfile({
                                ...profile,
                                theme: { ...profile.theme, backgroundVideo: "", backgroundType: "color" },
                              })
                            }
                            className="w-full sm:w-auto"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <Input
                        value={profile.theme.backgroundVideo || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            theme: { ...profile.theme, backgroundVideo: e.target.value, backgroundType: "video", backgroundGif: "" },
                          })
                        }
                        placeholder="https://your-video.com/background.mp4"
                        className="bg-input-bg text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Video plays as your background on public bio and feed. Audio can be muted/unmuted by visitors.
                      </p>
                    </div>
                  </div>
                </div>
              </PlanGate>

              {/* Verified Badge (30 Pi) */}
              <div className="mb-6 p-4 border border-blue-200 dark:border-blue-800 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30">
                <div className="flex items-start gap-3">
                  <img 
                    src={getVerifiedBadgeUrl(profile?.username)} 
                    alt="Verified badge" 
                    className="w-8 h-8 flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-sm font-semibold">Get Verified - Blue Badge</Label>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">30 Pi</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Get a <strong className="text-blue-600">blue verified badge</strong> next to your name and stand out as a trusted creator. VIP members receive exclusive gold badges automatically.
                    </p>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={profile.isVerified || false}
                        onCheckedChange={(checked) => setProfile({ ...profile, isVerified: checked })}
                        disabled={!profile.isVerified}
                      />
                      <span className="text-xs text-muted-foreground">
                        {profile.isVerified ? "Verified ✓" : "Not verified · Pay 30 Pi for blue badge"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links - New Comprehensive Manager */}
            <div>
              <SocialMediaManager 
                socialLinks={profile.socialLinks || []}
                onChange={(links) => setProfile({ ...profile, socialLinks: links })}
                maxLinks={(() => {
                  if (plan === "basic") return 3;
                  if (plan === "premium" || plan === "pro") return undefined; // unlimited
                  return 1; // free plan
                })()}
              />
            </div>

            {/* Social Feed / Pinned Embeds */}
            <PlanGate minPlan="basic" featureName="Social Feed Pins">
              <div className="border-t pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Feed Pins</h2>
                      <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200 px-2 py-0.5 text-[11px] font-medium border border-sky-200/70 dark:border-sky-800/70">
                        Plan: Basic+
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Pin social embeds or links that will show on your public bio feed and profile feed.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      const newItem: SocialEmbedItem = {
                        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `feed-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                        platform: '',
                        title: '',
                        url: '',
                        embedHtml: '',
                        pinned: true,
                      };
                      setProfile({ ...profile, socialFeedItems: [...(profile.socialFeedItems || []), newItem] });
                    }}>
                      + Add Pin
                    </Button>
                    <Button size="sm" variant="outline" onClick={autoSave.save} disabled={autoSave.isSaving}>
                      {autoSave.isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>

                {(profile.socialFeedItems || []).length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-4 text-sm text-muted-foreground bg-card/30">
                    No pins yet. Add a social URL or paste embed HTML to feature it on your public feed.
                  </div>
                )}

                <div className="space-y-3">
                  {(profile.socialFeedItems || []).map((item) => (
                    <Card key={item.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Pinned Item</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Pinned</span>
                          <Switch
                            checked={item.pinned !== false}
                            onCheckedChange={(checked) => {
                              setProfile({
                                ...profile,
                                socialFeedItems: (profile.socialFeedItems || []).map((feed) => feed.id === item.id ? { ...feed, pinned: checked } : feed)
                              });
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setProfile({
                              ...profile,
                              socialFeedItems: (profile.socialFeedItems || []).filter((feed) => feed.id !== item.id)
                            })}
                            className="text-xs text-red-500"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Platform / Label</Label>
                          <Input
                            value={item.platform || ''}
                            onChange={(e) => setProfile({
                              ...profile,
                              socialFeedItems: (profile.socialFeedItems || []).map((feed) => feed.id === item.id ? { ...feed, platform: e.target.value } : feed)
                            })}
                            placeholder="Instagram, X, Blog, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={item.title || ''}
                            onChange={(e) => setProfile({
                              ...profile,
                              socialFeedItems: (profile.socialFeedItems || []).map((feed) => feed.id === item.id ? { ...feed, title: e.target.value } : feed)
                            })}
                            placeholder="Pinned post title"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Social URL (optional if using embed HTML)</Label>
                          <Input
                            value={item.url || ''}
                            onChange={(e) => setProfile({
                              ...profile,
                              socialFeedItems: (profile.socialFeedItems || []).map((feed) => feed.id === item.id ? { ...feed, url: e.target.value } : feed)
                            })}
                            placeholder="https://social.com/post/123"
                          />
                        </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Thumbnail (optional)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={item.thumbnail || ''}
                            onChange={(e) => setProfile({
                              ...profile,
                              socialFeedItems: (profile.socialFeedItems || []).map((feed) => feed.id === item.id ? { ...feed, thumbnail: e.target.value } : feed)
                            })}
                            placeholder="https://image.jpg or uploaded image URL"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="whitespace-nowrap"
                            onClick={async () => {
                              try {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                input.onchange = async (event: any) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;
                                  const url = await uploadMessageImage(file);
                                  if (!url) {
                                    toast.error('Failed to upload image. Please try again.');
                                    return;
                                  }
                                  setProfile((current) => ({
                                    ...current,
                                    socialFeedItems: (current.socialFeedItems || []).map((feed) =>
                                      feed.id === item.id ? { ...feed, thumbnail: url } : feed
                                    ),
                                  }));
                                  toast.success('Thumbnail uploaded');
                                };
                                input.click();
                              } catch (error) {
                                console.error('Thumbnail upload failed:', error);
                                toast.error('Thumbnail upload failed');
                              }
                            }}
                          >
                            Upload
                          </Button>
                        </div>
                      </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Embed HTML (paste from Instagram/Twitter/YouTube, etc.)</Label>
                        <Textarea
                          value={item.embedHtml || ''}
                          onChange={(e) => setProfile({
                            ...profile,
                            socialFeedItems: (profile.socialFeedItems || []).map((feed) => feed.id === item.id ? { ...feed, embedHtml: e.target.value } : feed)
                          })}
                          placeholder="&lt;blockquote class='instagram-media' ...&gt;&lt;/blockquote&gt;"
                          className="min-h-[120px]"
                        />
                        <p className="text-xs text-muted-foreground">If embed HTML is provided, it will be used over the URL.</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </PlanGate>

            {/* Pi Wallet Address for Tips & Payments + Pi Tip/Send Me a Coffee */}
            {/* Pi Wallet for Tips - Basic and above only, auto-lock if expired */}
            <PlanGate minPlan="basic" featureName="Pi Wallet for Tips">
              {isAuthenticated && !isPlanExpired && (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg mb-4">
                    <div className="space-y-0.5">
                      <label htmlFor="show-pi-wallet-tips" className="text-base font-medium">
                        Show Pi Wallet for Tips
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Allow visitors to see your Pi wallet tip QR and message on your public profile
                      </p>
                    </div>
                    <Switch
                      id="show-pi-wallet-tips"
                      checked={profile.showPiWalletTips !== false}
                      onCheckedChange={(checked) => setProfile({ ...profile, showPiWalletTips: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                        <Wallet className="w-5 h-5 text-blue-500" />
                        Pi Wallet for Tips
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200 px-2 py-0.5 text-[11px] font-medium border border-sky-200/70 dark:border-sky-800/70">
                        Plan: Basic+
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground bg-blue-50 px-2 py-1 rounded">
                      Pi Network
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex flex-col gap-6">
                        <div className="flex-1">
                          <h3 className="font-medium text-blue-900 mb-1 text-sm sm:text-base">Receive DROP or Pi Tips</h3>
                          <div className="flex flex-col gap-2 mb-3">
                            <Input
                              value={profile.piDonationMessage || ''}
                              onChange={(e) => setProfile({ ...profile, piDonationMessage: e.target.value })}
                              placeholder="Send me a coffee"
                              className="bg-background border-primary text-xs font-mono w-full"
                              maxLength={64}
                            />
                            <span className="text-xs text-muted-foreground">Custom message</span>
                          </div>
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2">
                              <Input
                                value={profile.piWalletAddress || ''}
                                onChange={(e) => setProfile({ ...profile, piWalletAddress: e.target.value })}
                                placeholder="G... (Pi Network wallet address)"
                                className="bg-background border-primary text-xs font-mono flex-1 w-full"
                                maxLength={56}
                              />
                              {profile.piWalletAddress && (
                                <div className="flex gap-1 w-full sm:w-auto">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(profile.piWalletAddress!);
                                      toast.success('Wallet address copied!');
                                    }}
                                    className="text-xs border-blue-300 flex-1 sm:flex-initial"
                                  >
                                    Copy
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowPiWalletQR(true)}
                                    className="text-xs border-blue-300 flex-1 sm:flex-initial"
                                  >
                                    QR
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 w-full">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (getCurrentWalletAddress) {
                                    const walletAddr = getCurrentWalletAddress();
                                    if (walletAddr) {
                                      setProfile({ ...profile, piWalletAddress: walletAddr });
                                      toast.success('Wallet address imported from Pi Network!');
                                    } else {
                                      toast.error('No Pi wallet found. Please authenticate or import a wallet first.');
                                    }
                                  } else {
                                    toast.error('Please go to the Wallet section to set up your Pi Network wallet first.');
                                  }
                                }}
                                className="text-xs border-blue-300 flex-1"
                              >
                                <Wallet className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Import from Wallet</span>
                                <span className="sm:hidden">Import</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                          <div className="font-semibold text-blue-900 mb-1 text-sm">Tip / Send a Coffee</div>
                          {profile.piWalletAddress ? (
                            <>
                              <div className="relative mx-auto">
                                <svg width="140" height="140" className="rounded border border-blue-300 bg-white sm:w-40 sm:h-40">
                                  <foreignObject width="140" height="140">
                                    <div style={{ width: '140px', height: '140px', position: 'relative' }}>
                                      <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(profile.piWalletAddress)}`}
                                        alt="Wallet QR Code"
                                        style={{ width: 140, height: 140, borderRadius: 8, background: '#fff' }}
                                      />
                                      <img
                                        src="/droplink-logo.png"
                                        alt="Droplink Logo"
                                        style={{ position: 'absolute', left: '50%', top: '50%', width: 40, height: 40, transform: 'translate(-50%, -50%)', borderRadius: 10, border: '2px solid #fff', background: '#fff', boxShadow: '0 2px 8px #0001' }}
                                      />
                                    </div>
                                  </foreignObject>
                                </svg>
                              </div>
                              <div className="text-xs text-blue-700 break-all text-center mt-1">
                                <span>Scan to tip Pi</span>
                              </div>
                              <div className="text-xs text-blue-700 break-all text-center mt-1 font-mono">
                                <span>{profile.piWalletAddress.substring(0, 6)}...{profile.piWalletAddress.substring(-4)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-xs text-blue-400 text-center">Enter your wallet address to generate a QR code</div>
                          )}
                          {profile.piWalletQrUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(profile.piWalletQrUrl!);
                                toast.success('QR code image URL copied!');
                              }}
                            >
                              Copy QR URL
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </PlanGate>

            {/* Custom Links - Premium/Pro only */}
            <PlanGate minPlan="premium" featureName="Custom Links">
              <div className="border-t pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Links</h2>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {autoSave.isSaving && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Saving...</span>
                    )}
                    {autoSave.lastSaved && !autoSave.isSaving && (
                      <span className="text-xs text-green-600 whitespace-nowrap">Saved</span>
                    )}
                    <Button size="sm" variant="outline" onClick={autoSave.save} disabled={autoSave.isSaving} className="text-xs">
                      {autoSave.isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
                <LinkManager
                  customLinks={profile.customLinks || []}
                  shortenedLinks={profile.shortenedLinks || []}
                  onCustomLinksChange={(links) => setProfile({ ...profile, customLinks: links })}
                  onShortenedLinksChange={(links) => setProfile({ ...profile, shortenedLinks: links })}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  layoutType={profile.linkLayoutType as any || 'stack'}
                  onLayoutChange={(layout) => setProfile({ ...profile, linkLayoutType: layout })}
                />
              </div>
            </PlanGate>

            {/* Donation Wallets section removed */}

            {/* Pi Network Wallet section removed */}

            {/* Share Button Settings */}
            <div className="border-t pt-4 sm:pt-6">
              <h2 className="text-lg font-semibold mb-3 sm:mb-6 text-gray-900 dark:text-white">Public Profile Settings</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-card border border-border rounded-lg gap-3">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="share-button" className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                    Show Share Button
                  </Label>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Allow visitors to share your profile with a button
                  </p>
                </div>
                <Switch
                  id="share-button"
                  checked={profile.showShareButton}
                  onCheckedChange={(checked) => setProfile({ ...profile, showShareButton: checked })}
                />
              </div>
            </div>

            {/* Theme Customization - Premium/Pro only */}
            <PlanGate minPlan="premium" featureName="Theme Customization">
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-white">Theme Customization</h2>
                
                {/* Quick Template Picker */}
                <div className="mb-6">
                  <Label className="mb-3 block text-sm text-gray-900 dark:text-white">Quick Templates (Droplink-style)</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {[
                      { id: 'midnight', name: 'Midnight', primary: '#3b82f6', bg: '#0f0f23' },
                      { id: 'sunset', name: 'Sunset', primary: '#ff6b6b', bg: '#2d1b1b' },
                      { id: 'forest', name: 'Forest', primary: '#22c55e', bg: '#0a1f0a' },
                      { id: 'minimal', name: 'Minimal', primary: '#111827', bg: '#ffffff' },
                      { id: 'neon', name: 'Neon', primary: '#a855f7', bg: '#0f0f0f' },
                      { id: 'ocean', name: 'Ocean', primary: '#3b82f6', bg: '#0c1929' },
                      { id: 'rose', name: 'Rose', primary: '#be7c4d', bg: '#1a1412' },
                      { id: 'arctic', name: 'Arctic', primary: '#0ea5e9', bg: '#0c1929' },
                    ].map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          const newProfile = {
                            ...profile,
                            theme: {
                              ...profile.theme,
                              primaryColor: template.primary,
                              backgroundColor: template.bg,
                            }
                          };
                          setProfile(newProfile);
                          saveProfileNow(newProfile);
                          toast.success(`Applied ${template.name} template!`);
                        }}
                        className="aspect-square rounded-lg border-2 border-border hover:border-primary transition-all hover:scale-105 overflow-hidden"
                        title={template.name}
                      >
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: template.bg }}
                        >
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: template.primary }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Click a template to apply its colors instantly</p>
                </div>
                
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="primary-color" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">Primary Color</Label>
                  <Input
                    id="primary-color"
                    type="color"
                    value={profile.theme.primaryColor}
                    onChange={(e) => {
                      const newProfile = {
                        ...profile,
                        theme: { ...profile.theme, primaryColor: e.target.value }
                      };
                      setProfile(newProfile);
                      // Save theme changes immediately
                      saveProfileNow(newProfile);
                    }}
                    className="h-11 sm:h-12 w-full rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="background-color" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">Background Color</Label>
                  <Input
                    id="background-color"
                    type="color"
                    value={profile.theme.backgroundColor}
                    onChange={(e) => setProfile({
                      ...profile,
                      theme: { ...profile.theme, backgroundColor: e.target.value }
                    })}
                    className="h-11 sm:h-12 w-full rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="text-color" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">Text Color</Label>
                  <Input
                    id="text-color"
                    type="color"
                    value={profile.theme.textColor || '#ffffff'}
                    onChange={(e) => setProfile({
                      ...profile,
                      theme: { ...profile.theme, textColor: e.target.value }
                    })}
                    className="h-11 sm:h-12 w-full rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="icon-style" className="mb-2 sm:mb-3 block text-sm text-gray-900 dark:text-white">Icon Style</Label>
                  <select
                    id="icon-style"
                    value={profile.theme.iconStyle}
                    onChange={(e) => setProfile({
                      ...profile,
                      theme: { ...profile.theme, iconStyle: e.target.value }
                    })}
                    className="w-full h-10 sm:h-11 px-3 rounded-lg bg-input-bg border border-border text-sm"
                  >
                    <option value="rounded">Rounded</option>
                    <option value="square">Square</option>
                    <option value="circle">Circle</option>
                  </select>
                </div>

                {/* Live preview for text visibility */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg border" style={{
                  background: profile.theme.backgroundColor,
                  color: profile.theme.textColor || '#ffffff',
                  borderColor: profile.theme.primaryColor
                }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>Text Preview: Always Visible</span>
                  <p style={{ marginTop: 8, fontSize: '0.875rem' }}>This is a preview of your text color on your selected background. Make sure it is always readable!</p>
                </div>
              </div>
              </div>
            </PlanGate>

            {/* Digital Products - Premium/Pro only */}
            <PlanGate minPlan="premium" featureName="Digital Products">
              <div>
                <h2 className="text-lg font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-white">Digital Products</h2>
              <div className="space-y-3 sm:space-y-4">
                {profile.products.map((product, index) => (
                  <div key={product.id} className="p-3 sm:p-4 bg-card border border-border rounded-lg space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-sm sm:text-base">Product {index + 1}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newProducts = profile.products.filter(p => p.id !== product.id);
                          setProfile({ ...profile, products: newProducts });
                        }}
                        className="text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      placeholder="Product Title"
                      value={product.title}
                      onChange={(e) => {
                        const newProducts = [...profile.products];
                        newProducts[index].title = e.target.value;
                        setProfile({ ...profile, products: newProducts });
                      }}
                      className="bg-input-bg text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <Input
                        placeholder="Price (e.g., $9.99)"
                        value={product.price?.toString() ?? ""}
                        onChange={(e) => {
                          const newProducts = [...profile.products];
                          newProducts[index].price = e.target.value;
                          setProfile({ ...profile, products: newProducts });
                        }}
                        className="bg-input-bg text-sm"
                      />
                      <Input
                        placeholder="Category"
                        className="bg-input-bg text-sm"
                      />
                    </div>
                    <Textarea
                      placeholder="Product Description"
                      value={product.description}
                      onChange={(e) => {
                        const newProducts = [...profile.products];
                        newProducts[index].description = e.target.value;
                        setProfile({ ...profile, products: newProducts });
                      }}
                      className="bg-input-bg min-h-[70px] sm:min-h-[80px] resize-none text-sm"
                    />
                    <Input
                      placeholder="File/Download URL"
                      value={product.fileUrl}
                      onChange={(e) => {
                        const newProducts = [...profile.products];
                        newProducts[index].fileUrl = e.target.value;
                        setProfile({ ...profile, products: newProducts });
                      }}
                      className="bg-input-bg text-sm"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={() => {
                    const newProduct = {
                      id: Date.now().toString(),
                      title: "",
                      price: "",
                      description: "",
                      fileUrl: "",
                    };
                    setProfile({ ...profile, products: [...profile.products, newProduct] });
                  }}
                >
                  + Add Product
                </Button>
              </div>
              </div>
            </PlanGate>

                {/* Action Buttons */}
                <Card
                  className="sticky bottom-0 z-[100] w-full p-0 m-0 border border-white/50 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-[0_12px_40px_-16px_rgba(0,0,0,0.35)] rounded-2xl"
                >
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 border-t border-white/40 dark:border-slate-800/80 w-full p-2 sm:p-3 m-0">
                    <Button
                      className="flex-1 h-11 sm:h-12 rounded-xl bg-white/70 dark:bg-slate-900/70 text-sky-500 font-medium border border-sky-200/70 hover:bg-white/90 dark:hover:bg-slate-900"
                      onClick={() => {
                        toast.info('No changes were saved.');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      className="flex-1 h-11 sm:h-12 bg-sky-400/90 hover:bg-sky-500 text-white font-semibold rounded-xl border border-sky-300/60 shadow-[0_8px_20px_-10px_rgba(56,189,248,0.9)]"
                      style={{ transition: 'box-shadow 0.2s' }}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Design Tab - Premium/Pro only */}
              <TabsContent value="design" className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
                <PlanGate minPlan="premium" featureName="GIF Background (Premium)">
                  {!isPlanExpired && (
                    <>
                      <DesignCustomizer 
                        theme={profile.theme}
                        onThemeChange={(newTheme) => setProfile({ ...profile, theme: newTheme })}
                      />
                      {/* Save Button */}
                      <div className={`flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 sm:pt-6 pb-6 sm:pb-8 border-t border-white/40 dark:border-slate-800/80 sticky bottom-0 z-[100] w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-[0_12px_40px_-16px_rgba(0,0,0,0.35)] rounded-2xl`}>
                        <Button variant="outline" className="flex-1 h-11 sm:h-12 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-sky-200/70 hover:bg-white/90 dark:hover:bg-slate-900 text-sky-500">
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSave} 
                          className="flex-1 h-11 sm:h-12 bg-sky-400/90 hover:bg-sky-500 text-white font-semibold shadow-[0_8px_20px_-10px_rgba(56,189,248,0.9)] rounded-xl border border-sky-300/60" 
                          style={{ transition: 'box-shadow 0.2s' }}
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save changes"}
                        </Button>
                      </div>
                    </>
                  )}
                </PlanGate>
              </TabsContent>

              {/* Analytics Tab - Basic plan and above */}
              <TabsContent value="analytics" className="pb-8">
                <PlanGate minPlan="premium" featureName="Analytics Dashboard">
                  {!isPlanExpired && (
                    <>
                      {/* Expiration/Renewal Modal */}
                      <Dialog open={showRenewModal} onOpenChange={setShowRenewModal}>
                        <DialogContent>
                          <DialogTitle>{isPlanExpired ? "Your plan has expired" : "Your plan is about to expire"}</DialogTitle>
                          <DialogDescription>
                            {isPlanExpired
                              ? "Your subscription plan has expired. Features like GIF backgrounds, Pi Tips, and Analytics are now locked. Renew your plan to regain access."
                              : "Your subscription plan will expire soon. Renew now to avoid losing access to premium features."}
                            <br />
                            <strong>Expiration date:</strong> {expiresAt ? new Date(expiresAt).toLocaleString() : "-"}
                          </DialogDescription>
                          <DialogFooter>
                            <Button onClick={() => { setShowRenewModal(false); navigate("/subscription"); }}>
                              Renew Plan
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {profileId ? (
                        <Analytics profileId={profileId} />
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Save your profile first to see analytics</p>
                        </div>
                      )}
                    </>
                  )}
                </PlanGate>
              </TabsContent>


              {/* <TabsContent value="features" className="pb-8">
                <FutureFeaturesDashboard />
              </TabsContent> */}

              {/* DROP tokens tab content hidden for now */}
              {/* <TabsContent value="drop-tokens" className="pb-8">
                <PlanGate minPlan="basic" featureName="Pi Wallet for Tips">
                  <DropTokenManager piUser={piUser} piWallet={piUser?.wallet_address} />
                </PlanGate>
              </TabsContent> */}

              <TabsContent value="ad-network" className="pb-8">
                <PiAdNetwork />
              </TabsContent>

              <TabsContent value="payments" className="pb-8">
                <PiPayments />
              </TabsContent>


              {/* Subscription Tab */}
              <TabsContent value="subscription" className="pb-8">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Important:</strong> Canceling your plan will permanently delete all subscriptions (including gift card plans), gift cards, and transaction history. You can subscribe to a new plan after cancellation.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
                  <Button variant="outline" onClick={() => setShowPlanModal(true)}>
                    View My Plan / Renew
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelPlan}
                    disabled={cancelingPlan}
                  >
                    {cancelingPlan ? 'Canceling...' : 'Cancel Plan (back to Free)'}
                  </Button>
                </div>
                <SubscriptionStatus />
              </TabsContent>

              {/* Plan Modal */}
              <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
                <DialogContent className="max-w-lg">
                  <DialogTitle>User Plan Details</DialogTitle>
                  <DialogDescription>
                    View your current plan, expiry, and renew or upgrade below.
                  </DialogDescription>
                  <div className="my-4">
                    <SubscriptionStatus />
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-yellow-700">
                          Canceling will delete all subscriptions (regular & gift plans), gift cards, and transaction history. You can subscribe again after cancellation.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <Button onClick={() => setShowPlanModal(false)} variant="secondary">Close</Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelPlan}
                      disabled={cancelingPlan}
                    >
                      {cancelingPlan ? 'Canceling...' : 'Cancel Plan (back to Free)'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>


              {/* <TabsContent value="voting" className="pb-8">
                <VotingSystem />
              </TabsContent> */}

              {/* Monetization Tab - Products & Selling */}
              <TabsContent value="monetization" className="pb-8 space-y-6">
                <Card className="border border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/60">
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">Affiliate Program</h3>
                      <p className="text-sm text-muted-foreground">
                        Earn rewards by inviting new users with your referral link.
                      </p>
                    </div>
                    <Button onClick={() => navigate('/affiliate-program')} variant="default">
                      Open Affiliate Program
                    </Button>
                  </div>
                </Card>
                <PlanGate minPlan="basic" featureName="Monetization">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Products & Tips</h3>
                      <ProductManager
                        products={products}
                        onSave={saveProduct}
                        onDelete={deleteProduct}
                        profileId={profileId || ''}
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Image Link Cards</h3>
                      <ImageLinkCardManager
                        cards={profile.imageLinkCards || []}
                        onChange={(cards) => setProfile({ ...profile, imageLinkCards: cards })}
                      />
                    </div>
                  </div>
                </PlanGate>
              </TabsContent>

              {/* Memberships Tab - Tiers */}
              <TabsContent value="memberships" className="pb-8 space-y-6">
                <PlanGate minPlan="premium" featureName="Membership Tiers">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Membership Tiers</h3>
                    <MembershipManager
                      tiers={tiers}
                      onSave={saveTier}
                      onDelete={deleteTier}
                      profileId={profileId || ''}
                    />
                  </div>
                </PlanGate>
              </TabsContent>

              {/* Analytics Tab - Dashboard */}
              <TabsContent value="analytics" className="pb-8">
                <PlanGate minPlan="premium" featureName="Analytics Dashboard">
                  {!isPlanExpired && (
                    <AnalyticsDashboard
                      summary={analyticsSummary}
                      onExport={exportAnalytics}
                    />
                  )}
                </PlanGate>
              </TabsContent>

              {/* User Preferences Tab */}
              <TabsContent value="preferences" className="pb-8">
                <UserPreferencesManager />
                
                {/* Account Deletion Section */}
                <div className="mt-8">
                  <AccountDeletion 
                    currentUser={piUser || { id: profileId }}
                    onAccountDeleted={() => {
                      // Handle post-deletion cleanup
                      setProfile({
                        id: "",
                        username: "",
                        storeUrl: "",
                        businessName: "",
                        description: "",
                        logo: "",
                        email: "",
                        youtubeVideoUrl: "",
                        backgroundMusicUrl: "",
                        piDonationMessage: "",
                        piWalletAddress: "",
                        showShareButton: true,
                        hasPremium: false,
                        socialLinks: [
                          { type: "dropshare", url: "" },
                          { type: "twitter", url: "" },
                          { type: "instagram", url: "" },
                          { type: "youtube", url: "" },
                          { type: "tiktok", url: "" },
                          { type: "facebook", url: "" },
                          { type: "linkedin", url: "" },
                          { type: "twitch", url: "" },
                          { type: "website", url: "" },
                        ],
                        theme: {
                          primaryColor: "#38bdf8",
                          backgroundColor: "#000000",
                          backgroundType: "color",
                          backgroundGif: "",
                          backgroundVideo: "",
                          iconStyle: "rounded",
                          buttonStyle: "filled",
                        },
                        customLinks: [],
                        paymentLinks: [],
                        products: [],
                      });
                    }}
                  />
                </div>
              </TabsContent>

              {/* Pi Data content removed for production */}
                </div>
            </Tabs>
          </div>
        </section>
        <aside
          className={`w-full ${showPreview ? 'flex' : 'hidden lg:flex'} lg:w-[380px] xl:w-[420px] 2xl:w-[480px] lg:sticky lg:top-24 lg:self-start border border-slate-200/80 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/70 rounded-xl sm:rounded-2xl shadow-sm flex-col items-center justify-start overflow-hidden`}
          style={{ minHeight: 0 }}
        >
          <div className="w-full border-b border-slate-200/70 dark:border-slate-800/60 px-3 sm:px-4 lg:px-5 py-2 sm:py-3 lg:py-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wide text-slate-500">Preview</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {previewMode === "bio" ? "Public bio" : "Profile feed"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewMode("bio")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                    previewMode === "bio"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  Bio
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("feed")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                    previewMode === "feed"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  Feed
                </button>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleCopyLink}
                  title="Copy public link"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hidden xl:inline-flex"
                  onClick={handleOpenPublicBio}
                  title="Open public bio in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hidden xl:inline-flex"
                  onClick={handleOpenPublicFeed}
                  title="Open profile feed in new tab"
                >
                  <Users className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="w-full px-4 py-3 space-y-2">
            <Button 
              onClick={() => navigate('/subscription')} 
              variant="secondary"
              className="w-full"
              size="sm"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade plan
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center w-full overflow-hidden px-3 pb-4">
            {previewMode === "bio" ? (
              <PhonePreview 
                key={`preview-${profile.businessName}-${profile.description}-${profile.logo}-${bioTemplate}-${profile.appLink}-${profile.appTitle}-${profile.appLogo}-${profile.appDescription}-${(profile.appLinks || []).length}`}
                profile={profile}
                bioTemplate={bioTemplate}
              />
            ) : (
              <div className="w-full h-full flex flex-col overflow-hidden">
                <div className="px-1 pb-1 text-[11px] text-slate-500 dark:text-slate-400 text-center">
                  This is how your pinned feed posts will appear on your public feed.
                </div>
                <div className="flex-1 w-full overflow-y-auto space-y-2 pr-1">
                  {(profile.socialFeedItems || []).filter((item) => item.pinned !== false).length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 text-center px-4">
                      Add Profile Feed Pins in the editor to preview your social feed layout.
                    </div>
                  ) : (
                    (profile.socialFeedItems || [])
                      .filter((item) => item.pinned !== false)
                      .slice(0, 4)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 px-3 py-2 shadow-sm"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px] font-semibold text-slate-600 dark:text-slate-200 uppercase">
                              {(item.platform || item.title || "Post").slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {item.platform || "Social"}
                              </p>
                              <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                                {item.title || item.url || "Pinned post"}
                              </p>
                            </div>
                            {item.pinned !== false && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                                Pinned
                              </span>
                            )}
                          </div>
                          {item.thumbnail && !item.embedHtml && (
                            <div className="mt-1 rounded-md overflow-hidden border border-slate-200/80 dark:border-slate-800/80">
                              <img
                                src={item.thumbnail}
                                alt={item.title || "Pinned item"}
                                className="w-full h-24 object-cover"
                              />
                            </div>
                          )}
                          {!item.thumbnail && item.url && !item.embedHtml && (
                            <div className="mt-1 flex items-center justify-between gap-2 rounded-md bg-slate-50 dark:bg-slate-900/60 px-2 py-1.5">
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                                {item.url}
                              </span>
                              <ExternalLink className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
                            </div>
                          )}
                          {item.embedHtml && (
                            <div className="mt-1 rounded-md border border-dashed border-slate-300/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/60 px-2 py-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center">
                              Embed preview is available on the public page. This card represents the pinned embed.
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
      

      {/* QR Code Dialog for Store Link */}
      <QRCodeDialog
        open={showQRCode}
        onOpenChange={setShowQRCode}
        url={profile.storeUrl ? `${getWindowOrigin()}/${profile.storeUrl}` : ''}
        username={profile.storeUrl || 'store'}
      />

      {/* Pi Wallet QR Code Dialog */}
      <QRCodeDialog
        open={showPiWalletQR}
        onOpenChange={setShowPiWalletQR}
        url={piWalletQrData}
        username="Pi-Wallet"
      />

      {/* About Modal */}
      <AboutModal
        open={showAboutModal}
        onOpenChange={setShowAboutModal}
      />

      {/* Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent>
          <DialogTitle>Welcome to DropLink!</DialogTitle>
          <DialogDescription>
            👋 Hi, {displayUsername || 'there'}!<br />
            This is your dashboard. Here you can manage your profile, customize your page, and access all features.
          </DialogDescription>
          <DialogFooter>
            <button onClick={() => setShowWelcomeModal(false)} className="bg-sky-400 text-white px-4 py-2 rounded hover:bg-sky-500">Get Started</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Droplink Tutorial Modal */}
      <Dialog open={showDroplinkTutorialModal} onOpenChange={setShowDroplinkTutorialModal}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>How to Use Droplink</DialogTitle>
          <DialogDescription>
            Follow these steps to build your Droplink page, add buttons, and share your link.
          </DialogDescription>
          <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            <ol className="space-y-3">
              {droplinkTutorialSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="flex gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/60 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200 text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{step.title}</p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowDroplinkTutorialModal(false)}
            >
              Close
            </Button>
            <Button
              variant="default"
              className="bg-sky-500 hover:bg-sky-600 text-white"
              onClick={() => {
                setShowDroplinkTutorialModal(false);
                focusTab("profile");
              }}
            >
              Start building
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inbox Preview Modal */}
      <Dialog open={showInboxPreview} onOpenChange={setShowInboxPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Messages</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {loadingConversations && (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-muted/60 animate-pulse" />
                ))}
              </div>
            )}
            {!loadingConversations && conversations.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">
                No recent conversations yet.
              </div>
            )}
            {!loadingConversations && conversations.length > 0 && (
              <div className="space-y-2">
                {conversations.map((item) => (
                  <button
                    key={item.otherUserId}
                    className="w-full flex items-center gap-3 rounded-lg border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/60 px-3 py-2 text-left hover:shadow-sm"
                    onClick={() => {
                      setShowInboxPreview(false);
                      navigate(`/chat/${item.username}`);
                    }}
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-xs font-semibold">
                      {item.logo ? (
                        <img src={item.logo} alt={item.username} className="w-full h-full object-cover" />
                      ) : (
                        item.username?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">@{item.username}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => {
              setShowInboxPreview(false);
              navigate('/inbox');
            }}>
              Open Inbox
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Page Switcher Button */}
      <button
        type="button"
        onClick={() => setShowPageSwitcher(true)}
        className="fixed bottom-20 right-4 sm:right-6 z-50 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-slate-900 border border-slate-200 shadow-lg hover:bg-slate-50 active:scale-95 transition-all"
        aria-label="Open page switcher"
        title="Switch dashboard page"
      >
        <LayoutGrid className="w-5 h-5" />
      </button>

      {/* Page Switcher Modal */}
      <Dialog open={showPageSwitcher} onOpenChange={setShowPageSwitcher}>
        <DialogContent>
          <DialogTitle>Go to Page</DialogTitle>
          <DialogDescription>Select a dashboard section.</DialogDescription>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {[
              { label: "Profile", tab: "profile", icon: <User className="w-4 h-4" /> },
              { label: "Design", tab: "design", icon: <Palette className="w-4 h-4" /> },
              { label: "Analytics", tab: "analytics", icon: <TrendingUp className="w-4 h-4" /> },
              { label: "Ads", tab: "ad-network", icon: <PlayCircle className="w-4 h-4" /> },
              { label: "Monetize", tab: "monetization", icon: <Wallet className="w-4 h-4" /> },
              { label: "Tiers", tab: "memberships", icon: <Crown className="w-4 h-4" /> },
              { label: "Subscription", tab: "subscription", icon: <CreditCard className="w-4 h-4" /> },
              { label: "Settings", tab: "preferences", icon: <Settings className="w-4 h-4" /> },
              { label: "Payments", tab: "payments", icon: <Droplets className="w-4 h-4" /> },
            ].map((item) => (
              <Button
                key={item.tab}
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  handlePageSwitch(item.tab);
                }}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </div>
          <div className="mt-5">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Preview</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={() => {
                  setPreviewMode("bio");
                  setShowPreview(true);
                  setShowPageSwitcher(false);
                }}
              >
                <Eye className="w-4 h-4" />
                Bio
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={() => {
                  setPreviewMode("feed");
                  setShowPreview(true);
                  setShowPageSwitcher(false);
                }}
              >
                <Users className="w-4 h-4" />
                Feed
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isSwitchingPage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur">
          <DroplinkSpinner size={64} />
        </div>
      )}

      </main>

      {/* Bottom Navigation Bar - Mobile & Desktop Unified */}
      <nav
        className={`fixed left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-sky-200/60 dark:border-sky-800/60 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] z-50 transition-all duration-500 ease-in-out ${showFooter ? 'bottom-0 translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2">
          <div className="flex justify-around items-center">
            {/* Home */}
            <button
              onClick={() => {
                if (window.location.pathname !== '/') {
                  navigate('/');
                  setTimeout(() => {
                    focusTab('profile');
                  }, 500);
                } else {
                  focusTab('profile');
                }
              }}
              className="relative flex flex-col items-center justify-center py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 active:scale-95 transition-all duration-300 group rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/30"
              title="Home"
            >
              <Home className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 group-hover:scale-125 group-hover:rotate-3 transition-all duration-300 drop-shadow-sm" />
              <span className="text-xs sm:text-xs group-hover:font-semibold transition-all">Home</span>
              <span className="absolute inset-0 rounded-xl bg-gradient-to-t from-sky-400/0 to-sky-400/0 group-hover:from-sky-400/10 group-hover:to-transparent transition-all duration-300"></span>
            </button>

            {/* Inbox */}
            <button
              onClick={handleInboxClick}
              className="relative flex flex-col items-center justify-center py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 active:scale-95 transition-all duration-300 group rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/30"
              title="Inbox"
            >
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 group-hover:scale-125 group-hover:-rotate-3 transition-all duration-300 drop-shadow-sm" />
              <span className="text-xs sm:text-xs group-hover:font-semibold transition-all">Inbox</span>
              <span className="absolute inset-0 rounded-xl bg-gradient-to-t from-sky-400/0 to-sky-400/0 group-hover:from-sky-400/10 group-hover:to-transparent transition-all duration-300"></span>
              {inboxUnreadCount > 0 && (
                <span className="absolute -top-1 right-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1 shadow">
                  {inboxUnreadCount > 99 ? '99+' : inboxUnreadCount}
                </span>
              )}
            </button>

            {/* Search Users */}
            <button
              onClick={() => navigate('/search-users')}
              className="relative flex flex-col items-center justify-center py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 active:scale-95 transition-all duration-300 group rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/30"
              title="Search Users"
            >
              <Search className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 drop-shadow-sm" />
              <span className="text-xs sm:text-xs group-hover:font-semibold transition-all">Search</span>
              <span className="absolute inset-0 rounded-xl bg-gradient-to-t from-sky-400/0 to-sky-400/0 group-hover:from-sky-400/10 group-hover:to-transparent transition-all duration-300"></span>
            </button>

            {/* Followers */}
            <button
              onClick={handleFollowersClick}
              className="relative flex flex-col items-center justify-center py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 active:scale-95 transition-all duration-300 group rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/30"
              title="Followers"
            >
              <Users className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 group-hover:scale-125 transition-all duration-300 drop-shadow-sm" />
              <span className="text-xs sm:text-xs group-hover:font-semibold transition-all">Followers</span>
              <span className="absolute inset-0 rounded-xl bg-gradient-to-t from-sky-400/0 to-sky-400/0 group-hover:from-sky-400/10 group-hover:to-transparent transition-all duration-300"></span>
              {followerBadge > 0 && (
                <span className="absolute -top-1 right-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-semibold px-1 shadow">
                  {followerBadge > 99 ? '99+' : followerBadge}
                </span>
              )}
            </button>

            {/* About */}
            <button
              onClick={() => setShowAboutModal(true)}
              className="relative flex flex-col items-center justify-center py-2 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-300 active:scale-95 transition-all duration-300 group rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/30"
              title="About Droplink"
            >
              <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200 shadow-sm group-hover:scale-105 transition-all">
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <span className="text-[11px] sm:text-xs mt-1 leading-tight">About</span>
            </button>

            {/* Menu */}
            <Drawer>
              <DrawerTrigger asChild>
                <button 
                  className="relative flex flex-col items-center justify-center py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 active:scale-95 transition-all duration-300 group rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/30"
                  title="More Options"
                >
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 group-hover:scale-125 group-hover:rotate-90 transition-all duration-300 drop-shadow-sm" />
                  <span className="text-xs sm:text-xs group-hover:font-semibold transition-all">Menu</span>
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-t from-sky-400/0 to-sky-400/0 group-hover:from-sky-400/10 group-hover:to-transparent transition-all duration-300"></span>
                </button>
              </DrawerTrigger>
              <DrawerContent className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 fixed bottom-16 left-0 right-0 max-h-[70vh] z-50">
                <DrawerHeader className="border-b pb-3">
                  <DrawerTitle className="text-base sm:text-lg font-semibold">Droplink Menu</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 space-y-3 max-h-[calc(70vh-100px)] overflow-y-auto">
                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/40 p-2.5">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 px-1 py-1 font-semibold">Profile</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button 
                        onClick={() => { navigate('/'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Home className="w-4 h-4" />
                        Dashboard
                      </Button>
                      <Button 
                        onClick={() => { navigate('/profile'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/40 p-2.5">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 px-1 py-1 font-semibold">Social</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button 
                        onClick={() => { navigate('/followers'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Users className="w-4 h-4" />
                        Followers
                      </Button>
                      <Button 
                        onClick={() => { navigate('/search-users'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Users className="w-4 h-4" />
                        Discover Users
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/40 p-2.5">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 px-1 py-1 font-semibold">Business & Shop</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button 
                        onClick={() => { navigate('/switch-to-merchant'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Store className="w-4 h-4" />
                        Merchant Store
                      </Button>
                      <Button 
                        onClick={() => { navigate('/sales-earnings'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Sales & Earnings
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/40 p-2.5">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 px-1 py-1 font-semibold">Messaging & Community</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button 
                        onClick={() => { navigate('/inbox'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Mail className="w-4 h-4" />
                        Inbox & Messages
                      </Button>
                      <Button 
                        onClick={() => { navigate('/inbox'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Users className="w-4 h-4" />
                        Group Chat
                      </Button>
                      <Button 
                        onClick={() => { 
                          navigate('/affiliate-program');
                        }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Affiliate Program
                      </Button>
                      <Button
                        onClick={() => { navigate('/ambassador-program'); }}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Crown className="w-4 h-4" />
                        Ambassador Program
                      </Button>
                      <Button
                        onClick={() => { navigate('/moderator-program'); }}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Users className="w-4 h-4" />
                        Moderator Program
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/40 p-2.5">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 px-1 py-1 font-semibold">Tools</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button 
                        onClick={() => { navigate('/card-generator'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <CreditCard className="w-4 h-4" />
                        Card Generator
                      </Button>
                      <Button 
                        onClick={() => { navigate('/ai-support'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Bot className="w-4 h-4" />
                        AI Support
                      </Button>
                      <Button 
                        onClick={() => { navigate('/wallet'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Wallet className="w-4 h-4" />
                        Wallet
                      </Button>
                      <Button 
                        onClick={() => { navigate('/domain'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Globe className="w-4 h-4" />
                        Custom Domain
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/40 p-2.5">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 px-1 py-1 font-semibold">Account</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button 
                        onClick={() => { navigate('/subscription'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Crown className="w-4 h-4" />
                        Upgrade Plan
                      </Button>
                      <Button 
                        onClick={() => { navigate('/privacy'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Info className="w-4 h-4" />
                        Privacy Policy
                      </Button>
                      <Button 
                        onClick={() => setShowAboutModal(true)}
                        variant="secondary"
                        size="sm"
                        className="w-full justify-start gap-2 h-10"
                      >
                        <Info className="w-4 h-4" />
                        About Droplink
                      </Button>
                      <Button 
                        onClick={() => { navigate('/terms'); }} 
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 bg-white/80 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md"
                      >
                        <Info className="w-4 h-4" />
                        Terms of Service
                      </Button>
                      <Button 
                        onClick={handleLogout}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 h-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </nav>
    </div>
  );
};

// (imports already handled at top)

const GiftRedeemModal = () => {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState("");
  const [code, setCode] = useState("");
  const [period, setPeriod] = useState("");

  useEffect(() => {
    const checkGift = () => {
      const data = window.localStorage.getItem('droplink-gift-redeemed');
      if (data) {
        const { plan, code, period } = JSON.parse(data);
        setPlan(plan);
        setCode(code);
        setPeriod(period);
        setOpen(true);
      }
    };
    checkGift();
    window.addEventListener('droplink-gift-redeemed', checkGift);
    return () => window.removeEventListener('droplink-gift-redeemed', checkGift);
  }, []);

  const handleClose = () => {
    setOpen(false);
    window.localStorage.removeItem('droplink-gift-redeemed');
  };

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>Gift Plan Activated!</DialogTitle>
        <DialogDescription>
          <div className="mb-2">You have redeemed a <b>{plan}</b> plan ({period}) with code <span className="font-mono">{code}</span>.</div>
          <div className="mb-2">Your dashboard features are now unlocked based on this plan.</div>
        </DialogDescription>
        <DialogFooter>
          <button onClick={handleClose} className="bg-sky-400 text-white px-4 py-2 rounded hover:bg-sky-500">OK</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DashboardWithGiftModal = ({ initialTab, hideTabNavigation }: DashboardProps) => {
  return <>
    <GiftRedeemModal />
    <Dashboard initialTab={initialTab} hideTabNavigation={hideTabNavigation} />
  </>;
};

export default DashboardWithGiftModal;






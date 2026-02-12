import { useMemo } from "react";
import { useActiveSubscription, PlanType } from "@/hooks/useActiveSubscription";
import { SUBSCRIPTION_PLANS } from "@/config/subscription-plans";

export interface PlanFeatures {
  // Plan info
  plan: PlanType;
  planName: string;
  isActive: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysLeft: number | null;
  
  // Feature access
  canAccessFeature: (feature: keyof typeof FEATURE_PLAN_MAP) => boolean;
  hasFeature: (feature: keyof typeof FEATURE_PLAN_MAP) => boolean;
  
  // Limits
  maxSocialLinks: number;
  maxCustomLinks: number;
  maxPaymentLinks: number;
  
  // Individual features
  hasAnalytics: boolean;
  hasCustomLinks: boolean;
  hasGifBackground: boolean;
  hasYoutubeVideo: boolean;
  hasBackgroundMusic: boolean;
  hasDigitalProducts: boolean;
  hasThemeCustomization: boolean;
  hasPiWalletTips: boolean;
  hasAiFeatures: boolean;
  hasCustomDomain: boolean;
  hasPrioritySupport: boolean;
  hasAdvancedTheme: boolean;
  hasNoAds: boolean;
  hasSocialFeed: boolean;
  hasImageLinkCards: boolean;
  hasVirtualCards: boolean;
  hasWhiteLabel: boolean;
}

// Map features to minimum required plan
export const FEATURE_PLAN_MAP = {
  // Free features
  basicProfile: "free",
  basicTheme: "free",
  publicBio: "free",
  qrCode: "free",
  oneSocialLink: "free",
  
  // Basic features
  piWalletTips: "basic",
  socialFeed: "basic",
  multipleSocialLinks: "basic",
  basicAnalytics: "basic",
  noWatermark: "basic",
  fiveCustomLinks: "basic",
  
  // Premium features
  customLinks: "premium",
  gifBackground: "premium",
  youtubeVideo: "premium",
  backgroundMusic: "premium",
  digitalProducts: "premium",
  themeCustomization: "premium",
  advancedTheme: "premium",
  aiFeatures: "premium",
  imageLinkCards: "premium",
  virtualCards: "premium",
  unlimitedSocialLinks: "premium",
  prioritySupport: "premium",
  
  // Pro features
  analytics: "pro",
  customDomain: "pro",
  whiteLabel: "pro",
  noAds: "pro",
  apiAccess: "pro",
  teamCollaboration: "pro",
  bulkManagement: "pro",
  enterpriseFeatures: "pro",
} as const;

const PLAN_ORDER: PlanType[] = ["free", "basic", "premium", "pro"];

export const usePlanFeatures = (): PlanFeatures => {
  const { plan, expiresAt, status, loading, isActive } = useActiveSubscription();
  
  return useMemo(() => {
    const now = new Date();
    const expiresDate = expiresAt ? new Date(expiresAt) : null;
    const isExpired = expiresDate ? expiresDate < now : false;
    const daysLeft = expiresDate 
      ? Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
    
    // Get effective plan (downgrade to free if expired)
    const effectivePlan: PlanType = isExpired ? "free" : plan;
    const planIndex = PLAN_ORDER.indexOf(effectivePlan);
    
    // Check if user can access a feature based on their plan
    const canAccessFeature = (feature: keyof typeof FEATURE_PLAN_MAP): boolean => {
      if (isExpired) return false;
      const requiredPlan = FEATURE_PLAN_MAP[feature] as PlanType;
      const requiredIndex = PLAN_ORDER.indexOf(requiredPlan);
      return planIndex >= requiredIndex;
    };
    
    // Alias for hasFeature
    const hasFeature = canAccessFeature;
    
    // Get limits based on plan
    const planConfig = SUBSCRIPTION_PLANS[effectivePlan];
    
    // Get plan name
    const planName = effectivePlan === "pro" ? "Professional" 
      : effectivePlan.charAt(0).toUpperCase() + effectivePlan.slice(1);
    
    return {
      // Plan info
      plan: effectivePlan,
      planName,
      isActive: isActive && !isExpired,
      isExpired,
      isExpiringSoon,
      daysLeft,
      
      // Feature access functions
      canAccessFeature,
      hasFeature,
      
      // Limits
      maxSocialLinks: planConfig?.limits?.socialLinks || 1,
      maxCustomLinks: planConfig?.limits?.customLinks || 0,
      maxPaymentLinks: planConfig?.limits?.paymentLinks || 0,
      
      // Individual feature flags
      hasAnalytics: canAccessFeature("analytics"),
      hasCustomLinks: canAccessFeature("customLinks"),
      hasGifBackground: canAccessFeature("gifBackground"),
      hasYoutubeVideo: canAccessFeature("youtubeVideo"),
      hasBackgroundMusic: canAccessFeature("backgroundMusic"),
      hasDigitalProducts: canAccessFeature("digitalProducts"),
      hasThemeCustomization: canAccessFeature("themeCustomization"),
      hasPiWalletTips: canAccessFeature("piWalletTips"),
      hasAiFeatures: canAccessFeature("aiFeatures"),
      hasCustomDomain: canAccessFeature("customDomain"),
      hasPrioritySupport: canAccessFeature("prioritySupport"),
      hasAdvancedTheme: canAccessFeature("advancedTheme"),
      hasNoAds: canAccessFeature("noAds"),
      hasSocialFeed: canAccessFeature("socialFeed"),
      hasImageLinkCards: canAccessFeature("imageLinkCards"),
      hasVirtualCards: canAccessFeature("virtualCards"),
      hasWhiteLabel: canAccessFeature("whiteLabel"),
    };
  }, [plan, expiresAt, status, isActive]);
};

export default usePlanFeatures;

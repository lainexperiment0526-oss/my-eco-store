/**
 * Subscription Plan Configuration for DropLink Mainnet
 * Pi Network integration for plan purchases
 */

export type PlanType = "free" | "basic" | "premium" | "pro";

export interface PlanFeature {
  name: string;
  description: string;
  available: boolean;
}

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  price: number; // in Pi
  billingPeriod: "monthly" | "yearly";
  description: string;
  benefits: string[];
  features: Record<string, boolean>;
  limits: {
    socialLinks: number;
    customLinks: number;
    paymentLinks: number;
    storageGb: number;
    customDomain: boolean;
    analytics: boolean;
    gifBackground: boolean;
    piWalletTips: boolean;
    aiFeatures: boolean;
    prioritySupport: boolean;
  };
  badge?: string;
  recommended?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<PlanType, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    billingPeriod: "monthly",
    description: "Perfect for getting started with DropLink",
    benefits: [
      "Basic profile customization",
      "1 social link",
      "Public store page",
      "Pi Network integration",
      "Community support",
    ],
    features: {
      profileCustomization: true,
      socialLinks: true,
      publicStore: true,
      paymentLinks: false,
      customLinks: false,
      analytics: false,
      gifBackground: false,
      piWalletTips: false,
      customDomain: false,
      aiFeatures: false,
      prioritySupport: false,
      advancedTheme: false,
    },
    limits: {
      socialLinks: 1,
      customLinks: 0,
      paymentLinks: 0,
      storageGb: 1,
      customDomain: false,
      analytics: false,
      gifBackground: false,
      piWalletTips: false,
      aiFeatures: false,
      prioritySupport: false,
    },
  },

  basic: {
    id: "basic",
    name: "Basic",
    price: 10.0,
    billingPeriod: "monthly",
    description: "Starter plan for creators and small businesses",
    benefits: [
      "Up to 3 social media links",
      "Pi Wallet for receiving tips and donations",
      "Basic analytics dashboard access",
      "Up to 5 custom links",
      "Email support (standard)",
      "Priority for new features",
      "No DropLink watermark",
    ],
    features: {
      profileCustomization: true,
      socialLinks: true,
      publicStore: true,
      paymentLinks: true,
      customLinks: true,
      analytics: true,
      gifBackground: false,
      piWalletTips: true,
      customDomain: false,
      aiFeatures: false,
      prioritySupport: false,
      advancedTheme: false,
    },
    limits: {
      socialLinks: 3,
      customLinks: 5,
      paymentLinks: 5,
      storageGb: 1,
      customDomain: false,
      analytics: true,
      gifBackground: false,
      piWalletTips: true,
      aiFeatures: false,
      prioritySupport: false,
    },
  },

  premium: {
    id: "premium",
    name: "Premium",
    price: 20.0,
    billingPeriod: "monthly",
    description: "Unlock advanced customization, media and analytics",
    benefits: [
      "Unlimited social media links (up to 99)",
      "Advanced theme customization and GIF backgrounds",
      "Advanced analytics dashboard",
      "Unlimited custom links (up to 25 with management)",
      "YouTube video integration",
      "Background music player",
      "Digital product listings",
      "Virtual card generation and management",
      "Priority email support",
      "AI features and logo generation",
    ],
    features: {
      profileCustomization: true,
      socialLinks: true,
      publicStore: true,
      paymentLinks: true,
      customLinks: true,
      analytics: true,
      gifBackground: true,
      piWalletTips: true,
      customDomain: false,
      aiFeatures: true,
      prioritySupport: true,
      advancedTheme: true,
    },
    limits: {
      socialLinks: 99,
      customLinks: 25,
      paymentLinks: 25,
      storageGb: 5,
      customDomain: false,
      analytics: true,
      gifBackground: true,
      piWalletTips: true,
      aiFeatures: true,
      prioritySupport: true,
    },
    recommended: true,
  },

  pro: {
    id: "pro",
    name: "Professional",
    price: 30.0,
    billingPeriod: "monthly",
    description: "Enterprise features, white‑label and integrations",
    benefits: [
      "Everything in Premium",
      "Custom domain support (Pro exclusive)",
      "Advanced API access for integrations",
      "Unlimited links and social profiles",
      "24/7 priority support with dedicated channel",
      "White‑label options (remove DropLink branding)",
      "Advanced security & team collaboration",
      "Bulk management and exports",
      "No watch ads - Ad-free experience",
      "Custom enterprise integrations",
    ],
    features: {
      profileCustomization: true,
      socialLinks: true,
      publicStore: true,
      paymentLinks: true,
      customLinks: true,
      analytics: true,
      gifBackground: true,
      piWalletTips: true,
      customDomain: true,
      aiFeatures: true,
      prioritySupport: true,
      advancedTheme: true,
    },
    limits: {
      socialLinks: 999,
      customLinks: 999,
      paymentLinks: 999,
      storageGb: 10,
      customDomain: true,
      analytics: true,
      gifBackground: true,
      piWalletTips: true,
      aiFeatures: true,
      prioritySupport: true,
    },
    badge: "🚀",
  },
};

export const PLAN_DURATIONS = [
  { value: "monthly", label: "Monthly", duration: 1 },
  { value: "yearly", label: "Yearly (Save 20%)", duration: 12, discount: 0.2 },
] as const;

export function getPlanPrice(
  planId: PlanType,
  billingPeriod: "monthly" | "yearly" = "monthly"
): number {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan || plan.price === 0) return 0;

  if (billingPeriod === "yearly") {
    // 20% discount for yearly billing
    return Math.round(plan.price * 12 * 0.8 * 100) / 100;
  }
  return plan.price;
}

export function calculateYearlyDiscount(monthlyPrice: number): number {
  const yearlyPrice = getPlanPrice("basic", "yearly");
  const normalYearlyPrice = monthlyPrice * 12;
  return Math.round(((normalYearlyPrice - yearlyPrice) / normalYearlyPrice) * 100);
}

export function canAccessFeature(
  userPlan: PlanType,
  featureKey: keyof SubscriptionPlan["features"]
): boolean {
  const plan = SUBSCRIPTION_PLANS[userPlan];
  if (!plan) return false;
  return plan.features[featureKey] || false;
}

export function getPlanFeatureLimit(
  userPlan: PlanType,
  limitKey: keyof SubscriptionPlan["limits"]
): number | boolean {
  const plan = SUBSCRIPTION_PLANS[userPlan];
  if (!plan) return false;
  return plan.limits[limitKey] || 0;
}

export function getUpgradePath(currentPlan: PlanType): PlanType[] {
  const hierarchy: PlanType[] = ["free", "basic", "premium", "pro"];
  const currentIndex = hierarchy.indexOf(currentPlan);
  return hierarchy.slice(currentIndex + 1);
}

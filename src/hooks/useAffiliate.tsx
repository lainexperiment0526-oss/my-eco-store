export interface AffiliateReward {
  id: string;
  reward_type: string;
  amount_usd: number;
  invitee_id: string | null;
  app_id: string | null;
  created_at: string;
}

export interface AffiliateProfile {
  referral_code: string | null;
  referred_by: string | null;
  apk_installed: boolean;
}

export function captureRefCodeFromURL() {
  return undefined;
}

export function useAffiliate() {
  return {
    profile: null as AffiliateProfile | null,
    rewards: [] as AffiliateReward[],
    loading: false,
    totalEarnedUsd: 0,
    refresh: async () => undefined,
    attachPendingRefCode: async () => undefined,
  };
}

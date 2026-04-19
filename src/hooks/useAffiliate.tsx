import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const REF_KEY = 'openapp_ref_code';

export interface AffiliateReward {
  id: string;
  reward_type: 'apk_install' | 'app_listing';
  amount_usd: number;
  invitee_id: string;
  app_id: string | null;
  created_at: string;
}

export interface AffiliateProfile {
  referral_code: string | null;
  referred_by: string | null;
  apk_installed: boolean;
}

/** Read ?ref= from URL and store in localStorage */
export function captureRefCodeFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref.length <= 32) {
      localStorage.setItem(REF_KEY, ref.toUpperCase());
    }
  } catch {}
}

export function getStoredRefCode(): string | null {
  try {
    return localStorage.getItem(REF_KEY);
  } catch {
    return null;
  }
}

export function clearStoredRefCode() {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {}
}

export function useAffiliate() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [rewards, setRewards] = useState<AffiliateReward[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setRewards([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: prof }, { data: rew }] = await Promise.all([
      supabase
        .from('profiles')
        .select('referral_code, referred_by, apk_installed')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('affiliate_rewards')
        .select('id, reward_type, amount_usd, invitee_id, app_id, created_at')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false }),
    ]);
    setProfile(prof as AffiliateProfile | null);
    setRewards((rew as AffiliateReward[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  /** Attach pending ref code to current user's profile (call once after sign-in/up) */
  const attachPendingRefCode = useCallback(async () => {
    if (!user) return;
    const code = getStoredRefCode();
    if (!code) return;

    // Re-fetch profile to check
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, referred_by, referral_code')
      .eq('id', user.id)
      .maybeSingle();

    if (!prof || prof.referred_by) {
      clearStoredRefCode();
      return;
    }
    if (prof.referral_code === code) {
      // self-referral
      clearStoredRefCode();
      return;
    }

    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle();

    if (!referrer || referrer.id === user.id) {
      clearStoredRefCode();
      return;
    }

    await supabase
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', user.id);

    clearStoredRefCode();
    load();
  }, [user, load]);

  const confirmApkInstalled = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ apk_installed: true, apk_installed_at: new Date().toISOString() })
      .eq('id', user.id);
    if (!error) load();
    return error;
  }, [user, load]);

  const totalEarnedUsd = rewards.reduce((s, r) => s + Number(r.amount_usd), 0);
  const apkRewards = rewards.filter((r) => r.reward_type === 'apk_install');
  const listingRewards = rewards.filter((r) => r.reward_type === 'app_listing');

  return {
    profile,
    rewards,
    apkRewards,
    listingRewards,
    totalEarnedUsd,
    loading,
    attachPendingRefCode,
    confirmApkInstalled,
    reload: load,
  };
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PlanType = "free" | "basic" | "premium" | "pro";

interface PublicSubscription {
  plan: PlanType;
  expiresAt: Date | null;
  status: string | null;
  loading: boolean;
}

export const usePublicSubscription = (usernameOrProfileId: string, byProfileId = false): PublicSubscription => {
  const [plan, setPlan] = useState<PlanType>("free");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let profileId = usernameOrProfileId;
        if (!byProfileId) {
          // Lookup profileId by username
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", usernameOrProfileId)
            .maybeSingle();
          if (!profile?.id) {
            setLoading(false);
            return;
          }
          profileId = profile.id;
        }
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan_type, end_date, status")
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (sub && new Date(sub.end_date) > new Date()) {
          setPlan((sub.plan_type as PlanType) || "free");
          setExpiresAt(new Date(sub.end_date));
          setStatus(sub.status || null);
        } else {
          setPlan("free");
          setExpiresAt(null);
          setStatus(null);
        }
      } catch (e) {
        console.error("Failed to load public subscription", e);
      } finally {
        setLoading(false);
      }
    };
    if (usernameOrProfileId) load();
  }, [usernameOrProfileId, byProfileId]);

  return { plan, expiresAt, status, loading };
};

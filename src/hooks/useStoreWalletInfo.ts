import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useStoreWalletInfo(username: string) {
  const [walletAddress, setWalletAddress] = useState("");
  const [tipText, setTipText] = useState("");

  useEffect(() => {
    if (!username) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("pi_wallet_address, pi_donation_message")
        .eq("username", username)
        .maybeSingle();
      if (data) {
        setWalletAddress(data.pi_wallet_address || "");
        setTipText(data.pi_donation_message || "Tip Pi or DROP");
      }
    })();
  }, [username]);

  return { walletAddress, tipText };
}

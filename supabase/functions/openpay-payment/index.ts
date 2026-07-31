import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENPAY_BASE =
  Deno.env.get("OPENPAY_BASE_URL") ||
  "https://araojncyittkahvvpdrn.supabase.co/functions/v1/partner-transfer-api";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = Deno.env.get("OPENPAY_API_KEY");
  const clientSecret = Deno.env.get("OPENPAY_CLIENT_SECRET") || apiKey;
  const clientId = Deno.env.get("OPENPAY_CLIENT_ID");
  if (!apiKey) return json({ error: "OpenPay not configured" }, 500);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData } = await userClient.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const partnerHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  try {
    const body = await req.json();
    const { action, amount, memo, metadata, chargeId, successUrl, cancelUrl, reference } = body;

    // ---------- Create a PayButton checkout charge ----------
    if (action === "create-charge" || action === "create-invoice") {
      const res = await fetch(`${OPENPAY_BASE}/charges`, {
        method: "POST",
        headers: partnerHeaders,
        body: JSON.stringify({
          amount: Number(amount),
          currency: "OUSD",
          description: memo || "OpenApp purchase",
          reference: reference || `openapp_${userId.slice(0, 8)}_${Date.now()}`,
          success_url: successUrl || null,
          cancel_url: cancelUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("OpenPay charge failed", res.status, JSON.stringify(data));
        return json({ error: data?.error || `OpenPay charge failed (${res.status})`, details: data }, res.status);
      }

      await supabase.from("pi_payments").insert({
        user_id: userId,
        payment_id: data.id,
        amount: Number(amount),
        memo: memo || "",
        status: "pending",
        provider: "openpay",
        metadata: { ...metadata, openpay_charge: data },
      });

      return json({
        success: true,
        charge: data,
        invoice: data, // backwards-compatible alias
        checkout_url: data.checkout_url,
        paybutton_url: data.id ? `https://openpy.space/paybutton/${data.id}` : null,
      });
    }

    // ---------- Poll charge status ----------
    if (action === "verify" || action === "charge-status") {
      const id = chargeId || body.invoiceId;
      if (!id) return json({ error: "chargeId required" }, 400);

      const res = await fetch(`${OPENPAY_BASE}/charges/${id}`, { headers: partnerHeaders });
      const data = await res.json();
      if (!res.ok) {
        console.error("OpenPay verify failed", res.status, JSON.stringify(data));
        return json({ error: data?.error || `OpenPay verify failed (${res.status})`, details: data }, res.status);
      }

      const status = data.status; // created | paid | canceled | expired
      if (status !== "paid") return json({ success: true, status, charge: data });

      const { data: payment } = await supabase
        .from("pi_payments")
        .select("id, status, amount, metadata")
        .eq("payment_id", id)
        .maybeSingle();

      const meta = (payment?.metadata as Record<string, unknown>) || {};
      const totalAmount = Number(payment?.amount || data.amount || 0);

      if (payment && payment.status !== "completed") {
        await supabase.from("pi_payments").update({ status: "completed" }).eq("id", payment.id);

        if (
          (meta.type === "app_purchase" || meta.type === "app_subscription_renewal") &&
          meta.app_id &&
          meta.developer_id
        ) {
          await supabase.from("developer_earnings").insert({
            developer_id: meta.developer_id,
            app_id: meta.app_id,
            payment_id: payment.id,
            total_amount: totalAmount,
            developer_share: totalAmount * 0.7,
            platform_fee: totalAmount * 0.3,
          });
        }
      }

      return json({ success: true, status: "paid", charge: data });
    }

    // ---------- Cancel a charge ----------
    if (action === "cancel-charge") {
      const res = await fetch(`${OPENPAY_BASE}/charges/${chargeId}/cancel`, {
        method: "POST",
        headers: partnerHeaders,
      });
      const data = await res.json();
      if (!res.ok) return json({ error: data?.error || "Cancel failed", details: data }, res.status);
      return json({ success: true, charge: data });
    }

    // ---------- Partner account info ----------
    if (action === "me" || action === "balance") {
      const res = await fetch(`${OPENPAY_BASE}/${action}`, { headers: partnerHeaders });
      const data = await res.json();
      if (!res.ok) return json({ error: data?.error || "OpenPay request failed", details: data }, res.status);
      return json({ success: true, data });
    }

    // ---------- OAuth: exchange authorization code ----------
    if (action === "oauth-exchange") {
      const { code, redirectUri } = body;
      const finalRedirect = redirectUri || Deno.env.get("OPENPAY_REDIRECT_URI");
      if (!code || !finalRedirect) return json({ error: "code and redirectUri required" }, 400);
      if (!clientId) return json({ error: "OPENPAY_CLIENT_ID not configured" }, 500);

      const tokenRes = await fetch(`${OPENPAY_BASE}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: finalRedirect,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      const token = await tokenRes.json();
      if (!tokenRes.ok || !token?.access_token) {
        console.error("OpenPay token exchange failed", tokenRes.status, JSON.stringify(token));
        return json(
          { error: token?.error || `Token exchange failed (${tokenRes.status})`, details: token },
          tokenRes.status === 200 ? 400 : tokenRes.status,
        );
      }

      const meRes = await fetch(`${OPENPAY_BASE}/user/me`, {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      const me = await meRes.json();
      if (!meRes.ok) {
        console.error("OpenPay /user/me failed", meRes.status, JSON.stringify(me));
        return json({ error: me?.error || "Failed to load OpenPay profile", details: me }, meRes.status);
      }

      const expiresAt = new Date(Date.now() + Number(token.expires_in || 2592000) * 1000).toISOString();

      await supabase.from("openpay_connections").upsert(
        {
          user_id: userId,
          openpay_user_id: String(me.user_id ?? token.user_id ?? ""),
          account_number: me.account_number ?? null,
          username: me.username ?? null,
          full_name: me.full_name ?? null,
          avatar_url: me.avatar_url ?? null,
          scope: token.scope ?? me.scope ?? null,
          access_token: token.access_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      return json({
        success: true,
        profile: {
          account_number: me.account_number,
          username: me.username,
          full_name: me.full_name,
          avatar_url: me.avatar_url,
          balance: me.balance,
          currency: me.currency,
          scope: me.scope,
        },
      });
    }

    // ---------- OAuth: read connected user's profile/balance ----------
    if (action === "connected-profile" || action === "connected-balance") {
      const { data: conn } = await supabase
        .from("openpay_connections")
        .select("access_token")
        .eq("user_id", userId)
        .maybeSingle();
      if (!conn?.access_token) return json({ error: "No OpenPay account connected" }, 404);

      const path = action === "connected-balance" ? "/user/balance" : "/user/me";
      const res = await fetch(`${OPENPAY_BASE}${path}`, {
        headers: { Authorization: `Bearer ${conn.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) return json({ error: data?.error || "OpenPay request failed", details: data }, res.status);
      return json({ success: true, data });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("openpay-payment error", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

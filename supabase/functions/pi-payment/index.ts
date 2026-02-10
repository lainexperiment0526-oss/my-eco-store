import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PI_API_BASE = "https://api.minepi.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const piApiKey = Deno.env.get("PI_API_KEY");
  if (!piApiKey) {
    return new Response(JSON.stringify({ error: "PI_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { action, paymentId, txid, userId, amount, memo, metadata } = body;

    if (action === "approve") {
      // Approve a payment on Pi server
      const res = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Key ${piApiKey}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      console.log("Payment approved:", data);

      // Track payment in database
      if (userId) {
        await supabase.from("pi_payments").insert({
          user_id: userId,
          payment_id: paymentId,
          amount: amount || 0,
          memo: memo || "",
          status: "approved",
          metadata: metadata || {},
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "complete") {
      // Complete a payment on Pi server
      const res = await fetch(`${PI_API_BASE}/v2/payments/${paymentId}/complete`, {
        method: "POST",
        headers: {
          Authorization: `Key ${piApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txid }),
      });
      const data = await res.json();
      console.log("Payment completed:", data);

      // Update payment status in database
      await supabase
        .from("pi_payments")
        .update({ status: "completed", txid })
        .eq("payment_id", paymentId);

      // If this is an app listing payment, update draft status
      if (metadata?.type === "app_listing" && metadata?.draft_id) {
        await supabase
          .from("app_drafts")
          .update({ payment_status: "paid", payment_id: paymentId })
          .eq("id", metadata.draft_id);
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "cancel") {
      // Update payment status
      if (paymentId) {
        await supabase
          .from("pi_payments")
          .update({ status: "cancelled" })
          .eq("payment_id", paymentId);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Pi payment error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

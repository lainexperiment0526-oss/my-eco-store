import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const apiKey = req.headers.get("x-api-key");
  let apiKeyRecord: any = null;

  if (apiKey) {
    const { data } = await supabase
      .from("app_api_keys")
      .select("*")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .maybeSingle();
    apiKeyRecord = data;

    if (!apiKeyRecord) {
      console.log("Invalid API key");
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("app_api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyRecord.id);
  }

  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const adType = url.searchParams.get("type") || "banner";
      console.log("Serving ad: type=" + adType);

      const { data: ads, error } = await supabase
        .from("ad_campaigns")
        .select("id, media_url, media_type, destination_url, title, description, ad_type, skip_after_seconds, reward_amount")
        .eq("status", "active")
        .eq("ad_type", adType);

      if (error) throw error;

      if (!ads || ads.length === 0) {
        return new Response(JSON.stringify({ ad: null, message: "No ads available" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ad = ads[Math.floor(Math.random() * ads.length)];
      return new Response(JSON.stringify({ ad }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { event, ad_id } = body;

      if (!event || !ad_id) {
        return new Response(JSON.stringify({ error: "Missing event or ad_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const validEvents = ["impression", "click", "reward_complete"];
      if (!validEvents.includes(event)) {
        return new Response(JSON.stringify({ error: "Invalid event type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Track: " + event + " for " + ad_id);

      const { error: eventError } = await supabase
        .from("ad_campaign_events")
        .insert({
          campaign_id: ad_id,
          event_type: event,
          api_key_id: apiKeyRecord?.id || null,
          ip_address: req.headers.get("x-forwarded-for") || "unknown",
          user_agent: req.headers.get("user-agent") || "unknown",
          metadata: body.metadata || {},
        });

      if (eventError) throw eventError;

      const counterField = event === "impression" ? "impressions_count" :
                           event === "click" ? "clicks_count" : "rewards_count";

      const { data: campaign } = await supabase
        .from("ad_campaigns")
        .select(counterField)
        .eq("id", ad_id)
        .maybeSingle();

      if (campaign) {
        const currentCount = (campaign as any)[counterField] || 0;
        await supabase
          .from("ad_campaigns")
          .update({ [counterField]: currentCount + 1 })
          .eq("id", ad_id);
      }

      return new Response(JSON.stringify({ success: true, event }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

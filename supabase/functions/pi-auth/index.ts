import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type PiAuthBody = {
  piUid?: string;
  username?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase env is not configured" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = (await req.json()) as PiAuthBody;
    const piUid = body.piUid?.trim();
    const username = body.username?.trim();

    if (!piUid || !username) {
      return jsonResponse({ error: "Missing piUid or username" }, 400);
    }

    const email = `${piUid}@pi.user`;
    const password = `openapp_pi_auth_${piUid}`;

    let page = 1;
    let existingUser: any = null;

    while (!existingUser) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage: 200,
      });

      if (error) {
        throw error;
      }

      const users = data.users ?? [];
      existingUser = users.find((user) => (user.email ?? "").toLowerCase() === email.toLowerCase()) ?? null;

      if (users.length < 200) break;
      page += 1;
      if (page > 50) break;
    }

    if (existingUser) {
      const userMetadata = {
        ...(existingUser.user_metadata ?? {}),
        pi_uid: piUid,
        pi_username: username,
      };

      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: userMetadata,
      });

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          pi_uid: piUid,
          pi_username: username,
        },
      });

      if (createError) {
        throw createError;
      }
    }

    return jsonResponse({
      success: true,
      email,
      password,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("pi-auth error:", message);
    return jsonResponse({ error: message }, 500);
  }
});

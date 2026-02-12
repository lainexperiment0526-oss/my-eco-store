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

const ADMIN_USERNAMES = new Set(["wain2020"]);

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

    let targetUserId: string;

    if (existingUser) {
      targetUserId = existingUser.id;
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
      const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
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

      if (!createdUser?.user?.id) {
        throw new Error("User creation succeeded but user id is missing");
      }
      targetUserId = createdUser.user.id;
    }

    if (ADMIN_USERNAMES.has(username.toLowerCase())) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: targetUserId, role: "admin" },
          { onConflict: "user_id,role", ignoreDuplicates: true }
        );

      if (roleError) {
        throw roleError;
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

// Standalone MCP server for the OpenApp directory (no build-time bundler deps).
// supabase function: mcp
import { createClient } from "npm:@supabase/supabase-js@2.90.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SERVER_INFO = {
  name: "openapp-mcp",
  title: "OpenApp Directory",
  version: "0.1.0",
};

const INSTRUCTIONS =
  "Public tools for browsing the OpenApp directory: search apps, fetch app details, list categories, and read published blog posts. All data returned is intentionally public.";

const READ_ONLY = { readOnlyHint: true, idempotentHint: true, openWorldHint: false };

const TOOLS = [
  {
    name: "list_apps",
    title: "List apps",
    description:
      "List approved apps in the OpenApp directory. Optionally filter by search text, category id, featured, popular, or pricing model.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Case-insensitive text to match in name or tagline." },
        category_id: { type: "string", format: "uuid", description: "Filter by category UUID." },
        featured: { type: "boolean", description: "Only featured apps." },
        popular: { type: "boolean", description: "Only popular apps." },
        pricing_model: { type: "string", enum: ["free", "paid"] },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_app",
    title: "Get app details",
    description:
      "Fetch full details for a single approved app in the OpenApp directory by its UUID.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", format: "uuid", description: "App UUID." } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "list_categories",
    title: "List categories",
    description: "List all app categories in the OpenApp directory.",
    annotations: READ_ONLY,
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_blog_posts",
    title: "List blog posts",
    description: "List published blog posts from the OpenApp blog.",
    annotations: READ_ONLY,
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Case-insensitive text to match in title." },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
      },
      additionalProperties: false,
    },
  },
];

function ok(payload: unknown, structured?: Record<string, unknown>) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
    structuredContent: structured ?? (payload as Record<string, unknown>),
  };
}

function fail(message: string) {
  return { content: [{ type: "text", text: message }], isError: true };
}

async function callTool(name: string, args: Record<string, any>) {
  const supabase = anonClient();

  if (name === "list_apps") {
    const limit = Math.min(Math.max(Number(args.limit ?? 20), 1), 50);
    let query = supabase
      .from("apps")
      .select(
        "id, name, tagline, description, logo_url, website_url, category_id, tags, is_featured, is_popular, average_rating, ratings_count, views_count, pricing_model, price_amount, developer_name, created_at",
      )
      .eq("status", "approved")
      .order("views_count", { ascending: false })
      .limit(limit);
    if (args.search) query = query.or(`name.ilike.%${args.search}%,tagline.ilike.%${args.search}%`);
    if (args.category_id) query = query.eq("category_id", args.category_id);
    if (args.featured !== undefined) query = query.eq("is_featured", args.featured);
    if (args.popular !== undefined) query = query.eq("is_popular", args.popular);
    if (args.pricing_model) query = query.eq("pricing_model", args.pricing_model);
    const { data, error } = await query;
    if (error) return fail(error.message);
    return ok(data ?? [], { apps: data ?? [] });
  }

  if (name === "get_app") {
    if (!args.id) return fail("Missing required argument: id");
    const { data: app, error } = await supabase
      .from("apps")
      .select("*")
      .eq("id", args.id)
      .eq("status", "approved")
      .maybeSingle();
    if (error) return fail(error.message);
    if (!app) return fail("App not found.");
    const { data: screenshots } = await supabase
      .from("screenshots")
      .select("id, image_url, display_order")
      .eq("app_id", args.id)
      .order("display_order", { ascending: true });
    const payload = { ...app, screenshots: screenshots ?? [] };
    return ok(payload, payload);
  }

  if (name === "list_categories") {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, icon, description")
      .order("name", { ascending: true });
    if (error) return fail(error.message);
    return ok(data ?? [], { categories: data ?? [] });
  }

  if (name === "list_blog_posts") {
    const limit = Math.min(Math.max(Number(args.limit ?? 20), 1), 50);
    let query = supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image_url, published_at, tags")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    if (args.search) query = query.ilike("title", `%${args.search}%`);
    const { data, error } = await query;
    if (error) return fail(error.message);
    return ok(data ?? [], { posts: data ?? [] });
  }

  return fail(`Unknown tool: ${name}`);
}

async function handleRpc(msg: any) {
  const { id, method, params } = msg ?? {};
  const reply = (result: unknown) => ({ jsonrpc: "2.0", id, result });

  switch (method) {
    case "initialize":
      return reply({
        protocolVersion: params?.protocolVersion ?? "2025-06-18",
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    case "ping":
      return reply({});
    case "tools/list":
      return reply({ tools: TOOLS });
    case "tools/call":
      return reply(await callTool(params?.name, params?.arguments ?? {}));
    case "resources/list":
      return reply({ resources: [] });
    case "prompts/list":
      return reply({ prompts: [] });
    default:
      if (typeof method === "string" && method.startsWith("notifications/")) return null;
      return {
        jsonrpc: "2.0",
        id: id ?? null,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method === "GET") {
    return new Response(JSON.stringify({ ...SERVER_INFO, instructions: INSTRUCTIONS, tools: TOOLS.map((t) => t.name) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    if (Array.isArray(body)) {
      const results = (await Promise.all(body.map(handleRpc))).filter(Boolean);
      return new Response(results.length ? JSON.stringify(results) : null, {
        status: results.length ? 200 : 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = await handleRpc(body);
    if (!result) return new Response(null, { status: 202, headers: corsHeaders });
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: String(e) } }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

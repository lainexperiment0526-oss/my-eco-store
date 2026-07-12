declare const process: { env: Record<string, string | undefined> };
import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

function anonClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export default defineTool({
  name: "list_apps",
  title: "List apps",
  description:
    "List approved apps in the OpenApp directory. Optionally filter by search text, category id, featured, popular, or pricing model.",
  inputSchema: {
    search: z.string().optional().describe("Case-insensitive text to match in name or tagline."),
    category_id: z.string().uuid().optional().describe("Filter by category UUID."),
    featured: z.boolean().optional().describe("Only featured apps."),
    popular: z.boolean().optional().describe("Only popular apps."),
    pricing_model: z.enum(["free", "paid"]).optional(),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, category_id, featured, popular, pricing_model, limit }) => {
    let query = anonClient()
      .from("apps")
      .select(
        "id, name, tagline, description, logo_url, website_url, category_id, tags, is_featured, is_popular, average_rating, ratings_count, views_count, pricing_model, price_amount, developer_name, created_at",
      )
      .eq("status", "approved")
      .order("views_count", { ascending: false })
      .limit(limit);

    if (search) query = query.or(`name.ilike.%${search}%,tagline.ilike.%${search}%`);
    if (category_id) query = query.eq("category_id", category_id);
    if (featured !== undefined) query = query.eq("is_featured", featured);
    if (popular !== undefined) query = query.eq("is_popular", popular);
    if (pricing_model) query = query.eq("pricing_model", pricing_model);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { apps: data ?? [] },
    };
  },
});

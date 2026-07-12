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
  name: "list_blog_posts",
  title: "List blog posts",
  description: "List published blog posts from the OpenApp blog.",
  inputSchema: {
    search: z.string().optional().describe("Case-insensitive text to match in title."),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }) => {
    let query = anonClient()
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_image_url, published_at, tags")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    if (search) query = query.ilike("title", `%${search}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { posts: data ?? [] },
    };
  },
});

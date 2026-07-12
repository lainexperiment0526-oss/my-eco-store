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
  name: "get_app",
  title: "Get app details",
  description:
    "Fetch full details for a single approved app in the OpenApp directory by its UUID.",
  inputSchema: {
    id: z.string().uuid().describe("App UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const supabase = anonClient();
    const { data: app, error } = await supabase
      .from("apps")
      .select("*")
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!app) return { content: [{ type: "text", text: "App not found." }], isError: true };

    const { data: screenshots } = await supabase
      .from("screenshots")
      .select("id, image_url, display_order")
      .eq("app_id", id)
      .order("display_order", { ascending: true });

    const payload = { ...app, screenshots: screenshots ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});

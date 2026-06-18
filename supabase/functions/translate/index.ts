// Translate batches of strings using Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANG_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
  pt: "Portuguese", ru: "Russian", ja: "Japanese", ko: "Korean", "zh-CN": "Simplified Chinese",
  "zh-TW": "Traditional Chinese", ar: "Arabic", hi: "Hindi", bn: "Bengali", ur: "Urdu",
  tr: "Turkish", nl: "Dutch", pl: "Polish", vi: "Vietnamese", th: "Thai",
  id: "Indonesian", ms: "Malay", fa: "Persian", he: "Hebrew", sv: "Swedish",
  no: "Norwegian", da: "Danish", fi: "Finnish", cs: "Czech", el: "Greek",
  ro: "Romanian", hu: "Hungarian", uk: "Ukrainian", tl: "Tagalog", sw: "Swahili",
  ta: "Tamil", te: "Telugu", ml: "Malayalam", mr: "Marathi", gu: "Gujarati",
  pa: "Punjabi", ne: "Nepali", si: "Sinhala", my: "Myanmar", km: "Khmer",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { texts, target } = await req.json();
    if (!Array.isArray(texts) || !target || target === "en") {
      return new Response(JSON.stringify({ translations: texts || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetName = LANG_NAMES[target] || target;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const numbered = texts.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n");
    const prompt = `Translate each numbered line from English to ${targetName}. Preserve numbering. Keep proper nouns (OpenApp, Pi Network) unchanged. Return ONLY a JSON array of strings in the same order, no extra text.\n\n${numbered}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a precise translator. Output only a JSON array of translated strings." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("AI gateway error", res.status, errText);
      return new Response(JSON.stringify({ translations: texts, error: errText }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? "[]";
    const match = content.match(/\[[\s\S]*\]/);
    let translations: string[] = texts;
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length === texts.length) {
          translations = parsed.map((s: unknown) => String(s));
        }
      } catch (e) {
        console.error("parse error", e);
      }
    }

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

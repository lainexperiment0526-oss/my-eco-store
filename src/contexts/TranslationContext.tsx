import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ur", label: "اردو" },
  { code: "tr", label: "Türkçe" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" },
  { code: "id", label: "Indonesia" },
  { code: "ms", label: "Melayu" },
  { code: "fa", label: "فارسی" },
  { code: "he", label: "עברית" },
  { code: "sv", label: "Svenska" },
  { code: "no", label: "Norsk" },
  { code: "da", label: "Dansk" },
  { code: "fi", label: "Suomi" },
  { code: "cs", label: "Čeština" },
  { code: "el", label: "Ελληνικά" },
  { code: "ro", label: "Română" },
  { code: "hu", label: "Magyar" },
  { code: "uk", label: "Українська" },
  { code: "tl", label: "Tagalog" },
  { code: "sw", label: "Kiswahili" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "ml", label: "മലയാളം" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
];

const STORAGE_KEY = "openapp_language";
const CACHE_KEY_PREFIX = "openapp_tr_cache_";
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT"]);

interface TranslationCtx {
  language: string;
  setLanguage: (code: string) => void;
  translating: boolean;
}

const Ctx = createContext<TranslationCtx>({
  language: "en",
  setLanguage: () => {},
  translating: false,
});

export const useTranslation = () => useContext(Ctx);

function loadCache(lang: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + lang);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(lang: string, cache: Record<string, string>) {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + lang, JSON.stringify(cache));
  } catch {
    /* ignore quota */
  }
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => localStorage.getItem(STORAGE_KEY) || "en");
  const [translating, setTranslating] = useState(false);
  const originals = useRef<WeakMap<Text, string>>(new WeakMap());
  const observerRef = useRef<MutationObserver | null>(null);
  const pendingRef = useRef<Set<Text>>(new Set());
  const scheduleRef = useRef<number | null>(null);

  const collectTextNodes = useCallback((root: Node, out: Text[]) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
        const text = node.nodeValue?.trim();
        if (!text) return NodeFilter.FILTER_REJECT;
        if (!/[A-Za-z]/.test(text)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let n: Node | null;
    while ((n = walker.nextNode())) out.push(n as Text);
  }, []);

  const restoreAll = useCallback(() => {
    const nodes: Text[] = [];
    collectTextNodes(document.body, nodes);
    nodes.forEach((node) => {
      const orig = originals.current.get(node);
      if (orig != null) node.nodeValue = orig;
    });
  }, [collectTextNodes]);

  const translateNodes = useCallback(
    async (nodes: Text[], lang: string) => {
      if (lang === "en" || nodes.length === 0) return;
      const cache = loadCache(lang);

      // record originals + collect texts needing translation
      const needTexts: string[] = [];
      const needKey = new Set<string>();
      const nodeKeys = nodes.map((node) => {
        let orig = originals.current.get(node);
        if (orig == null) {
          orig = node.nodeValue ?? "";
          originals.current.set(node, orig);
        }
        const key = orig.trim();
        if (key && !cache[key] && !needKey.has(key)) {
          needKey.add(key);
          needTexts.push(key);
        }
        return key;
      });

      if (needTexts.length > 0) {
        setTranslating(true);
        try {
          // batch in chunks of 40
          for (let i = 0; i < needTexts.length; i += 40) {
            const batch = needTexts.slice(i, i + 40);
            const { data, error } = await supabase.functions.invoke("translate", {
              body: { texts: batch, target: lang },
            });
            if (!error && data?.translations) {
              batch.forEach((src, idx) => {
                cache[src] = data.translations[idx] ?? src;
              });
              saveCache(lang, cache);
            }
          }
        } catch (e) {
          console.error("translate error", e);
        } finally {
          setTranslating(false);
        }
      }

      // apply
      nodes.forEach((node, idx) => {
        const key = nodeKeys[idx];
        const orig = originals.current.get(node) ?? node.nodeValue ?? "";
        const translated = cache[key];
        if (translated) {
          // preserve leading/trailing whitespace
          const leading = orig.match(/^\s*/)?.[0] ?? "";
          const trailing = orig.match(/\s*$/)?.[0] ?? "";
          node.nodeValue = leading + translated + trailing;
        }
      });
    },
    [],
  );

  const flushPending = useCallback(() => {
    scheduleRef.current = null;
    const nodes = Array.from(pendingRef.current);
    pendingRef.current.clear();
    if (nodes.length === 0) return;
    void translateNodes(nodes, language);
  }, [language, translateNodes]);

  const schedule = useCallback(() => {
    if (scheduleRef.current != null) return;
    scheduleRef.current = window.setTimeout(flushPending, 250);
  }, [flushPending]);

  // initial + language change
  useEffect(() => {
    document.documentElement.lang = language;
    if (language === "en") {
      restoreAll();
      return;
    }
    const nodes: Text[] = [];
    collectTextNodes(document.body, nodes);
    void translateNodes(nodes, language);
  }, [language, collectTextNodes, translateNodes, restoreAll]);

  // mutation observer for dynamic content
  useEffect(() => {
    const obs = new MutationObserver((muts) => {
      if (language === "en") return;
      muts.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const t = node as Text;
            if (t.nodeValue && /[A-Za-z]/.test(t.nodeValue)) pendingRef.current.add(t);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const arr: Text[] = [];
            collectTextNodes(node, arr);
            arr.forEach((n) => pendingRef.current.add(n));
          }
        });
        if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
          pendingRef.current.add(m.target as Text);
        }
      });
      if (pendingRef.current.size > 0) schedule();
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    observerRef.current = obs;
    return () => obs.disconnect();
  }, [language, collectTextNodes, schedule]);

  const setLanguage = useCallback((code: string) => {
    localStorage.setItem(STORAGE_KEY, code);
    setLanguageState(code);
  }, []);

  const value = useMemo(() => ({ language, setLanguage, translating }), [language, setLanguage, translating]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

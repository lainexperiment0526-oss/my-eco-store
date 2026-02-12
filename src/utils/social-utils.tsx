import { Link as LinkIcon, Mail, Phone } from "lucide-react";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaGlobe,
  FaLinkedin,
  FaTiktok,
  FaTwitch,
  FaXTwitter,
  FaSnapchat,
  FaDiscord,
  FaTelegram,
  FaWhatsapp,
  FaReddit,
  FaPinterest,
  FaGithub,
  FaSpotify,
  FaSoundcloud,
  FaPatreon,
  FaMedium,
  FaBehance,
  FaDribbble,
  FaEtsy,
  FaAmazon,
  FaShopify,
  FaStackOverflow,
  FaBandcamp,
  FaApple,
  FaVimeo,
} from "react-icons/fa6";
import {
  SiThreads,
  SiBluesky,
  SiMastodon,
  SiKick,
  SiGitlab,
  SiDeviantart,
  SiSubstack,
  SiOnlyfans,
  SiClubhouse,
  SiLinktree,
  SiSlack,
} from "react-icons/si";
import { SOCIAL_PLATFORMS } from "@/config/socialPlatforms";

export const normalizePlatformId = (platform?: string) => {
  if (!platform) return "";
  return String(platform).toLowerCase().replace(/[.@]/g, "");
};

export const getSocialPlatformMeta = (platform?: string) => {
  const id = normalizePlatformId(platform);
  return SOCIAL_PLATFORMS.find((p) => p.id === id);
};

export const getSocialLabel = (platform?: string) => {
  return getSocialPlatformMeta(platform)?.name || platform || "Link";
};

export const getSocialIcon = (platform?: string, className = "w-5 h-5") => {
  const id = normalizePlatformId(platform);
  switch (id) {
    case "dropshare":
      return <FaGlobe className={className} />;
    case "instagram":
      return <FaInstagram className={className} />;
    case "twitter":
    case "x":
      return <FaXTwitter className={className} />;
    case "facebook":
      return <FaFacebook className={className} />;
    case "snapchat":
      return <FaSnapchat className={className} />;
    case "threads":
      return <SiThreads className={className} />;
    case "bluesky":
      return <SiBluesky className={className} />;
    case "mastodon":
      return <SiMastodon className={className} />;
    case "reddit":
      return <FaReddit className={className} />;
    case "clubhouse":
      return <SiClubhouse className={className} />;
    case "linkedin":
      return <FaLinkedin className={className} />;
    case "github":
      return <FaGithub className={className} />;
    case "gitlab":
      return <SiGitlab className={className} />;
    case "stackoverflow":
      return <FaStackOverflow className={className} />;
    case "youtube":
      return <FaYoutube className={className} />;
    case "tiktok":
      return <FaTiktok className={className} />;
    case "twitch":
      return <FaTwitch className={className} />;
    case "kick":
      return <SiKick className={className} />;
    case "vimeo":
      return <FaVimeo className={className} />;
    case "pinterest":
      return <FaPinterest className={className} />;
    case "whatsapp":
      return <FaWhatsapp className={className} />;
    case "telegram":
      return <FaTelegram className={className} />;
    case "discord":
      return <FaDiscord className={className} />;
    case "slack":
      return <SiSlack className={className} />;
    case "behance":
      return <FaBehance className={className} />;
    case "dribbble":
      return <FaDribbble className={className} />;
    case "deviantart":
      return <SiDeviantart className={className} />;
    case "spotify":
      return <FaSpotify className={className} />;
    case "soundcloud":
      return <FaSoundcloud className={className} />;
    case "applemusic":
      return <FaApple className={className} />;
    case "bandcamp":
      return <FaBandcamp className={className} />;
    case "patreon":
      return <FaPatreon className={className} />;
    case "onlyfans":
      return <SiOnlyfans className={className} />;
    case "substack":
      return <SiSubstack className={className} />;
    case "medium":
      return <FaMedium className={className} />;
    case "etsy":
      return <FaEtsy className={className} />;
    case "shopify":
      return <FaShopify className={className} />;
    case "amazon":
      return <FaAmazon className={className} />;
    case "linktree":
      return <SiLinktree className={className} />;
    case "website":
      return <FaGlobe className={className} />;
    case "email":
      return <Mail className={className} />;
    case "phone":
      return <Phone className={className} />;
    default:
      return <LinkIcon className={className} />;
  }
};

export const isDisplayableSocialUrl = (url?: string | null) => {
  if (!url) return false;
  const trimmed = String(url).trim();
  return /^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed);
};

const cleanHandle = (value: string) => value.replace(/^@/, "").replace(/\/+$/, "");

export const extractSocialUsername = (platform?: string, url?: string | null) => {
  if (!url) return "";
  const trimmed = String(url).trim();

  if (/^mailto:/i.test(trimmed)) {
    return cleanHandle(trimmed.replace(/^mailto:/i, "").split("?")[0] || "");
  }

  if (/^tel:/i.test(trimmed)) {
    return cleanHandle(trimmed.replace(/^tel:/i, "").split("?")[0] || "");
  }

  const fallback = () => {
    let raw = trimmed.replace(/^https?:\/\//i, "");
    raw = raw.replace(/^www\./i, "");
    raw = raw.split("?")[0] || "";
    const parts = raw.split("/").filter(Boolean);
    if (parts.length === 0) return "";
    let handle = parts[parts.length - 1];
    const prev = parts[parts.length - 2] || "";
    if (["profile", "user", "users", "channel", "c", "in", "add"].includes(prev)) {
      handle = parts[parts.length - 1];
    }
    return cleanHandle(handle);
  };

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const path = parsed.pathname || "";
    const segments = path.split("/").filter(Boolean);
    if (segments.length === 0) return "";

    let handle = segments[segments.length - 1];
    const first = segments[0];
    if (["profile", "user", "users", "channel", "c", "in", "add"].includes(first) && segments.length > 1) {
      handle = segments[1];
    }

    if (handle === "@" && segments.length > 1) {
      handle = segments[1];
    }

    return cleanHandle(handle);
  } catch (e) {
    return fallback();
  }
};

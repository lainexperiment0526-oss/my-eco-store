import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeExternalUrl(url?: string | null) {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (/^[\w.-]+\.[a-z]{2,}([/:?#]|$)/i.test(trimmed)) return `https://${trimmed}`;
  return `https://${trimmed}`;
}

export function openExternalTopLevel(url?: string | null) {
  const target = normalizeExternalUrl(url);
  if (!target) return false;

  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = target;
      return true;
    }
  } catch {
    try {
      const opened = window.open(target, '_top', 'noopener,noreferrer');
      if (opened) return true;
    } catch {
      // Continue to same-window fallback below.
    }
  }

  try {
    window.location.replace(target);
  } catch {
    window.location.href = target;
  }
  return true;
}

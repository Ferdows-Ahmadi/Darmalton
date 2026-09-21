import type { Locale } from "./locale";

// CMS has English and Dari fields only. Fallbacks preserve source content;
// Pashto content/schema work is required before its rollout.
export function cmsText(english: string, dari: string, locale: Locale) {
  return locale === "fa-AF" ? dari || english : english || dari;
}

import type { MetadataRoute } from "next";

import { APP_CONFIG } from "@/config/app-config";
import { LOCALES } from "@/i18n/config";
import { PAGE_KEYS, pagePath } from "@/i18n/dictionary";

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    PAGE_KEYS.map((page) => ({ url: new URL(pagePath(locale, page), APP_CONFIG.url).href })),
  );
}

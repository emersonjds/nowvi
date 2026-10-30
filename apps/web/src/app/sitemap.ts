import type { MetadataRoute } from "next";

import { APP_CONFIG } from "@/config/app-config";
import { LOCALES } from "@/i18n/config";
import { languageAlternates, PAGE_KEYS, pagePath } from "@/i18n/dictionary";

const absolute = (path: string) => new URL(path, APP_CONFIG.url).href;

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    PAGE_KEYS.map((page) => ({
      url: absolute(pagePath(locale, page)),
      alternates: {
        languages: Object.fromEntries(
          Object.entries(languageAlternates(page)).map(([language, path]) => [language, absolute(path)]),
        ),
      },
    })),
  );
}

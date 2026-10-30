import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/config/app-config";
import { LOCALES } from "@/i18n/config";
import { languageAlternates, PAGE_KEYS, pagePath } from "@/i18n/dictionary";

// Date of the last copy change on any page: bump it with the dictionaries, never per build.
const CONTENT_UPDATED_AT = "2026-10-30";

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    PAGE_KEYS.map((page) => ({
      url: absoluteUrl(pagePath(locale, page)),
      lastModified: CONTENT_UPDATED_AT,
      alternates: {
        languages: Object.fromEntries(
          Object.entries(languageAlternates(page)).map(([language, path]) => [language, absoluteUrl(path)]),
        ),
      },
    })),
  );
}

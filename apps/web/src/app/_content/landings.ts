import type { Metadata } from "next";

import { APP_CONFIG } from "@/config/app-config";
import { LOCALE_INFO, type Locale } from "@/i18n/config";
import { languageAlternates, type PageKey, pageContent, pagePath } from "@/i18n/dictionary";

export type Step = { title: string; text?: string };
export type Question = { question: string; answer: string };

// The root opengraph-image is dropped once a nested page sets its own openGraph.
const OG_IMAGE = "/opengraph-image";

export const pageMetadata = (locale: Locale, page: PageKey): Metadata => {
  const { title, description } = pageContent(locale, page);
  const path = pagePath(locale, page);
  return {
    title,
    description,
    alternates: { canonical: path, languages: languageAlternates(page) },
    openGraph: {
      type: "website",
      siteName: APP_CONFIG.name,
      locale: LOCALE_INFO[locale].ogLocale,
      url: path,
      title,
      description,
      images: OG_IMAGE,
    },
    twitter: { card: "summary_large_image", title, description, images: OG_IMAGE },
  };
};

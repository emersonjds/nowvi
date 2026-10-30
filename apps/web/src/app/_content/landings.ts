import type { Metadata } from "next";

import { APP_CONFIG } from "@/config/app-config";
import { LOCALE_INFO, type Locale } from "@/i18n/config";
import { languageAlternates, type PageKey, pageContent, pagePath } from "@/i18n/dictionary";

export type Step = { title: string; text?: string };
export type Question = { question: string; answer: string };

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

export const pageMetadata = (locale: Locale, page: PageKey): Metadata => {
  const { title, description, heading } = pageContent(locale, page);
  const path = pagePath(locale, page);
  const images = [{ url: `${path}/opengraph-image`, ...OG_IMAGE_SIZE, alt: heading, type: "image/png" }];
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
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
};

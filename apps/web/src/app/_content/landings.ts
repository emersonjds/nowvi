import type { Metadata } from "next";

import { APP_CONFIG } from "@/config/app-config";
import type { Dictionary } from "@/i18n/dictionaries/pt-br";

export type Step = { title: string; text?: string };
export type Question = { question: string; answer: string };

export type LandingId = keyof Dictionary["landings"];
export type PageKey = "home" | LandingId;

// Keep in sync with `landings` in the dictionaries; an id back from `pausedLandings` goes here too.
export const LANDING_IDS = ["tiktok", "x", "facebook"] as const satisfies readonly LandingId[];

export const pageContent = (dictionary: Dictionary, page: PageKey) =>
  page === "home" ? dictionary.home : dictionary.landings[page];

export const pagePath = (dictionary: Dictionary, page: PageKey) =>
  page === "home" ? "/" : `/${dictionary.landings[page].slug}`;

// The root opengraph-image is dropped once a nested page sets its own openGraph.
const OG_IMAGE = "/opengraph-image";

export const pageMetadata = (dictionary: Dictionary, page: PageKey): Metadata => {
  const { title, description } = pageContent(dictionary, page);
  const path = pagePath(dictionary, page);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: APP_CONFIG.name,
      locale: "pt_BR",
      url: path,
      title,
      description,
      images: OG_IMAGE,
    },
    twitter: { card: "summary_large_image", title, description, images: OG_IMAGE },
  };
};

import { notFound } from "next/navigation";

import { isLocale, LOCALE_INFO, LOCALES, type Locale } from "./config";
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { id } from "./dictionaries/id";
import { type Dictionary, ptBr } from "./dictionaries/pt-br";

const DICTIONARIES: Record<Locale, Dictionary> = { "pt-br": ptBr, en, es, id };

export const getDictionary = (locale: Locale) => DICTIONARIES[locale];

export const resolveLocale = async (params: Promise<{ lang: string }>) => {
  const { lang } = await params;
  return isLocale(lang) ? lang : notFound();
};

export type LandingId = keyof Dictionary["landings"];
export type PageKey = "home" | LandingId;

// Keep in sync with `landings` in the dictionaries; an id back from `pausedLandings` goes here too.
export const LANDING_IDS = ["tiktok", "x", "facebook"] as const satisfies readonly LandingId[];

export const PAGE_KEYS: readonly PageKey[] = ["home", ...LANDING_IDS];

export const pageContent = (locale: Locale, page: PageKey) =>
  page === "home" ? DICTIONARIES[locale].home : DICTIONARIES[locale].landings[page];

export const pagePath = (locale: Locale, page: PageKey) =>
  page === "home" ? `/${locale}` : `/${locale}/${DICTIONARIES[locale].landings[page].slug}`;

export const languageAlternates = (page: PageKey) => ({
  ...Object.fromEntries(LOCALES.map((locale) => [LOCALE_INFO[locale].htmlLang, pagePath(locale, page)])),
  "x-default": pagePath("en", page),
});

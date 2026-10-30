import { type NextRequest, NextResponse } from "next/server";

import { isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { getDictionary, LANDING_IDS, pagePath } from "@/i18n/dictionary";

// Googlebot, Bingbot, GPTBot, ClaudeBot and PerplexityBot all contain "bot".
const BOT_PATTERN = /bot|crawler|spider/i;

const LANGUAGE_TO_LOCALE: Partial<Record<string, Locale>> = { pt: "pt-br", es: "es", id: "id", in: "id", en: "en" };

const parseLanguageRange = (range: string) => {
  const [tag = "", ...parameters] = range.trim().toLowerCase().split(";");
  const quality = parameters.map((parameter) => parameter.trim()).find((parameter) => parameter.startsWith("q="));
  return { language: tag.split("-")[0] ?? "", quality: quality ? Number(quality.slice(2)) : 1 };
};

const fromAcceptLanguage = (header: string | null): Locale => {
  const preferred = (header ?? "")
    .split(",")
    .map(parseLanguageRange)
    .filter(({ quality }) => quality > 0)
    .sort((left, right) => right.quality - left.quality);
  for (const { language } of preferred) {
    const locale = LANGUAGE_TO_LOCALE[language];
    if (locale) return locale;
  }
  return "en";
};

const legacyLanding = (pathname: string) =>
  LANDING_IDS.find((id) => pathname === `/${getDictionary("pt-br").landings[id].slug}`);

export const proxy = (request: NextRequest) => {
  const landing = legacyLanding(request.nextUrl.pathname);
  const url = request.nextUrl.clone();

  if (BOT_PATTERN.test(request.headers.get("user-agent") ?? "")) {
    url.pathname = landing ? pagePath("pt-br", landing) : pagePath("en", "home");
    return NextResponse.redirect(url, 308);
  }

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookie) ? cookie : fromAcceptLanguage(request.headers.get("accept-language"));
  url.pathname = pagePath(locale, landing ?? "home");
  const response = NextResponse.redirect(url, 307);
  response.headers.set("Vary", "Accept-Language, Cookie, User-Agent");
  return response;
};

// Only the root and the pre-i18n pt-BR landings get detection; locale-prefixed pages, assets and metadata files skip it.
export const config = {
  matcher: ["/", "/baixar-video-tiktok", "/baixar-video-x", "/baixar-video-facebook"],
};

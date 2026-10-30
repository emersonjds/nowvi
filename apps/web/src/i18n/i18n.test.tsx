import { NextRequest } from "next/server";

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { proxy } from "@/proxy";

import { fill, useDictionary } from "./client";
import { isLocale, LOCALES } from "./config";
import { getDictionary, landingBySlug, languageAlternates, pageContent, pagePath, resolveLocale } from "./dictionary";

const textLeaves = (value: unknown, path: string): [string, unknown][] =>
  typeof value === "object" && value !== null
    ? Object.entries(value).flatMap(([key, child]) => textLeaves(child, `${path}.${key}`))
    : [[path, value]];

/** The polite live region stays quiet while the countdown runs. */
const SILENT_ANNOUNCEMENT = "client.waiting.announcements.waiting";

describe("dictionaries", () => {
  it.each(LOCALES)("%s has no empty text", (locale) => {
    const emptyTexts = textLeaves(getDictionary(locale), locale).filter(([, text]) => text === "");

    expect(emptyTexts).toEqual([[`${locale}.${SILENT_ANNOUNCEMENT}`, ""]]);
  });
});

describe("pagePath", () => {
  it("puts the home page at the locale root", () => {
    expect(pagePath("pt-br", "home")).toBe("/pt-br");
  });

  it.each([
    ["pt-br", "tiktok", "/pt-br/baixar-video-tiktok"],
    ["pt-br", "x", "/pt-br/baixar-video-x"],
    ["en", "x", "/en/twitter-video-downloader"],
    ["es", "x", "/es/descargar-video-twitter"],
    ["id", "x", "/id/download-video-twitter"],
    ["es", "facebook", "/es/descargar-video-facebook"],
  ] as const)("builds the %s %s landing path", (locale, page, path) => {
    expect(pagePath(locale, page)).toBe(path);
  });

  it("points every language alternate at the same landing", () => {
    expect(languageAlternates("x")).toEqual({
      "pt-BR": "/pt-br/baixar-video-x",
      en: "/en/twitter-video-downloader",
      es: "/es/descargar-video-twitter",
      id: "/id/download-video-twitter",
      "x-default": "/en/twitter-video-downloader",
    });
  });
});

describe("pageContent", () => {
  it("reads the home copy and the landing copy", () => {
    expect(pageContent("pt-br", "home").heading).toBe("Baixe vídeos de qualquer rede, num lugar só.");
    expect(pageContent("pt-br", "facebook").heading).toBe("Baixar vídeo do Facebook");
  });
});

describe("landingBySlug", () => {
  it("finds the landing behind a locale's slug", () => {
    expect(landingBySlug("es", "descargar-video-twitter")).toBe("x");
  });

  it("answers 404 for a slug of another locale", () => {
    expect(() => landingBySlug("en", "baixar-video-x")).toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});

describe("resolveLocale", () => {
  it("accepts a known locale", async () => {
    await expect(resolveLocale(Promise.resolve({ lang: "es" }))).resolves.toBe("es");
  });

  it("answers 404 for an unknown locale", async () => {
    await expect(resolveLocale(Promise.resolve({ lang: "fr" }))).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});

describe("isLocale", () => {
  it("accepts only the four locales", () => {
    expect(["pt-br", "en", "es", "id", "pt", undefined].map(isLocale)).toEqual([true, true, true, true, false, false]);
  });
});

describe("fill", () => {
  it("replaces known placeholders and keeps unknown ones", () => {
    expect(fill("Baixar grátis ({quality}) em {ext}", { quality: "480p" })).toBe("Baixar grátis (480p) em {ext}");
  });
});

describe("useDictionary", () => {
  it("fails loudly outside a DictionaryProvider", () => {
    expect(() => renderHook(() => useDictionary())).toThrow("useDictionary needs a DictionaryProvider");
  });
});

describe("proxy", () => {
  const detect = (userAgent: string) =>
    proxy(new NextRequest("https://nowvi.test/", { headers: { "user-agent": userAgent, "accept-language": "es" } }));

  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
    "Mozilla/5.0 (compatible; YandexBot/3.0)",
  ])("sends the crawler %s to the English home for good", (userAgent) => {
    const response = detect(userAgent);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://nowvi.test/en");
    expect(response.headers.get("vary")).toBe("Accept-Language, Cookie, User-Agent");
  });

  it("treats a CUBOT phone as a person", () => {
    const response = detect("Mozilla/5.0 (Linux; Android 10; CUBOT X30) AppleWebKit/537.36 Mobile Safari/537.36");

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://nowvi.test/es");
  });
});

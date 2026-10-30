import { describe, expect, it } from "vitest";

import { LOCALES } from "@/i18n/config";
import { PAGE_KEYS } from "@/i18n/dictionary";

import { pageMetadata } from "./_content/landings";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("lists exactly the canonical URL of every page", () => {
    const canonicals = LOCALES.flatMap((locale) =>
      PAGE_KEYS.map(
        (page) => new URL(String(pageMetadata(locale, page).alternates?.canonical), "https://nowvi.test").href,
      ),
    );

    expect(sitemap().map((entry) => entry.url)).toEqual(canonicals);
    expect(canonicals).toHaveLength(16);
    expect(canonicals).toContain("https://nowvi.test/id/download-video-twitter");
  });

  it("stamps every URL with the same content date, not the build time", () => {
    expect(new Set(sitemap().map((entry) => entry.lastModified))).toEqual(new Set(["2026-10-30"]));
  });

  it("carries the hreflang alternates with x-default", () => {
    expect(sitemap()[0]?.alternates?.languages).toEqual({
      "pt-BR": "https://nowvi.test/pt-br",
      en: "https://nowvi.test/en",
      es: "https://nowvi.test/es",
      id: "https://nowvi.test/id",
      "x-default": "https://nowvi.test/en",
    });
  });
});

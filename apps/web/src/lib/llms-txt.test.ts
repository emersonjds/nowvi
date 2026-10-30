import { describe, expect, it } from "vitest";

import { LOCALES } from "@/i18n/config";
import { getDictionary, LANDING_IDS } from "@/i18n/dictionary";

import { llmsFullTxt, llmsTxt, textResponse } from "./llms-txt";

describe("llmsTxt", () => {
  it("opens with the H1, the blockquote and the summary, as llmstxt.org asks", () => {
    expect(llmsTxt("en").split("\n").slice(0, 5)).toEqual([
      "# Nowvi",
      "",
      "> Download TikTok, X and Facebook videos without watermark and without sign-up. Free up to 720p, and nothing is stored on our servers.",
      "",
      "Save TikTok videos, X posts and Facebook videos to your phone in seconds.",
    ]);
  });

  it("links every page of the locale on the build's domain", () => {
    expect(llmsTxt("en")).toContain(
      "## Pages\n\n" + "- [Download videos from any app, all in one place.](https://nowvi.test/en): ",
    );
    expect(llmsTxt("en")).toContain(
      "- [TikTok video downloader without watermark](https://nowvi.test/en/tiktok-video-downloader): " +
        "Download TikTok videos as MP4 without the watermark and without sign-up. Free up to 720p.",
    );
  });

  it("speaks the locale's language", () => {
    expect(llmsTxt("pt-br")).toContain("## Páginas\n\n");
    expect(llmsTxt("pt-br")).toContain("](https://nowvi.test/pt-br/baixar-video-tiktok): ");
  });

  it("links the llms.txt of every locale and the full text", () => {
    const text = llmsTxt("es");

    expect(text).toContain(
      "## Idiomas\n\n" +
        "- [Português](https://nowvi.test/pt-br/llms.txt)\n" +
        "- [English](https://nowvi.test/en/llms.txt)\n" +
        "- [Español](https://nowvi.test/es/llms.txt)\n" +
        "- [Bahasa Indonesia](https://nowvi.test/id/llms.txt)\n",
    );
    expect(text).toContain("## Optional\n\n- [llms-full.txt](https://nowvi.test/llms-full.txt): ");
  });

  it.each(LOCALES)("hardcodes no other domain in %s", (locale) => {
    expect(
      llmsTxt(locale)
        .match(/https?:\/\/[^/)\s]+/g)
        ?.every((origin) => origin === "https://nowvi.test"),
    ).toBe(true);
  });
});

describe("llmsFullTxt", () => {
  it("carries every FAQ answer of every page in every locale", () => {
    const text = llmsFullTxt();
    const answers = LOCALES.flatMap((locale) => {
      const dictionary = getDictionary(locale);
      return [dictionary.home, ...LANDING_IDS.map((id) => dictionary.landings[id])].flatMap((page) =>
        page.faq.map(({ answer }) => answer),
      );
    });

    expect(answers.length).toBeGreaterThan(60);
    expect(answers.filter((answer) => !text.includes(answer))).toEqual([]);
  });

  it("files each answer under its question and its page", () => {
    expect(llmsFullTxt()).toContain(
      "### [Baixar vídeo do TikTok sem marca d'água](https://nowvi.test/pt-br/baixar-video-tiktok)\n\n" +
        "Baixe vídeos do TikTok em MP4 sem a marca d'água do app e sem cadastro. Grátis até 720p; Full HD por R$ 2 no Pix.\n\n" +
        "#### O Nowvi remove a marca d'água do TikTok?\n\n" +
        "Sim. O vídeo sai sem o logo e sem o @ flutuante.\n",
    );
  });

  it("has a single H1", () => {
    expect(llmsFullTxt().match(/^# /gm)).toHaveLength(1);
  });
});

describe("textResponse", () => {
  it("serves UTF-8 plain text kept out of the search index", async () => {
    const response = textResponse("# Nowvi");

    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
    await expect(response.text()).resolves.toBe("# Nowvi");
  });
});

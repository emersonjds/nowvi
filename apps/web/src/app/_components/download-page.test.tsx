import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { renderPage } from "@/test/render-page";

const jsonLdSchema = z.object({
  "@type": z.string(),
  "@id": z.string().optional(),
  inLanguage: z.string().optional(),
  logo: z.string().optional(),
  sameAs: z.array(z.string()).optional(),
  publisher: z.object({ "@id": z.string() }).optional(),
  step: z.array(z.object({ name: z.string().optional(), text: z.string() })).optional(),
  offers: z.array(z.object({ name: z.string(), price: z.string(), priceCurrency: z.string().optional() })).optional(),
  itemListElement: z.array(z.object({ position: z.number(), name: z.string(), item: z.string() })).optional(),
  mainEntity: z.array(z.object({ acceptedAnswer: z.object({ text: z.string() }) })).optional(),
});

const structuredDataScripts = () =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((script) => script.textContent ?? "");

const structuredData = (type: string) =>
  structuredDataScripts()
    .map((text) => jsonLdSchema.parse(JSON.parse(text)))
    .find((schema) => schema["@type"] === type);

const ORGANIZATION_ID = "https://nowvi.test/#organization";

describe("DownloadPage", () => {
  it("links a landing back to all networks and to the other landings", () => {
    renderPage("pt-br", "x");

    const networks = within(screen.getByRole("navigation", { name: "Baixar de uma rede específica" }));

    expect(networks.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/pt-br",
      "/pt-br/baixar-video-tiktok",
      "/pt-br/baixar-video-facebook",
    ]);
  });

  it("renders every FAQ answer closed, in the markup, matching the FAQPage data", () => {
    renderPage("pt-br", "tiktok");

    const answers = structuredData("FAQPage")?.mainEntity?.map((question) => question.acceptedAnswer.text) ?? [];

    expect(answers).toHaveLength(4);
    for (const answer of answers) {
      const details = screen.getByText(answer).closest("details");
      expect(details).not.toBeNull();
      expect(details?.open).toBe(false);
    }
  });

  it("uses the step title as the HowTo text when the step has none", () => {
    renderPage("pt-br", "x");

    expect(structuredData("HowTo")?.step?.map((step) => step.text)).toEqual([
      "Abra o post e toque em compartilhar, abaixo do post.",
      'Toque em "Copiar link".',
      'Cole o link no Nowvi e toque em "Baixar Agora".',
    ]);
    expect(structuredData("HowTo")?.step?.every((step) => step.name === undefined)).toBe(true);
  });

  it("keeps the HowTo step name apart from its text", () => {
    renderPage("pt-br", "home");

    expect(structuredData("HowTo")?.step?.[0]).toEqual({
      name: "Copie o link do vídeo",
      text: "No TikTok, X ou Facebook, toque em Compartilhar e depois em Copiar link.",
    });
  });

  it("prices both pt-BR offers in BRL", () => {
    renderPage("pt-br", "home");

    expect(structuredData("WebApplication")?.offers).toEqual([
      { name: "Grátis até 720p", price: "0", priceCurrency: "BRL" },
      { name: "Full HD 1080p", price: "2.00", priceCurrency: "BRL" },
    ]);
  });

  it.each(["en", "es", "id"] as const)("lists only the free offer on %s, with no BRL anywhere", (locale) => {
    renderPage(locale, "tiktok");

    expect(structuredData("WebApplication")?.offers?.map((offer) => offer.price)).toEqual(["0"]);
    expect(structuredDataScripts().join("")).not.toContain("BRL");
  });

  it("anchors the WebSite and the WebApplication on one Organization", () => {
    renderPage("es", "home");

    expect(structuredData("Organization")).toEqual({
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      logo: "https://nowvi.test/icon.svg",
    });
    expect(structuredData("WebSite")).toEqual({
      "@type": "WebSite",
      "@id": "https://nowvi.test/es#website",
      inLanguage: "es",
      publisher: { "@id": ORGANIZATION_ID },
    });
    expect(structuredData("WebApplication")?.publisher).toEqual({ "@id": ORGANIZATION_ID });
  });

  it("gives a landing a breadcrumb from the locale home", () => {
    renderPage("en", "tiktok");

    expect(structuredData("BreadcrumbList")?.itemListElement).toEqual([
      { position: 1, name: "Nowvi", item: "https://nowvi.test/en" },
      { position: 2, name: "TikTok", item: "https://nowvi.test/en/tiktok-video-downloader" },
    ]);
  });

  it("leaves the breadcrumb off the home page", () => {
    renderPage("en", "home");

    expect(structuredData("BreadcrumbList")).toBeUndefined();
  });
});

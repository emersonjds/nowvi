import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { renderPage } from "@/test/render-page";

const jsonLdSchema = z.object({
  "@type": z.string(),
  step: z.array(z.object({ text: z.string() })).optional(),
  offers: z.array(z.object({ name: z.string(), price: z.string() })).optional(),
});

const structuredData = (type: string) =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map((script) => jsonLdSchema.parse(JSON.parse(script.textContent ?? "")))
    .find((data) => data["@type"] === type);

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

  it("uses the step title as the HowTo text when the step has none", () => {
    renderPage("pt-br", "x");

    expect(structuredData("HowTo")?.step?.map((step) => step.text)).toEqual([
      "Abra o post e toque em compartilhar, abaixo do post.",
      'Toque em "Copiar link".',
      'Cole o link no Nowvi e toque em "Baixar Agora".',
    ]);
  });

  it.each([
    ["pt-br", ["0", "2.00"]],
    ["en", ["0"]],
  ] as const)("lists the %s offers in the structured data", (locale, prices) => {
    renderPage(locale, "home");

    expect(structuredData("WebApplication")?.offers?.map((offer) => offer.price)).toEqual(prices);
  });
});

import { describe, expect, it } from "vitest";

import { pageMetadata } from "./landings";

describe("pageMetadata", () => {
  it("points the Open Graph and X cards at the landing's own image, with size and alt", () => {
    const metadata = pageMetadata("en", "tiktok");
    const image = {
      url: "/en/tiktok-video-downloader/opengraph-image",
      width: 1200,
      height: 630,
      alt: "TikTok video downloader without watermark",
      type: "image/png",
    };

    expect(metadata.openGraph?.images).toEqual([image]);
    expect(metadata.twitter?.images).toEqual([image]);
  });

  it("gives each locale home its own image", () => {
    expect(pageMetadata("pt-br", "home").openGraph?.images).toEqual([
      expect.objectContaining({ url: "/pt-br/opengraph-image", alt: "Baixe vídeos de qualquer rede, num lugar só." }),
    ]);
  });
});

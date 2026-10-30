import { describe, expect, it } from "vitest";

import { pageJsonLd } from "./json-ld";

const page = {
  siteUrl: "https://nowvi.test",
  homeUrl: "https://nowvi.test/en",
  url: "https://nowvi.test/en",
  name: "Nowvi",
  description: "Download videos.",
  inLanguage: "en",
  offers: [],
  steps: [],
  faq: [],
  breadcrumbs: [],
};

describe("pageJsonLd", () => {
  it("lists the live profiles as the Organization's sameAs", () => {
    const [organization] = pageJsonLd({ ...page, profiles: ["https://github.com/nowvi"] });

    expect(organization).toMatchObject({ "@type": "Organization", sameAs: ["https://github.com/nowvi"] });
  });

  it("leaves sameAs out while no profile is live", () => {
    const [organization] = pageJsonLd({ ...page, profiles: [] });

    expect(organization).not.toHaveProperty("sameAs");
  });
});

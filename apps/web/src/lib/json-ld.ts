type Step = { title: string; text?: string };
type Question = { question: string; answer: string };
type Offer = { name: string; price: string; priceCurrency?: string };
type Breadcrumb = { name: string; url: string };

type JsonLdPage = {
  siteUrl: string;
  homeUrl: string;
  url: string;
  name: string;
  description: string;
  inLanguage: string;
  offers: Offer[];
  steps: Step[];
  faq: Question[];
  breadcrumbs: Breadcrumb[];
  profiles: string[];
};

const CONTEXT = "https://schema.org";

export const serializeJsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

export const pageJsonLd = (page: JsonLdPage) => {
  const organizationId = new URL("/#organization", page.siteUrl).href;
  const publisher = { "@id": organizationId };
  return [
    {
      "@context": CONTEXT,
      "@type": "Organization",
      "@id": organizationId,
      name: "Nowvi",
      url: new URL("/", page.siteUrl).href,
      logo: new URL("/icon.svg", page.siteUrl).href,
      ...(page.profiles.length > 0 && { sameAs: page.profiles }),
    },
    {
      "@context": CONTEXT,
      "@type": "WebSite",
      "@id": `${page.homeUrl}#website`,
      name: "Nowvi",
      url: page.homeUrl,
      inLanguage: page.inLanguage,
      publisher,
    },
    {
      "@context": CONTEXT,
      "@type": "WebApplication",
      name: "Nowvi",
      url: page.url,
      description: page.description,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      inLanguage: page.inLanguage,
      publisher,
      offers: page.offers.map((offer) => ({ "@type": "Offer", ...offer })),
    },
    ...(page.breadcrumbs.length > 0
      ? [
          {
            "@context": CONTEXT,
            "@type": "BreadcrumbList",
            itemListElement: page.breadcrumbs.map(({ name, url }, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name,
              item: url,
            })),
          },
        ]
      : []),
    {
      "@context": CONTEXT,
      "@type": "FAQPage",
      inLanguage: page.inLanguage,
      mainEntity: page.faq.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
    {
      "@context": CONTEXT,
      "@type": "HowTo",
      name: page.name,
      inLanguage: page.inLanguage,
      step: page.steps.map(({ title, text }, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        ...(text ? { name: title, text } : { text: title }),
      })),
    },
  ];
};

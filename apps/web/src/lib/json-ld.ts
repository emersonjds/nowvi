type Step = { title: string; text?: string };
type Question = { question: string; answer: string };
type Offer = { name: string; price: string };

type JsonLdPage = {
  url: string;
  name: string;
  description: string;
  inLanguage: string;
  offers: Offer[];
  steps: Step[];
  faq: Question[];
};

export const serializeJsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

export const pageJsonLd = ({ url, name, description, inLanguage, offers, steps, faq }: JsonLdPage) => [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Nowvi",
    url,
    description,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    inLanguage,
    offers: offers.map((offer) => ({ "@type": "Offer", ...offer, priceCurrency: "BRL" })),
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage,
    mainEntity: faq.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    inLanguage,
    step: steps.map(({ title, text }, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: title,
      text: text ?? title,
    })),
  },
];

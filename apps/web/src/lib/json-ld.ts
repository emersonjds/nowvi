type Step = { title: string; text?: string };
type Question = { question: string; answer: string };

type JsonLdPage = { url: string; name: string; description: string; steps: Step[]; faq: Question[] };

export const serializeJsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

export const pageJsonLd = ({ url, name, description, steps, faq }: JsonLdPage) => [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Nowvi",
    url,
    description,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    inLanguage: "pt-BR",
    offers: [
      { "@type": "Offer", name: "Grátis até 720p", price: "0", priceCurrency: "BRL" },
      { "@type": "Offer", name: "Full HD 1080p", price: "2.00", priceCurrency: "BRL" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "pt-BR",
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
    inLanguage: "pt-BR",
    step: steps.map(({ title, text }, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: title,
      text: text ?? title,
    })),
  },
];

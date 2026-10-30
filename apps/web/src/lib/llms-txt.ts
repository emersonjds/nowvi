import { absoluteUrl } from "@/config/app-config";
import { LOCALE_INFO, LOCALES, type Locale } from "@/i18n/config";
import { getDictionary, PAGE_KEYS, type PageKey, pageContent, pagePath } from "@/i18n/dictionary";

const FULL_TEXT_PATH = "/llms-full.txt";

const pageLink = (locale: Locale, page: PageKey) =>
  `[${pageContent(locale, page).heading}](${absoluteUrl(pagePath(locale, page))})`;

const header = (locale: Locale) => {
  const { home } = getDictionary(locale);
  return ["# Nowvi", "", `> ${home.description}`, "", home.subtitle, ""];
};

export const llmsTxt = (locale: Locale) => {
  const { llms } = getDictionary(locale);
  return [
    ...header(locale),
    `## ${llms.pages}`,
    "",
    ...PAGE_KEYS.map((page) => `- ${pageLink(locale, page)}: ${pageContent(locale, page).description}`),
    "",
    `## ${llms.languages}`,
    "",
    ...LOCALES.map((other) => `- [${LOCALE_INFO[other].name}](${absoluteUrl(`/${other}/llms.txt`)})`),
    "",
    "## Optional",
    "",
    `- [llms-full.txt](${absoluteUrl(FULL_TEXT_PATH)}): ${llms.fullText}`,
    "",
  ].join("\n");
};

const localeFaq = (locale: Locale) => [
  `## ${LOCALE_INFO[locale].name}`,
  "",
  ...PAGE_KEYS.flatMap((page) => {
    const { description, faq } = pageContent(locale, page);
    return [
      `### ${pageLink(locale, page)}`,
      "",
      description,
      "",
      ...faq.flatMap(({ question, answer }) => [`#### ${question}`, "", answer, ""]),
    ];
  }),
];

export const llmsFullTxt = () => [...header("en"), ...LOCALES.flatMap(localeFaq)].join("\n");

export const textResponse = (body: string) =>
  new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" } });

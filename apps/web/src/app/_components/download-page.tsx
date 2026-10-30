import type { ReactNode } from "react";

import Link from "next/link";

import { APP_CONFIG, absoluteUrl } from "@/config/app-config";
import { LOCALE_INFO, type Locale } from "@/i18n/config";
import { getDictionary, LANDING_IDS, type PageKey, pageContent, pagePath } from "@/i18n/dictionary";
import { pageJsonLd, serializeJsonLd } from "@/lib/json-ld";

import { CookieBanner } from "./cookie-banner";
import { Downloader } from "./downloader";
import { Faq } from "./faq";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

const linkClass =
  "bg-card hover:border-primary hover:text-primary flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold";

type DownloadPageProps = { locale: Locale; page: PageKey; children?: ReactNode };

export const DownloadPage = ({ locale, page, children }: DownloadPageProps) => {
  const dictionary = getDictionary(locale);
  const content = pageContent(locale, page);
  const homePath = pagePath(locale, "home");
  const { highlight } = dictionary.home;
  const homeUrl = absoluteUrl(homePath);
  const url = absoluteUrl(pagePath(locale, page));
  const jsonLd = pageJsonLd({
    siteUrl: APP_CONFIG.url,
    homeUrl,
    url,
    name: content.heading,
    description: content.description,
    inLanguage: LOCALE_INFO[locale].htmlLang,
    offers: dictionary.client.features.fullHdPix
      ? [
          { name: dictionary.offers.free, price: "0", priceCurrency: "BRL" },
          { name: dictionary.offers.fullHd, price: "2.00", priceCurrency: "BRL" },
        ]
      : [{ name: dictionary.offers.free, price: "0" }],
    steps: content.steps,
    faq: content.faq,
    breadcrumbs:
      page === "home"
        ? []
        : [
            { name: APP_CONFIG.name, url: homeUrl },
            { name: dictionary.landings[page].network, url },
          ],
    profiles: APP_CONFIG.profiles,
  });

  return (
    <>
      {jsonLd.map((schema) => (
        <script
          key={schema["@type"]}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD built from static copy, with "<" escaped
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
      <SiteHeader locale={locale} page={page} />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-16 px-4 pt-8 pb-16 md:pt-12">
        <Downloader
          hero={
            <Hero
              badge={dictionary.hero.badge}
              subtitle={content.subtitle}
              title={
                page === "home" ? (
                  <>
                    {content.heading.replace(highlight, "")}
                    <span className="text-primary">{highlight}</span>
                  </>
                ) : (
                  content.heading
                )
              }
            />
          }
        />
        <HowItWorks steps={content.steps} copy={dictionary.howItWorks} />
        <Faq questions={content.faq} copy={dictionary.faq} />
        <nav aria-labelledby="redes-titulo" className="flex flex-col items-center gap-4 text-center">
          <h2 id="redes-titulo" className="text-lg font-bold tracking-tight">
            {dictionary.networks.title}
          </h2>
          <ul className="flex flex-wrap justify-center gap-2">
            {page !== "home" && (
              <li>
                <Link href={homePath} className={linkClass}>
                  {dictionary.networks.all}
                </Link>
              </li>
            )}
            {LANDING_IDS.filter((id) => id !== page).map((id) => (
              <li key={id}>
                <Link href={pagePath(locale, id)} className={linkClass}>
                  {dictionary.landings[id].network}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {children}
      </main>
      <SiteFooter locale={locale} />
      <CookieBanner />
    </>
  );
};

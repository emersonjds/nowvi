import type { ReactNode } from "react";

import Link from "next/link";

import { APP_CONFIG } from "@/config/app-config";
import { pageJsonLd, serializeJsonLd } from "@/lib/json-ld";

import { LANDINGS, type PageContent } from "../_content/landings";
import { CookieBanner } from "./cookie-banner";
import { Downloader } from "./downloader";
import { Faq } from "./faq";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

const linkClass =
  "bg-card hover:border-primary hover:text-primary flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold";

type DownloadPageProps = { content: PageContent; title?: ReactNode; children?: ReactNode };

export const DownloadPage = ({ content, title, children }: DownloadPageProps) => {
  const jsonLd = pageJsonLd({
    url: new URL(content.path, APP_CONFIG.url).href,
    name: content.heading,
    description: content.description,
    steps: content.steps,
    faq: content.faq,
  });
  const isHome = content.path === "/";

  return (
    <>
      {jsonLd.map((data) => (
        <script
          key={data["@type"]}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD built from static copy, with "<" escaped
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
        />
      ))}
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-16 px-4 pt-8 pb-16 md:pt-12">
        <Downloader hero={<Hero title={title ?? content.heading} subtitle={content.subtitle} />} />
        <HowItWorks steps={content.steps} />
        <Faq questions={content.faq} />
        <nav aria-labelledby="redes-titulo" className="flex flex-col items-center gap-4 text-center">
          <h2 id="redes-titulo" className="text-lg font-bold tracking-tight">
            Baixar de uma rede específica
          </h2>
          <ul className="flex flex-wrap justify-center gap-2">
            {!isHome && (
              <li>
                <Link href="/" className={linkClass}>
                  Todas as redes
                </Link>
              </li>
            )}
            {LANDINGS.filter((landing) => landing.path !== content.path).map((landing) => (
              <li key={landing.slug}>
                <Link href={landing.path} className={linkClass}>
                  {landing.network}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {children}
      </main>
      <SiteFooter />
      <CookieBanner />
    </>
  );
};

import type { Metadata } from "next";

import { getDictionary, resolveLocale } from "@/i18n/dictionary";

import { DownloadPage } from "../_components/download-page";
import { LegalSections } from "../_components/legal-sections";
import { pageMetadata } from "../_content/landings";

type HomeProps = { params: Promise<{ lang: string }> };

export const generateMetadata = async ({ params }: HomeProps): Promise<Metadata> =>
  pageMetadata(await resolveLocale(params), "home");

export default async function Home({ params }: HomeProps) {
  const locale = await resolveLocale(params);
  return (
    <DownloadPage locale={locale} page="home">
      <LegalSections legal={getDictionary(locale).legal} />
    </DownloadPage>
  );
}

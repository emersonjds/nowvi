import type { Metadata } from "next";

import { LOCALES } from "@/i18n/config";
import { getDictionary, LANDING_IDS, landingBySlug, resolveLocale } from "@/i18n/dictionary";

import { DownloadPage } from "../../_components/download-page";
import { pageMetadata } from "../../_content/landings";

type LandingProps = { params: Promise<{ lang: string; slug: string }> };

export const dynamicParams = false;

export const generateStaticParams = () =>
  LOCALES.flatMap((lang) => LANDING_IDS.map((id) => ({ lang, slug: getDictionary(lang).landings[id].slug })));

const findLanding = async (params: LandingProps["params"]) => {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  return { locale, page: landingBySlug(locale, slug) };
};

export const generateMetadata = async ({ params }: LandingProps): Promise<Metadata> => {
  const { locale, page } = await findLanding(params);
  return pageMetadata(locale, page);
};

export default async function LandingPage({ params }: LandingProps) {
  const { locale, page } = await findLanding(params);
  return <DownloadPage locale={locale} page={page} />;
}

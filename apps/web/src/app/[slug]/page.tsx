import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { ptBr } from "@/i18n/dictionaries/pt-br";

import { DownloadPage } from "../_components/download-page";
import { LANDING_IDS, pageMetadata } from "../_content/landings";

type LandingProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export const generateStaticParams = () => LANDING_IDS.map((id) => ({ slug: ptBr.landings[id].slug }));

const findLanding = async (params: LandingProps["params"]) => {
  const { slug } = await params;
  return LANDING_IDS.find((id) => ptBr.landings[id].slug === slug) ?? notFound();
};

export const generateMetadata = async ({ params }: LandingProps): Promise<Metadata> =>
  pageMetadata(ptBr, await findLanding(params));

export default async function LandingPage({ params }: LandingProps) {
  return <DownloadPage dictionary={ptBr} page={await findLanding(params)} />;
}

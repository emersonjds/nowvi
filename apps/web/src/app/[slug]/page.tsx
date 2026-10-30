import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { DownloadPage } from "../_components/download-page";
import { LANDINGS, pageMetadata } from "../_content/landings";

type LandingProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export const generateStaticParams = () => LANDINGS.map(({ slug }) => ({ slug }));

const findLanding = async (params: LandingProps["params"]) => {
  const { slug } = await params;
  return LANDINGS.find((landing) => landing.slug === slug) ?? notFound();
};

export const generateMetadata = async ({ params }: LandingProps): Promise<Metadata> =>
  pageMetadata(await findLanding(params));

export default async function LandingPage({ params }: LandingProps) {
  return <DownloadPage content={await findLanding(params)} />;
}

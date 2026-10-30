import { landingBySlug, pageContent, resolveLocale } from "@/i18n/dictionary";

import { ogImage } from "../../_content/og-image";

export { generateStaticParams } from "./page";

export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  return ogImage(pageContent(locale, landingBySlug(locale, slug)).heading);
}

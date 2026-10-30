import { LOCALES } from "@/i18n/config";
import { pageContent, resolveLocale } from "@/i18n/dictionary";

import { ogImage } from "../_content/og-image";

export const contentType = "image/png";

export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  return ogImage(pageContent(await resolveLocale(params), "home").heading);
}

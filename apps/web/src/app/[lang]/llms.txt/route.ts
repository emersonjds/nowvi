import { LOCALES } from "@/i18n/config";
import { resolveLocale } from "@/i18n/dictionary";
import { llmsTxt, textResponse } from "@/lib/llms-txt";

export const dynamicParams = false;

export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

export const GET = async (_request: Request, { params }: { params: Promise<{ lang: string }> }) =>
  textResponse(llmsTxt(await resolveLocale(params)));

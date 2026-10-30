import type { ReactNode } from "react";

import { Plus_Jakarta_Sans } from "next/font/google";

import type { Metadata } from "next";

import { APP_CONFIG } from "@/config/app-config";
import { DictionaryProvider } from "@/i18n/client";
import { LOCALE_INFO, LOCALES } from "@/i18n/config";
import { getDictionary, resolveLocale } from "@/i18n/dictionary";

import "../globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

type RootLayoutProps = Readonly<{ children: ReactNode; params: Promise<{ lang: string }> }>;

export const dynamicParams = false;

export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

export const generateMetadata = async ({ params }: Pick<RootLayoutProps, "params">): Promise<Metadata> => {
  const locale = await resolveLocale(params);
  const { home } = getDictionary(locale);
  return {
    metadataBase: new URL(APP_CONFIG.url),
    applicationName: APP_CONFIG.name,
    authors: [{ name: APP_CONFIG.name }],
    title: home.title,
    description: home.description,
    keywords: home.keywords,
    openGraph: { type: "website", siteName: APP_CONFIG.name, locale: LOCALE_INFO[locale].ogLocale },
    twitter: { card: "summary_large_image" },
  };
};

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const locale = await resolveLocale(params);

  return (
    <html lang={LOCALE_INFO[locale].htmlLang} className={jakarta.variable}>
      <body className="min-h-screen antialiased">
        <DictionaryProvider value={getDictionary(locale).client}>{children}</DictionaryProvider>
      </body>
    </html>
  );
}

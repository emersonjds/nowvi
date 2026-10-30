import type { ReactNode } from "react";

import { Plus_Jakarta_Sans } from "next/font/google";

import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";

import { APP_CONFIG } from "@/config/app-config";
import { DictionaryProvider } from "@/i18n/client";
import { ptBr } from "@/i18n/dictionaries/pt-br";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.url),
  applicationName: APP_CONFIG.name,
  authors: [{ name: APP_CONFIG.name }],
  title: ptBr.home.title,
  description: ptBr.home.description,
  keywords: ptBr.home.keywords,
  openGraph: {
    type: "website",
    siteName: APP_CONFIG.name,
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={jakarta.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <DictionaryProvider value={ptBr.client}>{children}</DictionaryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
